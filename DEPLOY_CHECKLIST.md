# ✅ Checklist de Deploy - Dashboard Metas Vendas

## 📦 Git Push Concluído

✅ **Commit:** `494ff60`  
✅ **Branch:** `main`  
✅ **Arquivos:** 45 arquivos alterados, 6070 inserções  
✅ **Push:** Enviado para GitHub com sucesso

---

## 🚀 Próximos Passos para Deploy

### 1. Configurar Google OAuth

- [ ] Acessar: https://console.cloud.google.com/
- [ ] Criar projeto "Dashboard Metas Vendas"
- [ ] Configurar OAuth Consent Screen
- [ ] Criar credenciais OAuth (Web Application)
- [ ] Adicionar redirect URI: `https://auvvrewlbpyymekonilv.supabase.co/auth/v1/callback`
- [ ] Copiar Client ID e Client Secret

### 2. Configurar Supabase Auth

- [ ] Acessar: https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/auth/providers
- [ ] Habilitar provider **Google**
- [ ] Colar Client ID e Client Secret
- [ ] Salvar configuração

### 3. Aplicar Políticas RLS

- [ ] Acessar: https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/sql
- [ ] Abrir arquivo `supabase/rls_policies_auth.sql` do repositório
- [ ] Copiar e colar no SQL Editor
- [ ] Executar o script

### 4. Verificar Edge Functions

- [ ] Acessar: https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/functions
- [ ] Verificar se `gtm-event` está ACTIVE
- [ ] Verificar se `validate-email-domain` está ACTIVE

### 5. Configurar Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto:

```env
# Supabase
VITE_SUPABASE_URL=https://auvvrewlbpyymekonilv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dnZyZXdsYnB5eW1la29uaWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4OTc3NzEsImV4cCI6MjA1MDQ3Mzc3MX0.QiNHN8Rk8j2Qp7sDlCxQdCqQyGCVFqJj-Hn5xJmEEy8

# GTM Secret Token
GTM_SECRET=b646bc7e395f08aa2ee33001fbd6056874c3e0b732e6ed1b62dd251825d4f276
```

### 6. Instalar Dependências

```bash
pnpm install
```

### 7. Rodar Localmente (Teste)

```bash
pnpm dev
```

Acessar: http://localhost:5173

### 8. Testar Autenticação

- [ ] Clicar em "Login com Google"
- [ ] Fazer login com email @douravita.com.br
- [ ] Verificar se redireciona para /dashboard
- [ ] Testar logout

### 9. Configurar GTM

- [ ] Abrir Google Tag Manager
- [ ] Criar tag "Supabase - Purchase Event"
- [ ] Usar o código de `GTM_INTEGRATION_SECURE.md`
- [ ] Adicionar o secret token: `b646bc7e395f08aa2ee33001fbd6056874c3e0b732e6ed1b62dd251825d4f276`
- [ ] Publicar container

### 10. Deploy em Produção

**Opção A: Vercel**
```bash
vercel --prod
```

**Opção B: Netlify**
```bash
netlify deploy --prod
```

**Opção C: Render/Railway/Fly.io**
- Conectar repositório GitHub
- Configurar variáveis de ambiente
- Deploy automático

---

## 📊 Resumo das Alterações

| Categoria | Detalhes |
|-----------|----------|
| **Banco de Dados** | Migrado para Supabase PostgreSQL |
| **Edge Functions** | 2 deployadas (gtm-event, validate-email-domain) |
| **Autenticação** | Google OAuth com restrição @douravita.com.br |
| **Segurança** | RLS + Secret Token + Domain Validation |
| **Frontend** | Componentes de login, logout e proteção de rotas |
| **Documentação** | 20+ arquivos MD criados |

---

## 🔗 Links Importantes

- **Repositório:** https://github.com/Ianfr13/dashboard-metas-vendas
- **Supabase Dashboard:** https://supabase.com/dashboard/project/auvvrewlbpyymekonilv
- **Edge Functions:** https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/functions
- **Google Cloud Console:** https://console.cloud.google.com/

---

## 📚 Documentação de Referência

1. **AUTHENTICATION_SYSTEM.md** - Sistema de autenticação
2. **GOOGLE_OAUTH_SETUP.md** - Configuração do Google OAuth
3. **GTM_INTEGRATION_SECURE.md** - Integração com GTM
4. **SIMPLIFIED_ARCHITECTURE.md** - Arquitetura simplificada
5. **DEPLOY_GUIDE.md** - Guia de deploy das Edge Functions

---

**Status:** ✅ Código enviado para GitHub  
**Próximo:** Configurar Google OAuth e fazer deploy  
**Data:** 24 de Dezembro de 2024
