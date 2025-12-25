# 📦 Deploy da Edge Function: get-funnel-metrics

Existem 3 formas de fazer o deploy da Edge Function. Escolha a que preferir:

---

## 🎯 **Opção 1: Via Supabase CLI (Recomendado)**

### Pré-requisitos:
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
cd dashboard-metas-vendas
supabase link --project-ref SEU_PROJECT_REF
```

### Deploy:
```bash
# Executar script de deploy
./deploy-edge-function.sh

# Ou manualmente:
supabase functions deploy get-funnel-metrics
```

### Testar:
```bash
# Via Supabase CLI
supabase functions invoke get-funnel-metrics \
  --data '{"month":12,"year":2025,"funnel":"marketing"}'

# Via curl
curl -X GET \
  'https://SEU_PROJECT_REF.supabase.co/functions/v1/get-funnel-metrics?month=12&year=2025&funnel=marketing' \
  -H "Authorization: Bearer SEU_ANON_KEY"
```

---

## 🌐 **Opção 2: Via Supabase Dashboard (Mais Fácil)**

### Passo a passo:

1. **Acesse o Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Selecione o projeto: **dashboard**

2. **Vá para Edge Functions**
   - Menu lateral → **Edge Functions**

3. **Criar/Atualizar Função**
   - Se não existe: Clique em **"New Function"**
   - Se já existe: Selecione `get-funnel-metrics` e clique em **"New Version"**

4. **Configurar Função**
   - **Nome**: `get-funnel-metrics`
   - **Código**: Cole o conteúdo do arquivo:
     ```
     supabase/functions/get-funnel-metrics/index.ts
     ```

5. **Adicionar Arquivo Compartilhado (IMPORTANTE!)**
   - A função usa `import { corsHeaders } from '../_shared/cors.ts';`
   - Você precisa criar também a função `_shared/cors`:
     
     **Nome**: `_shared/cors`
     **Código**:
     ```typescript
     export const corsHeaders = {
       'Access-Control-Allow-Origin': '*',
       'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
     };
     ```

6. **Deploy**
   - Clique em **"Deploy"**
   - Aguarde a confirmação

7. **Testar**
   - Vá para a aba **"Invocations"**
   - Clique em **"Test Function"**
   - Query params:
     ```
     month=12
     year=2025
     funnel=marketing
     ```

---

## 📋 **Opção 3: Via GitHub Actions (Automático)**

Se você configurar GitHub Actions, o deploy pode ser automático a cada push.

### Criar arquivo: `.github/workflows/deploy-edge-functions.yml`

```yaml
name: Deploy Edge Functions

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Deploy Edge Functions
        run: supabase functions deploy get-funnel-metrics
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
```

### Configurar Secrets no GitHub:
1. Vá em: `Settings` → `Secrets and variables` → `Actions`
2. Adicione:
   - `SUPABASE_ACCESS_TOKEN`: Token de acesso do Supabase
   - `SUPABASE_PROJECT_ID`: ID do projeto

---

## ✅ **Verificação Pós-Deploy**

### 1. Verificar se a função está ativa:
```bash
supabase functions list
```

### 2. Testar endpoint:

**Funil Comercial:**
```bash
curl -X GET \
  'https://SEU_PROJECT_REF.supabase.co/functions/v1/get-funnel-metrics?month=12&year=2025&funnel=comercial' \
  -H "Authorization: Bearer SEU_ANON_KEY"
```

**Funil de Marketing:**
```bash
curl -X GET \
  'https://SEU_PROJECT_REF.supabase.co/functions/v1/get-funnel-metrics?month=12&year=2025&funnel=marketing' \
  -H "Authorization: Bearer SEU_ANON_KEY"
```

### 3. Resposta esperada:

**Funil Comercial:**
```json
{
  "funnel": "comercial",
  "period": {
    "month": 12,
    "year": 2025,
    "startDate": "2025-12-01T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.999Z"
  },
  "metrics": {
    "agendamentos": 320,
    "contatos": 280,
    "vendas": 42,
    "receita": 210000,
    "taxaConversao": 15.00,
    "taxaAgendamento": 114.29,
    "noShow": 45,
    "taxaPresenca": 85.94
  }
}
```

**Funil de Marketing:**
```json
{
  "funnel": "marketing",
  "period": {
    "month": 12,
    "year": 2025,
    "startDate": "2025-12-01T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.999Z"
  },
  "metrics": {
    "leads": 1250,
    "vendas": 85,
    "receita": 425000,
    "custoTotal": 45000,
    "cpl": 36.00,
    "cpa": 529.41,
    "taxaConversao": 6.80
  }
}
```

---

## 🐛 **Troubleshooting**

### Erro: "Function not found"
- Verifique se o nome está correto: `get-funnel-metrics`
- Verifique se fez deploy no projeto correto

### Erro: "CORS error"
- Verifique se o arquivo `_shared/cors.ts` foi deployado
- Verifique se a importação está correta

### Erro: "Month must be an integer between 1 and 12"
- Validação funcionando! Passe parâmetros corretos
- Exemplo: `?month=12&year=2025&funnel=marketing`

### Erro: "Unauthorized"
- Verifique se está passando o header `Authorization: Bearer SEU_ANON_KEY`
- Verifique se a função está pública nas configurações

---

## 📝 **Onde encontrar as credenciais:**

1. **PROJECT_REF**:
   - Dashboard → Settings → General → Reference ID

2. **ANON_KEY**:
   - Dashboard → Settings → API → Project API keys → `anon` `public`

3. **SERVICE_ROLE_KEY** (não exponha!):
   - Dashboard → Settings → API → Project API keys → `service_role` `secret`

---

## 🎉 **Próximos Passos**

Após o deploy bem-sucedido:

1. ✅ Integrar com a página `/metrics` no frontend
2. ✅ Substituir dados mockados por chamadas reais à API
3. ✅ Testar com dados reais do banco
4. ✅ Monitorar logs e performance

---

**Precisa de ajuda?** Entre em contato ou abra uma issue no repositório.
