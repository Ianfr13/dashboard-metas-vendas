# 🔒 Guia de Segurança para Produção

**Data:** 24 de Dezembro de 2024  
**Projeto:** Dashboard Metas Vendas

---

## ⚠️ IMPORTANTE: Configuração Atual

Atualmente, a Edge Function `get-dashboard-data` está configurada com **JWT DESABILITADO** para facilitar o desenvolvimento e testes.

```json
{
  "verify_jwt": false  // ⚠️ INSEGURO PARA PRODUÇÃO
}
```

Isso significa que **qualquer pessoa** pode acessar os dados do dashboard sem autenticação!

---

## 🔐 Como Reabilitar JWT para Produção

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard/project/auvvrewlbpyymekonilv)
2. Vá em **Edge Functions** → **get-dashboard-data**
3. Clique em **Settings**
4. Ative **"Verify JWT"**
5. Clique em **Save**

### Opção 2: Via Código + Deploy

1. Editar `supabase/functions/get-dashboard-data/index.ts`:

```typescript
// ANTES (desenvolvimento - INSEGURO)
const authHeader = req.headers.get('Authorization');
let user = null;
if (authHeader) {
  const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
  if (!userError && authUser) {
    user = authUser;
  }
}

// DEPOIS (produção - SEGURO)
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(
    JSON.stringify({ error: 'Missing authorization header' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError || !user) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

2. Fazer deploy com `verify_jwt: true`:

```bash
# Usando MCP CLI
manus-mcp-cli tool call deploy_edge_function --server supabase --input '{
  "project_id": "auvvrewlbpyymekonilv",
  "name": "get-dashboard-data",
  "verify_jwt": true,
  "files": [...]
}'
```

---

## 🛡️ Checklist de Segurança para Produção

### Edge Functions
- [ ] **get-dashboard-data**: Reabilitar `verify_jwt: true`
- [ ] **gtm-event**: Verificar se precisa de autenticação
- [ ] **gtm-analytics**: Verificar se precisa de autenticação
- [ ] **get-ranking-data**: Verificar se precisa de autenticação

### Row Level Security (RLS)
- [ ] **metas_principais**: Habilitar RLS e criar políticas
- [ ] **sub_metas**: Habilitar RLS e criar políticas
- [ ] **gtm_events**: Habilitar RLS e criar políticas
- [ ] **goals**: Habilitar RLS e criar políticas
- [ ] **sub_goals**: Habilitar RLS e criar políticas
- [ ] **products**: Habilitar RLS e criar políticas
- [ ] **simulation_params**: Habilitar RLS e criar políticas

### Variáveis de Ambiente
- [ ] **VITE_SUPABASE_URL**: Configurada no Cloudflare
- [ ] **VITE_SUPABASE_ANON_KEY**: Configurada no Cloudflare
- [ ] **VITE_ANALYTICS_ENDPOINT**: Configurada (opcional)
- [ ] **VITE_ANALYTICS_WEBSITE_ID**: Configurada (opcional)

### Cloudflare Worker
- [ ] **worker.ts**: Validação de `env.ASSETS` implementada ✅
- [ ] **wrangler.jsonc**: Binding correto configurado ✅

---

## 🔍 Como Verificar se JWT está Habilitado

### Teste 1: Chamada sem autenticação (deve falhar)

```bash
curl -s "https://auvvrewlbpyymekonilv.supabase.co/functions/v1/get-dashboard-data"
```

**Resposta esperada com JWT habilitado:**
```json
{
  "error": "Missing authorization header"
}
```

**Resposta atual (JWT desabilitado):**
```json
{
  "meta": null,
  "subMetas": [],
  "totals": { ... }
}
```

### Teste 2: Chamada com token válido (deve funcionar)

```bash
# Obter token do localStorage após login
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -s "https://auvvrewlbpyymekonilv.supabase.co/functions/v1/get-dashboard-data" \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**
```json
{
  "meta": { ... },
  "subMetas": [ ... ],
  "totals": { ... }
}
```

---

## 📋 Políticas RLS Recomendadas

### Exemplo: metas_principais

```sql
-- Habilitar RLS
ALTER TABLE metas_principais ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias metas
CREATE POLICY "Users can view their own metas"
  ON metas_principais
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Política: Usuários podem inserir suas próprias metas
CREATE POLICY "Users can insert their own metas"
  ON metas_principais
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Política: Usuários podem atualizar suas próprias metas
CREATE POLICY "Users can update their own metas"
  ON metas_principais
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Política: Usuários podem deletar suas próprias metas
CREATE POLICY "Users can delete their own metas"
  ON metas_principais
  FOR DELETE
  USING (auth.uid()::text = user_id::text);
```

### Exemplo: gtm_events (público para escrita, privado para leitura)

```sql
-- Habilitar RLS
ALTER TABLE gtm_events ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode inserir eventos (para tracking)
CREATE POLICY "Anyone can insert events"
  ON gtm_events
  FOR INSERT
  WITH CHECK (true);

-- Política: Apenas usuários autenticados podem ler eventos
CREATE POLICY "Authenticated users can read events"
  ON gtm_events
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

---

## 🚨 Riscos de Segurança Atuais

### 🔴 CRÍTICO: Dados Expostos Publicamente

Com JWT desabilitado, qualquer pessoa pode:
- ✅ Ver todas as metas principais
- ✅ Ver todas as sub-metas
- ✅ Ver todos os eventos de vendas (GTM)
- ✅ Ver todos os produtos
- ✅ Ver métricas de vendas

**Impacto:** Vazamento de dados sensíveis de negócio

**Solução:** Reabilitar JWT imediatamente ao ir para produção

### 🟡 MÉDIO: RLS Não Configurado

Mesmo com JWT habilitado, se RLS não estiver configurado, usuários autenticados podem ver dados de outros usuários.

**Impacto:** Vazamento de dados entre usuários

**Solução:** Configurar políticas RLS em todas as tabelas

### 🟢 BAIXO: Analytics Não Configurado

Variáveis de analytics não estão configuradas, mas isso é apenas um aviso.

**Impacto:** Nenhum (funcionalidade opcional)

**Solução:** Configurar se quiser usar analytics

---

## ✅ Próximos Passos

1. **Desenvolvimento/Testes:**
   - ✅ JWT desabilitado (configuração atual)
   - ✅ Fácil de testar sem autenticação
   - ⚠️ **NÃO USAR EM PRODUÇÃO**

2. **Staging/Homologação:**
   - [ ] Habilitar JWT
   - [ ] Configurar RLS básico
   - [ ] Testar com usuários reais

3. **Produção:**
   - [ ] Habilitar JWT ✅
   - [ ] Configurar RLS completo ✅
   - [ ] Configurar variáveis de ambiente ✅
   - [ ] Monitorar logs de segurança
   - [ ] Configurar rate limiting (Cloudflare)

---

## 📚 Recursos

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Cloudflare Workers Security](https://developers.cloudflare.com/workers/platform/security/)

---

**Última atualização:** 24/12/2024  
**Status:** ⚠️ DESENVOLVIMENTO (JWT DESABILITADO)
