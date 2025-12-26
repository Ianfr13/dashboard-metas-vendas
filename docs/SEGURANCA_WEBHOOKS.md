# Segurança e Rate Limiting: Webhooks GoHighLevel

**Autor:** Manus AI  
**Data:** 26 de Dezembro de 2025  
**Versão:** 1.0

---

## 1. Visão Geral

A Edge Function `webhook-receiver` implementa múltiplas camadas de segurança para proteger o sistema contra abuso, ataques e custos excessivos. Este documento descreve todas as proteções implementadas.

## 2. Proteções Implementadas

### 2.1. Rate Limiting (Controle de Taxa de Requisições)

**Objetivo:** Prevenir que um único IP ou origem faça requisições excessivas, protegendo contra ataques DDoS e abuso.

#### Configuração Padrão

| Parâmetro | Valor | Descrição |
| :--- | :--- | :--- |
| **Máximo por Minuto** | 60 requisições | Limite por IP em uma janela de 1 minuto |
| **Máximo por Hora** | 1000 requisições | Limite total por IP em uma hora |
| **Duração do Bloqueio** | 15 minutos | Tempo de bloqueio após exceder o limite |
| **Janela de Tempo** | 1 minuto | Tamanho da janela para contagem |

#### Como Funciona

1. **Identificação:** Cada requisição é identificada pelo IP de origem (`x-forwarded-for` ou `x-real-ip`)
2. **Contagem:** O sistema mantém um contador de requisições por IP em uma janela de tempo
3. **Verificação:** Antes de processar, verifica se o IP excedeu o limite
4. **Bloqueio:** Se exceder, o IP é bloqueado temporariamente
5. **Resposta:** Retorna HTTP 429 (Too Many Requests) com o header `Retry-After`

#### Exemplo de Resposta (Rate Limit Excedido)

```json
{
  "error": "Rate limit exceeded - temporarily blocked",
  "retry_after": 900
}
```

**HTTP Status:** 429 Too Many Requests  
**Header:** `Retry-After: 900` (em segundos)

### 2.2. Validação de Tamanho de Payload

**Objetivo:** Prevenir ataques de exaustão de memória e custos excessivos de processamento.

**Limite:** 1 MB (1.024.000 bytes) por payload

Se o payload exceder esse tamanho, a requisição é rejeitada com:

```json
{
  "error": "Payload too large: 1500000 bytes (max: 1048576)"
}
```

**HTTP Status:** 400 Bad Request

### 2.3. Validação de Estrutura do Payload

**Objetivo:** Garantir que apenas webhooks válidos do GoHighLevel sejam processados.

#### Campos Obrigatórios

- `type` - Tipo do evento (ex: OpportunityCreate)
- `location_id` - ID da location no GHL

#### Tipos de Evento Válidos

Apenas eventos que começam com os seguintes prefixos são aceitos:

- `Opportunity*` - Eventos de oportunidades
- `Contact*` - Eventos de contatos
- `Appointment*` - Eventos de agendamentos
- `User*` - Eventos de usuários
- `Task*` - Eventos de tarefas
- `Invoice*` - Eventos de faturas
- `Note*` - Eventos de notas

Qualquer outro tipo é rejeitado com:

```json
{
  "error": "Invalid event type: UnknownEvent"
}
```

**HTTP Status:** 400 Bad Request

### 2.4. Verificação de Assinatura Digital

**Objetivo:** Garantir que o webhook foi realmente enviado pelo GoHighLevel e não foi adulterado.

**Status:** ✅ Implementado com Web Crypto API

#### Como Funciona

1. O GHL envia o webhook com um header `x-wh-signature` contendo a assinatura RSA em Base64
2. A função importa a chave pública oficial do GHL
3. Usa Web Crypto API (`crypto.subtle.verify`) com algoritmo RSASSA-PKCS1-v1_5 e SHA-256
4. Se a assinatura for inválida, a requisição é rejeitada com HTTP 401

**Resposta (Assinatura Inválida):**

```json
{
  "error": "Invalid signature"
}
```

**HTTP Status:** 401 Unauthorized

### 2.5. Idempotência

**Objetivo:** Prevenir o processamento duplicado do mesmo webhook, mesmo que o GHL envie múltiplas vezes.

#### Como Funciona

1. Cada webhook recebe um ID único: `{type}_{id}_{timestamp}`
2. Antes de processar, o sistema verifica se esse ID já existe na tabela `ghl_webhook_logs`
3. Se já existe, retorna 200 OK sem processar novamente

**Resposta (Webhook Já Processado):**

```json
{
  "message": "Webhook already processed"
}
```

**HTTP Status:** 200 OK

### 2.6. Validação de JSON

**Objetivo:** Prevenir erros de parsing e ataques de injeção.

Se o payload não for um JSON válido:

```json
{
  "error": "Invalid JSON payload"
}
```

**HTTP Status:** 400 Bad Request

## 3. Tabela de Rate Limiting

### Estrutura: `ghl_webhook_rate_limit`

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | UUID | Identificador único |
| `identifier` | TEXT | IP ou identificador único |
| `request_count` | INTEGER | Número de requisições na janela |
| `window_start` | TIMESTAMPTZ | Início da janela de tempo |
| `last_request` | TIMESTAMPTZ | Última requisição recebida |
| `blocked_until` | TIMESTAMPTZ | Se bloqueado, até quando |
| `created_at` | TIMESTAMPTZ | Data de criação |

### Limpeza Automática

A função `clean_old_rate_limit_records()` remove registros mais antigos que 24 horas para manter a tabela limpa e performática.

**Recomendação:** Executar essa função diariamente via Cron Job:

```sql
SELECT clean_old_rate_limit_records();
```

## 4. Monitoramento e Alertas

### 4.1. Logs de Rate Limiting

Todos os bloqueios por rate limiting são logados no console da Edge Function:

```
Rate limit exceeded for ip:192.168.1.1. Blocked until 2025-12-26T12:15:00Z
```

### 4.2. Métricas Recomendadas

Para monitorar a saúde do sistema, recomenda-se acompanhar:

1. **Taxa de Rejeição por Rate Limit:** Quantas requisições são bloqueadas
2. **IPs Bloqueados:** Quais IPs estão sendo bloqueados com frequência
3. **Tamanho Médio de Payload:** Para ajustar o limite se necessário
4. **Taxa de Webhooks Duplicados:** Quantos webhooks são rejeitados por idempotência

### 4.3. Query para Monitoramento

```sql
-- IPs mais bloqueados nas últimas 24 horas
SELECT 
  identifier,
  COUNT(*) as block_count,
  MAX(blocked_until) as last_block
FROM ghl_webhook_rate_limit
WHERE blocked_until IS NOT NULL
  AND created_at > now() - INTERVAL '24 hours'
GROUP BY identifier
ORDER BY block_count DESC
LIMIT 10;
```

## 5. Carregamento Seguro da Chave Pública

### Estratégia de Carregamento

A chave pública do GoHighLevel é carregada de forma hierárquica:

1. **Primeira prioridade:** Variável de ambiente `GHL_PUBLIC_KEY`
2. **Fallback:** Chave oficial do GHL (hard-coded, apenas para desenvolvimento)

### Variável de Ambiente: GHL_PUBLIC_KEY

**Propósito:** Permite configurar uma chave pública personalizada ou atualizada.

**Formato:** PEM (-----BEGIN PUBLIC KEY----- ... -----END PUBLIC KEY-----)

**Quando usar:**
- Se o GoHighLevel atualizar a chave pública
- Para testes com chaves customizadas
- Para seguir políticas de segurança que proíbem hard-coding de chaves

**Configuração no Supabase:**

1. Acesse o painel do Supabase
2. Vá para **Settings** → **Edge Functions** → **webhook-receiver**
3. Adicione a variável de ambiente:
   - **Nome:** `GHL_PUBLIC_KEY`
   - **Valor:** (cole a chave pública PEM completa)

**Exemplo de valor:**
```
-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAokvo/r9tVgcfZ5DysOSC
...
T1hhTiaCeIY/OwwwNUY2yvcCAwEAAQ==
-----END PUBLIC KEY-----
```

### Validação de Formato

A função valida automaticamente o formato PEM da chave antes de usá-la:
- Verifica presença de cabeçalho e rodapé PEM
- Valida estrutura Base64
- Lança erro claro se o formato for inválido

### Comportamento em Produção

Quando `REQUIRE_WEBHOOK_SIGNATURE=true` e `GHL_PUBLIC_KEY` não está definida:
- A função **lança erro** na inicialização
- Mensagem clara: "ERRO DE CONFIGURAÇÃO: GHL_PUBLIC_KEY não está definida"
- Previne uso acidental do fallback em produção

### Comportamento em Desenvolvimento

Quando `REQUIRE_WEBHOOK_SIGNATURE=false` ou não definida:
- Usa a chave fallback (oficial do GHL)
- Exibe aviso no log
- Permite desenvolvimento sem configurar a variável

## 6. Variável de Ambiente: REQUIRE_WEBHOOK_SIGNATURE

### Propósito

Controla se a verificação de assinatura é obrigatória ou opcional.

### Valores

- **`true`:** Verificação obrigatória. Webhooks sem assinatura ou com assinatura inválida são rejeitados.
- **`false` ou não definido:** Verificação opcional. Webhooks sem assinatura são permitidos (modo de desenvolvimento).

### Configuração no Supabase

1. Acesse o painel do Supabase
2. Vá para **Settings** → **Edge Functions** → **webhook-receiver**
3. Adicione a variável de ambiente:
   - **Nome:** `REQUIRE_WEBHOOK_SIGNATURE`
   - **Valor:** `true` (para produção) ou `false` (para desenvolvimento)

### Recomendações

- **Desenvolvimento/Testes:** `false` - Permite testar sem configurar assinaturas
- **Produção:** `true` - **OBRIGATÓRIO** para segurança

### Comportamento

| Cenário | REQUIRE_WEBHOOK_SIGNATURE | Resultado |
| :--- | :--- | :--- |
| Assinatura válida | true ou false | ✅ Webhook processado |
| Assinatura inválida | true | ❌ Rejeitado (HTTP 401) |
| Assinatura inválida | false | ⚠️ Permitido com aviso |
| Sem assinatura | true | ❌ Rejeitado (HTTP 401) |
| Sem assinatura | false | ⚠️ Permitido com aviso |
| Erro na verificação | true | ❌ Rejeitado (HTTP 401) |
| Erro na verificação | false | ⚠️ Permitido com aviso |

## 6. Configuração e Ajustes

### 5.1. Ajustar Limites de Rate Limiting

Para ajustar os limites, edite as constantes no arquivo `webhook-receiver/index.ts`:

```typescript
const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 60,    // Altere aqui
  MAX_REQUESTS_PER_HOUR: 1000,    // Altere aqui
  BLOCK_DURATION_MINUTES: 15,     // Altere aqui
  WINDOW_SIZE_MINUTES: 1,         // Altere aqui
}
```

Após alterar, faça o redeploy da função:

```bash
supabase functions deploy webhook-receiver
```

### 5.2. Ajustar Tamanho Máximo de Payload

```typescript
const SECURITY_CONFIG = {
  MAX_PAYLOAD_SIZE: 1024 * 1024,  // 1MB - Altere aqui
  REQUIRED_FIELDS: ['type', 'location_id'],
}
```

### 5.3. Whitelist de IPs (Futuro)

Para implementar uma whitelist de IPs confiáveis que não sofrem rate limiting:

1. Adicionar coluna `is_whitelisted` na tabela `ghl_webhook_rate_limit`
2. Modificar a função `checkRateLimit` para pular a verificação se `is_whitelisted = true`

## 6. Troubleshooting

### Problema: Webhooks legítimos sendo bloqueados

**Causa:** Limites muito restritivos ou múltiplas instâncias do GHL compartilhando o mesmo IP

**Solução:**
1. Verificar os logs para identificar o IP
2. Aumentar os limites de rate limiting
3. Considerar implementar whitelist para IPs do GHL

### Problema: Custos elevados mesmo com rate limiting

**Causa:** Ataques distribuídos (múltiplos IPs)

**Solução:**
1. Implementar verificação de assinatura RSA (obrigatório!)
2. Adicionar autenticação adicional (API key)
3. Usar Cloudflare ou AWS WAF na frente da Edge Function

### Problema: Tabela de rate limiting crescendo muito

**Causa:** Função de limpeza não está sendo executada

**Solução:**
1. Configurar Cron Job para executar `clean_old_rate_limit_records()` diariamente
2. Ou executar manualmente: `SELECT clean_old_rate_limit_records();`

## 7. Checklist de Segurança

Antes de ir para produção, verifique:

- [ ] Rate limiting configurado e testado
- [ ] Verificação de assinatura RSA implementada (⚠️ PENDENTE)
- [ ] Limites de payload apropriados
- [ ] Validação de campos obrigatórios ativa
- [ ] Idempotência testada
- [ ] Logs de segurança sendo monitorados
- [ ] Função de limpeza agendada
- [ ] Alertas configurados para bloqueios frequentes
- [ ] Backup e disaster recovery planejados

## 8. Próximas Melhorias de Segurança

1. **Implementar Verificação de Assinatura RSA** (Prioridade Alta)
2. **Adicionar Autenticação por API Key** (Opcional)
3. **Implementar Whitelist de IPs** (Opcional)
4. **Adicionar Honeypot para Detectar Bots** (Opcional)
5. **Integrar com WAF (Web Application Firewall)** (Recomendado para produção)

---

**Importante:** A segurança é um processo contínuo. Revise e atualize essas proteções regularmente conforme o sistema evolui e novas ameaças surgem.
