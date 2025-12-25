## 🚀 Script de Deploy Seguro

Este script garante que você sempre faça deploy no projeto correto do Supabase.

### 📋 Configuração Inicial

1. **Configure o token de acesso:**
   ```bash
   export SUPABASE_ACCESS_TOKEN=seu_token_aqui
   ```

2. **Torne o script executável (já feito):**
   ```bash
   chmod +x deploy-functions.sh
   ```

### 🎯 Como Usar

#### Deploy de TODAS as Edge Functions:
```bash
./deploy-functions.sh
```

#### Deploy de UMA Edge Function específica:
```bash
./deploy-functions.sh gtm-event
./deploy-functions.sh get-dashboard-data
./deploy-functions.sh validate-email-domain
```

### ✅ O que o script faz:

1. ✅ Verifica se o token está configurado
2. ✅ **Sempre** linka ao projeto correto: `auvvrewlbpyymekonilv` (dashboard)
3. ✅ Faz o deploy com `--no-verify-jwt` (para aceitar chamadas públicas quando necessário)
4. ✅ Mostra mensagens coloridas de sucesso/erro
5. ✅ Fornece link direto para o dashboard do Supabase

### 🔒 Segurança

O script está configurado com:
- **Project Ref fixo:** `auvvrewlbpyymekonilv`
- **Project Name:** `dashboard`

**Impossível fazer deploy no projeto errado!** 🎉

### 📝 Exemplos

**Deploy completo:**
```bash
$ export SUPABASE_ACCESS_TOKEN=sbp_...
$ ./deploy-functions.sh

🚀 Deploy de Edge Functions - Projeto: dashboard
Project Ref: auvvrewlbpyymekonilv

📎 Linkando ao projeto correto...
📦 Fazendo deploy de TODAS as Edge Functions...

✅ Deploy concluído com sucesso!
🔗 Dashboard: https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/functions
```

**Deploy de uma função específica:**
```bash
$ ./deploy-functions.sh gtm-event

🚀 Deploy de Edge Functions - Projeto: dashboard
Project Ref: auvvrewlbpyymekonilv

📎 Linkando ao projeto correto...
📦 Fazendo deploy da função: gtm-event

✅ Deploy concluído com sucesso!
🔗 Dashboard: https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/functions
```

### 🛡️ Proteção Contra Erros

Se você esquecer de configurar o token:
```bash
$ ./deploy-functions.sh

❌ ERRO: SUPABASE_ACCESS_TOKEN não está configurado
Configure com: export SUPABASE_ACCESS_TOKEN=seu_token
```

### 💡 Dica

Adicione o token ao seu `.bashrc` ou `.zshrc` para não precisar configurar toda vez:
```bash
echo 'export SUPABASE_ACCESS_TOKEN=seu_token' >> ~/.bashrc
source ~/.bashrc
```

**Agora você pode fazer deploy com segurança!** 🎯
