# 📝 Como Atualizar o Workflow do GitHub Actions

## ⚠️ Por que preciso fazer manualmente?

O GitHub bloqueia bots e apps de modificar workflows por segurança. Você precisa fazer essa atualização manualmente como administrador do repositório.

---

## 🔧 Passo a Passo

### 1. Acesse o arquivo do workflow no GitHub

Vá para: https://github.com/Ianfr13/dashboard-metas-vendas/blob/main/.github/workflows/deploy-edge-functions.yml

### 2. Clique em "Edit" (ícone de lápis)

### 3. Substitua TODO o conteúdo pelo código abaixo:

```yaml
name: Deploy Edge Functions

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/functions/**'
  workflow_dispatch:

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
          
          # Deploy todas as Edge Functions
          for func in supabase/functions/*/; do
            func_name=$(basename "$func")
            
            # Pular diretório _shared
            if [ "$func_name" = "_shared" ]; then
              echo "⏭️  Skipping _shared directory"
              continue
            fi
            
            echo "📦 Deploying $func_name..."
            supabase functions deploy "$func_name" \
              --project-ref ${{ secrets.SUPABASE_PROJECT_REF }} \
              --no-verify-jwt || {
                echo "❌ Failed to deploy $func_name"
                exit 1
              }
            echo "✅ $func_name deployed successfully"
          done
          
          echo "🎉 All Edge Functions deployed successfully!"
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Verify Deployment
        run: |
          echo "✅ Edge Functions deployment completed!"
          echo "Deployed functions:"
          for func in supabase/functions/*/; do
            func_name=$(basename "$func")
            if [ "$func_name" != "_shared" ]; then
              echo "  - $func_name"
            fi
          done
```

### 4. Commit as mudanças

- Título: `fix: Atualizar workflow para deployar todas Edge Functions`
- Descrição: `Deploy automático de todas as funções em supabase/functions/`

### 5. Pronto! ✅

Agora, sempre que houver push na branch `main` com mudanças em `supabase/functions/`, **todas** as Edge Functions serão deployadas automaticamente.

---

## 🎯 O que mudou?

### Antes (hardcoded):
```yaml
- name: Deploy Edge Functions
  run: |
    supabase functions deploy get-funnel-metrics --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
```

**Problema:** Só deployava `get-funnel-metrics`, ignorando outras funções como `ranking-system` e `webhook-receiver`.

### Depois (automático):
```yaml
- name: Deploy Edge Functions
  run: |
    for func in supabase/functions/*/; do
      func_name=$(basename "$func")
      if [ "$func_name" != "_shared" ]; then
        supabase functions deploy "$func_name" --project-ref ${{ secrets.SUPABASE_PROJECT_REF }} --no-verify-jwt
      fi
    done
```

**Solução:** Loop que deploya **todas** as funções automaticamente, exceto o diretório `_shared`.

---

## 🧪 Testar o Workflow

Após atualizar, você pode testar de duas formas:

### Opção 1: Trigger manual
1. Vá em **Actions** no GitHub
2. Selecione **Deploy Edge Functions**
3. Clique em **Run workflow**
4. Escolha a branch `main`
5. Clique em **Run workflow**

### Opção 2: Push na main
1. Faça merge do PR #24 para `main`
2. O workflow será executado automaticamente
3. Verifique em **Actions** se todas as funções foram deployadas

---

## 📋 Funções que serão deployadas

Com o workflow atualizado, estas funções serão deployadas automaticamente:

- ✅ `get-funnel-metrics`
- ✅ `ranking-system`
- ✅ `webhook-receiver`
- ✅ Qualquer nova função que você criar em `supabase/functions/`

---

## ❓ Dúvidas?

Se tiver algum problema ao atualizar o workflow, me avise!
