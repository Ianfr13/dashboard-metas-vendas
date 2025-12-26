# 🚀 Deploy da Edge Function ranking-system

## ✅ Status

A Edge Function `ranking-system` foi **deployada com sucesso** manualmente em **26/12/2024**.

- **ID:** 2f6c7c1a-405e-4f96-a7a0-d0b9c6d2c706
- **Versão:** 1
- **Status:** ACTIVE
- **URL:** https://auvvrewlbpyymekonilv.supabase.co/functions/v1/ranking-system

---

## 🔧 Como fazer deploy manual

### Opção 1: Via Supabase CLI

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Login no Supabase
supabase login

# Deploy da função
supabase functions deploy ranking-system \
  --project-ref auvvrewlbpyymekonilv \
  --no-verify-jwt
```

### Opção 2: Via Dashboard do Supabase

1. Acesse https://supabase.com/dashboard/project/auvvrewlbpyymekonilv
2. Vá em **Edge Functions** no menu lateral
3. Clique em **Deploy new function**
4. Faça upload dos arquivos da pasta `supabase/functions/ranking-system/`

---

## 📁 Arquivos da Edge Function

A função `ranking-system` é composta por:

```
supabase/functions/ranking-system/
├── index.ts                      # Entrypoint principal
└── handlers/
    ├── calculate.ts              # Calcular métricas e rankings
    ├── get-rankings.ts           # Buscar rankings
    ├── get-metrics.ts            # Buscar métricas para gráficos
    └── admin.ts                  # Ações administrativas

supabase/functions/_shared/
└── cors.ts                       # Configuração de CORS (compartilhada)
```

---

## 🔄 Deploy Automático via GitHub Actions

O workflow `.github/workflows/deploy-edge-functions.yml` está configurado para fazer deploy automático quando:

1. Há push na branch `main`
2. Arquivos em `supabase/functions/**` são modificados

**Nota:** O workflow atual só deploya `get-funnel-metrics`. Para deployar todas as funções automaticamente, o workflow precisa ser atualizado (requer permissão de admin no repositório).

### Workflow atualizado sugerido:

```yaml
- name: Deploy Edge Functions
  run: |
    echo "🚀 Deploying Edge Functions..."
    
    # Deploy todas as Edge Functions
    for func in supabase/functions/*/; do
      func_name=$(basename "$func")
      
      # Pular diretório _shared
      if [ "$func_name" = "_shared" ]; then
        continue
      fi
      
      echo "📦 Deploying $func_name..."
      supabase functions deploy "$func_name" \
        --project-ref ${{ secrets.SUPABASE_PROJECT_REF }} \
        --no-verify-jwt
    done
    
    echo "✅ All Edge Functions deployed successfully!"
```

---

## 🧪 Testar a Edge Function

### Teste de CORS (OPTIONS):

```bash
curl -X OPTIONS \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization, content-type" \
  -H "Origin: https://dashboard.douravita.com.br" \
  -i \
  https://auvvrewlbpyymekonilv.supabase.co/functions/v1/ranking-system
```

**Resposta esperada:** `HTTP/2 200` com headers de CORS

### Teste de GET Rankings:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"action":"get-rankings","role":"sdr"}' \
  https://auvvrewlbpyymekonilv.supabase.co/functions/v1/ranking-system
```

**Resposta esperada:** JSON com rankings

---

## 🔐 Autenticação

A Edge Function usa **autenticação customizada**:

- **Ações de leitura** (`get-rankings`, `get-metrics`): Requerem JWT válido
- **Ações admin** (`admin`): Requerem JWT válido + verificação de permissões
- **Cálculo** (`calculate`): Chamado internamente pelo webhook-receiver

O token JWT é obtido automaticamente pelo frontend via `supabase.auth.getSession()`.

---

## 📝 Logs

Para ver logs da Edge Function:

1. Acesse https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/logs/edge-functions
2. Selecione `ranking-system` no dropdown
3. Visualize logs em tempo real

---

## 🐛 Troubleshooting

### Erro: "Failed to fetch" ou CORS

**Causa:** Edge Function não deployada ou versão antiga

**Solução:** Fazer deploy manual conforme instruções acima

### Erro: "Token de autenticação não fornecido"

**Causa:** Usuário não está logado ou sessão expirou

**Solução:** Fazer login novamente no dashboard

### Erro: "Action 'X' not found"

**Causa:** Versão antiga da Edge Function deployada

**Solução:** Fazer novo deploy com a versão atualizada

---

## 📅 Histórico de Deploys

| Data | Versão | Commit | Notas |
|------|--------|--------|-------|
| 26/12/2024 | 1 | 5735982 | Deploy inicial manual via MCP Supabase |

---

**Última atualização:** 26 de Dezembro de 2024
