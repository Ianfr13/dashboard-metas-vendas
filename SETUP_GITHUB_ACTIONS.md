# ⚙️ Configurar GitHub Actions para Deploy Automático

Este guia mostra como configurar o deploy automático da Edge Function via GitHub Actions.

---

## 📋 **Passo 1: Criar o Workflow**

Crie o arquivo `.github/workflows/deploy-edge-functions.yml` no seu repositório:

```yaml
name: Deploy Edge Functions

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/functions/**'
  workflow_dispatch: # Permite executar manualmente

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Deploy Edge Functions
        run: |
          echo "🚀 Deploying Edge Functions..."
          supabase functions deploy get-funnel-metrics --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          echo "✅ Deployment completed!"
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Verify Deployment
        run: |
          echo "✅ Edge Function 'get-funnel-metrics' deployed successfully!"
          echo "📋 Test with:"
          echo "curl -X GET 'https://${{ secrets.SUPABASE_PROJECT_REF }}.supabase.co/functions/v1/get-funnel-metrics?month=12&year=2025&funnel=marketing' -H 'Authorization: Bearer YOUR_ANON_KEY'"
```

### **Como criar o arquivo:**

**Opção A: Via GitHub UI**
1. Acesse: https://github.com/Ianfr13/dashboard-metas-vendas
2. Clique em **"Add file"** → **"Create new file"**
3. Nome do arquivo: `.github/workflows/deploy-edge-functions.yml`
4. Cole o conteúdo acima
5. Commit: "ci: adicionar GitHub Actions para deploy automático"

**Opção B: Via Git local**
```bash
# No seu computador local
cd dashboard-metas-vendas
mkdir -p .github/workflows
# Cole o conteúdo no arquivo .github/workflows/deploy-edge-functions.yml
git add .github/workflows/deploy-edge-functions.yml
git commit -m "ci: adicionar GitHub Actions para deploy automático"
git push origin main
```

---

## 🔑 **Passo 2: Configurar Secrets no GitHub**

Você precisa adicionar 2 secrets no repositório:

### **2.1. Obter SUPABASE_ACCESS_TOKEN**

1. Acesse: https://supabase.com/dashboard/account/tokens
2. Clique em **"Generate new token"**
3. Nome: `GitHub Actions - Dashboard`
4. Copie o token gerado (você não poderá vê-lo novamente!)

### **2.2. Obter SUPABASE_PROJECT_REF**

1. Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/settings/general
2. Copie o **"Reference ID"**
3. Exemplo: `abcdefghijklmnop`

### **2.3. Adicionar Secrets no GitHub**

1. Vá para: https://github.com/Ianfr13/dashboard-metas-vendas/settings/secrets/actions
2. Clique em **"New repository secret"**
3. Adicione os 2 secrets:

**Secret 1:**
- **Name**: `SUPABASE_ACCESS_TOKEN`
- **Value**: (cole o token gerado no passo 2.1)

**Secret 2:**
- **Name**: `SUPABASE_PROJECT_REF`
- **Value**: (cole o Reference ID do passo 2.2)

---

## ✅ **Passo 3: Testar o Workflow**

### **Opção A: Trigger Automático**

Após fazer merge do PR #2 na main, o workflow será executado automaticamente porque há mudanças em `supabase/functions/`.

### **Opção B: Trigger Manual**

1. Vá para: https://github.com/Ianfr13/dashboard-metas-vendas/actions
2. Selecione o workflow **"Deploy Edge Functions"**
3. Clique em **"Run workflow"**
4. Selecione branch: `main`
5. Clique em **"Run workflow"**

---

## 📊 **Passo 4: Verificar Deploy**

1. Acesse: https://github.com/Ianfr13/dashboard-metas-vendas/actions
2. Clique no workflow que está rodando
3. Acompanhe os logs em tempo real
4. Verifique se todos os steps passaram com ✅

### **Logs esperados:**

```
✅ Checkout code
✅ Setup Deno
✅ Setup Supabase CLI
✅ Deploy Edge Functions
   🚀 Deploying Edge Functions...
   Deploying function get-funnel-metrics...
   ✅ Deployment completed!
✅ Verify Deployment
   ✅ Edge Function 'get-funnel-metrics' deployed successfully!
```

---

## 🧪 **Passo 5: Testar a Edge Function**

Após o deploy bem-sucedido:

```bash
# Substitua SEU_PROJECT_REF e SEU_ANON_KEY
curl -X GET \
  'https://SEU_PROJECT_REF.supabase.co/functions/v1/get-funnel-metrics?month=12&year=2025&funnel=marketing' \
  -H "Authorization: Bearer SEU_ANON_KEY"
```

**Resposta esperada:**
```json
{
  "funnel": "marketing",
  "period": { "month": 12, "year": 2025, ... },
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

## 🔄 **Como Funciona**

### **Triggers:**

1. **Push na main** com mudanças em `supabase/functions/**`
   - Deploy automático após merge do PR
   - Deploy automático após commit direto na main

2. **Manual** via `workflow_dispatch`
   - Você pode rodar quando quiser via GitHub UI

### **O que o workflow faz:**

1. ✅ Faz checkout do código
2. ✅ Instala Deno (runtime das Edge Functions)
3. ✅ Instala Supabase CLI
4. ✅ Faz deploy da função `get-funnel-metrics`
5. ✅ Verifica e mostra instruções de teste

---

## 🐛 **Troubleshooting**

### **Erro: "SUPABASE_ACCESS_TOKEN not found"**
- Verifique se adicionou o secret corretamente
- Nome deve ser exatamente: `SUPABASE_ACCESS_TOKEN`

### **Erro: "SUPABASE_PROJECT_REF not found"**
- Verifique se adicionou o secret corretamente
- Nome deve ser exatamente: `SUPABASE_PROJECT_REF`

### **Erro: "Invalid access token"**
- Token expirou ou foi revogado
- Gere um novo token em: https://supabase.com/dashboard/account/tokens
- Atualize o secret no GitHub

### **Erro: "Function not found"**
- Verifique se o nome da função está correto: `get-funnel-metrics`
- Verifique se o arquivo existe em: `supabase/functions/get-funnel-metrics/index.ts`

### **Workflow não executa automaticamente**
- Verifique se o arquivo está em: `.github/workflows/deploy-edge-functions.yml`
- Verifique se fez push na branch `main`
- Verifique se houve mudanças em `supabase/functions/**`

---

## 🎉 **Próximos Passos**

Após configurar o GitHub Actions:

1. ✅ Merge do PR #2 → Deploy automático
2. ✅ Qualquer mudança em Edge Functions → Deploy automático
3. ✅ Sem necessidade de deploy manual
4. ✅ Logs e histórico no GitHub Actions

---

## 📝 **Resumo do Checklist**

- [ ] Criar arquivo `.github/workflows/deploy-edge-functions.yml`
- [ ] Obter `SUPABASE_ACCESS_TOKEN`
- [ ] Obter `SUPABASE_PROJECT_REF`
- [ ] Adicionar secrets no GitHub
- [ ] Fazer merge do PR #2 (ou rodar manualmente)
- [ ] Verificar logs do workflow
- [ ] Testar Edge Function via curl

---

**Precisa de ajuda?** Abra uma issue ou entre em contato!
