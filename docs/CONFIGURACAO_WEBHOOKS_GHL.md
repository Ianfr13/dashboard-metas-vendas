# Guia de Configuração: Webhooks do GoHighLevel

**Autor:** Manus AI  
**Data:** 26 de Dezembro de 2025  
**Versão:** 1.0

---

## 1. Pré-requisitos

Antes de configurar os webhooks, você precisa:

1. **Acesso de Administrador ao GoHighLevel** - Para criar aplicações OAuth e configurar webhooks
2. **Edge Function Deployada** - A função `webhook-receiver` deve estar publicada no Supabase
3. **URL Pública da Edge Function** - Exemplo: `https://qjbhqpvfbqbsxhxvxnqo.supabase.co/functions/v1/webhook-receiver`

## 2. Passo a Passo: Criar Aplicação OAuth no GHL

### 2.1. Acessar o Marketplace

1. Faça login no GoHighLevel
2. Acesse: **Settings** → **Marketplace** → **My Apps**
3. Clique em **Create App**

### 2.2. Configurar a Aplicação

Preencha os campos:

| Campo | Valor |
| :--- | :--- |
| **App Name** | Dashboard Metas Vendas |
| **App Type** | Private App |
| **Description** | Integração em tempo real para dashboard de vendas |
| **Webhook URL** | `https://qjbhqpvfbqbsxhxvxnqo.supabase.co/functions/v1/webhook-receiver` |

### 2.3. Definir Scopes (Permissões)

Selecione os seguintes scopes para permitir que a aplicação acesse os dados necessários:

**Obrigatórios:**
- ✅ `contacts.readonly` - Ler contatos
- ✅ `contacts.write` - Escrever contatos (para sincronização)
- ✅ `opportunities.readonly` - Ler oportunidades
- ✅ `opportunities.write` - Escrever oportunidades
- ✅ `calendars.readonly` - Ler agendamentos
- ✅ `calendars.write` - Escrever agendamentos
- ✅ `users.readonly` - Ler usuários

**Recomendados (para funcionalidades futuras):**
- ⚠️ `tasks.readonly` - Ler tarefas
- ⚠️ `invoices.readonly` - Ler faturas
- ⚠️ `notes.readonly` - Ler notas

### 2.4. Salvar e Obter Credenciais

1. Clique em **Save**
2. Anote as credenciais geradas:
   - **Client ID**
   - **Client Secret**
   - **API Key**
3. Guarde essas credenciais em local seguro (você precisará delas para configurar o Supabase)

## 3. Configurar Webhooks na Aplicação

### 3.1. Acessar Configurações de Webhooks

1. Na página da sua aplicação, vá para a aba **Webhooks**
2. Confirme que a **Webhook URL** está correta
3. Clique em **Add Webhook Events**

### 3.2. Selecionar Eventos

Marque os seguintes eventos para receber notificações em tempo real:

#### Oportunidades (Essencial)
- ✅ `OpportunityCreate` - Quando uma oportunidade é criada
- ✅ `OpportunityUpdate` - Quando uma oportunidade é atualizada
- ✅ `OpportunityDelete` - Quando uma oportunidade é deletada
- ✅ `OpportunityStageUpdate` - Quando o estágio muda
- ✅ `OpportunityStatusUpdate` - Quando o status muda (won, lost, etc.)

#### Contatos (Essencial)
- ✅ `ContactCreate` - Quando um contato é criado
- ✅ `ContactUpdate` - Quando um contato é atualizado
- ✅ `ContactDelete` - Quando um contato é deletado
- ✅ `ContactTagUpdate` - Quando as tags de um contato mudam

#### Agendamentos (Essencial)
- ✅ `AppointmentCreate` - Quando um agendamento é criado
- ✅ `AppointmentUpdate` - Quando um agendamento é atualizado
- ✅ `AppointmentDelete` - Quando um agendamento é deletado

#### Usuários (Essencial)
- ✅ `UserCreate` - Quando um usuário é criado
- ✅ `UserUpdate` - Quando um usuário é atualizado
- ✅ `UserDelete` - Quando um usuário é deletado

#### Outros (Opcional, para funcionalidades futuras)
- ⚠️ `TaskCreate`, `TaskComplete`, `TaskDelete` - Tarefas
- ⚠️ `InvoicePaid`, `InvoiceCreate` - Faturas
- ⚠️ `NoteCreate`, `NoteUpdate` - Notas

### 3.3. Salvar Configuração

1. Clique em **Save** para ativar os webhooks
2. O GoHighLevel começará a enviar eventos para a sua Edge Function imediatamente

## 4. Configurar Credenciais no Supabase

### 4.1. Acessar o Painel do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto `dashboard-metas-vendas`
3. Vá para **Settings** → **Vault** (ou **Secrets**)

### 4.2. Adicionar Segredos

Crie os seguintes segredos:

| Nome do Segredo | Valor | Descrição |
| :--- | :--- | :--- |
| `GHL_API_KEY` | (sua API Key do GHL) | Chave de API para fazer chamadas REST |
| `GHL_LOCATION_ID` | (seu Location ID) | ID da location/sub-account no GHL |
| `GHL_CLIENT_ID` | (seu Client ID) | ID do cliente OAuth (opcional, para futuro) |
| `GHL_CLIENT_SECRET` | (seu Client Secret) | Segredo do cliente OAuth (opcional, para futuro) |
| `REQUIRE_WEBHOOK_SIGNATURE` | `true` | **OBRIGATÓRIO EM PRODUÇÃO:** Ativa verificação de assinatura RSA |

### 4.3. Aplicar as Migrations

Execute os seguintes comandos no terminal (ou use o painel do Supabase):

```bash
# Aplicar a migration que cria as tabelas
supabase db push

# Ou, se estiver usando o painel:
# 1. Vá para Database → Migrations
# 2. Cole o conteúdo do arquivo 20251226150000_create_ghl_realtime_tables.sql
# 3. Clique em "Run"
```

### 4.4. Deploy da Edge Function

Execute o comando para fazer deploy da função:

```bash
supabase functions deploy webhook-receiver
```

## 5. Testar a Integração

### 5.1. Teste Manual

1. No GoHighLevel, crie uma nova oportunidade
2. Acesse o painel do Supabase
3. Vá para **Database** → **Tables** → `ghl_webhook_logs`
4. Verifique se um novo registro foi criado com `status = 'processado'`
5. Vá para **Tables** → `ghl_opportunities`
6. Verifique se a oportunidade foi inserida

### 5.2. Verificar Logs

Para ver os logs da Edge Function:

```bash
supabase functions logs webhook-receiver --tail
```

Ou no painel do Supabase:
1. Vá para **Edge Functions** → `webhook-receiver`
2. Clique na aba **Logs**

### 5.3. Testar Diferentes Eventos

Teste os seguintes cenários:

- ✅ Criar uma oportunidade
- ✅ Mover uma oportunidade para outro estágio
- ✅ Marcar uma oportunidade como "Won"
- ✅ Criar um contato
- ✅ Adicionar uma tag a um contato
- ✅ Criar um agendamento

Para cada ação, verifique se:
1. O webhook foi recebido (registro em `ghl_webhook_logs`)
2. O dado foi atualizado na tabela correspondente
3. Não há erros nos logs

## 6. Troubleshooting

### Problema: Webhooks não estão chegando

**Possíveis causas:**
- URL do webhook incorreta
- Edge Function não está deployada
- Firewall bloqueando requisições do GHL

**Solução:**
1. Verifique a URL configurada no GHL
2. Teste a Edge Function manualmente: `curl -X POST https://sua-url/webhook-receiver`
3. Verifique os logs do Supabase

### Problema: Webhooks chegam mas não são processados

**Possíveis causas:**
- Erro na lógica de processamento
- Tabelas não foram criadas
- Permissões RLS incorretas

**Solução:**
1. Verifique os logs da Edge Function
2. Verifique se as tabelas existem no banco
3. Verifique as políticas RLS

### Problema: Dados duplicados

**Possíveis causas:**
- Idempotência não está funcionando
- Webhook sendo enviado múltiplas vezes pelo GHL

**Solução:**
1. Verifique se o índice único em `webhook_id` foi criado
2. Verifique os logs para identificar webhooks duplicados

## 7. Próximos Passos

Após configurar os webhooks com sucesso:

1. **Implementar a Fase 2:** Criar a interface de administração para monitorar webhooks
2. **Sincronização Histórica:** Usar a Edge Function `sync-ghl` para importar dados antigos
3. **Frontend Realtime:** Configurar o frontend para escutar mudanças nas tabelas

---

**Dúvidas?** Consulte a documentação oficial do GoHighLevel: https://marketplace.gohighlevel.com/docs/webhook/
