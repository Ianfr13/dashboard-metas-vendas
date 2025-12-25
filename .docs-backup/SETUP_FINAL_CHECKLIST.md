# ✅ Checklist Final de Configuração - Dashboard Douravita

## 🎯 Status Atual

✅ **Deploy no Cloudflare Pages:** Concluído  
✅ **Rotas de autenticação:** Implementadas  
✅ **Componentes de login:** Criados  
⏳ **Configuração Google OAuth:** Pendente  
⏳ **Configuração Supabase:** Pendente  

---

## 📋 Passo a Passo para Finalizar

### **1. Configurar Domínio Personalizado no Cloudflare**

1. Acesse: https://dash.cloudflare.com/
2. Vá em **Workers & Pages** → Selecione `dashboard-metas-vendas`
3. Clique em **Custom domains** → **Set up a domain**
4. Digite: `dashboard.douravita.com.br`
5. Clique em **Continue** e aguarde a ativação

**Tempo estimado:** 2-5 minutos

---

### **2. Criar Credenciais no Google Cloud Console**

1. Acesse: https://console.cloud.google.com/
2. Crie ou selecione um projeto
3. Vá em **APIs & Services** → **OAuth consent screen**
   - Tipo: **Internal** (se tiver Google Workspace) ou **External**
   - App name: `Dashboard Metas Vendas`
   - User support email: `seu-email@douravita.com.br`
   - Developer contact: `seu-email@douravita.com.br`
   - Clique em **Save and Continue**

4. Em **Scopes**, adicione:
   - `userinfo.email`
   - `userinfo.profile`
   - Clique em **Save and Continue**

5. Vá em **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `Dashboard Douravita`
   - **Authorized redirect URIs**, adicione:
     ```
     https://dashboard.douravita.com.br/auth/v1/callback
     https://auvvrewlbpyymekonilv.supabase.co/auth/v1/callback
     ```
   - Clique em **Create**

6. **COPIE o Client ID e Client Secret** (você vai precisar no próximo passo)

**Tempo estimado:** 5-10 minutos

---

### **3. Configurar Google OAuth no Supabase**

1. Acesse: https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/auth/providers
2. Encontre **Google** na lista de providers
3. Habilite o toggle
4. Cole:
   - **Client ID:** (do passo 2)
   - **Client Secret:** (do passo 2)
5. Clique em **Save**

**Tempo estimado:** 2 minutos

---

### **4. Configurar URLs no Supabase**

1. Acesse: https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/auth/url-configuration
2. Configure:
   - **Site URL:** `https://dashboard.douravita.com.br`
   - **Additional Redirect URLs:** `https://dashboard.douravita.com.br/**`
3. Clique em **Save**

**Tempo estimado:** 1 minuto

---

### **5. Aplicar Políticas RLS no Supabase**

1. Acesse: https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/sql
2. Abra o arquivo `supabase/rls_policies_auth.sql` do seu repositório
3. Copie todo o conteúdo
4. Cole no SQL Editor do Supabase
5. Clique em **Run** para executar

**Tempo estimado:** 2 minutos

---

### **6. Testar a Autenticação**

1. Aguarde o Cloudflare fazer o redeploy (2-3 minutos após o último commit)
2. Acesse: https://dashboard.douravita.com.br
3. Você deve ser redirecionado para `/login`
4. Clique em "Continuar com Google"
5. Faça login com uma conta `@douravita.com.br`
6. Você deve ser redirecionado para a página principal do dashboard

**Tempo estimado:** 3 minutos

---

## 🔍 Verificações Finais

Após completar todos os passos, verifique:

- [ ] Domínio `dashboard.douravita.com.br` está ativo
- [ ] Login com Google funciona
- [ ] Apenas emails `@douravita.com.br` conseguem fazer login
- [ ] Usuários não autenticados são redirecionados para `/login`
- [ ] Botão de logout funciona
- [ ] Header mostra nome e foto do usuário

---

## 🐛 Troubleshooting

### Erro: `redirect_uri_mismatch`

**Solução:** Verifique se as URIs de redirecionamento no Google Cloud Console estão corretas:
```
https://dashboard.douravita.com.br/auth/v1/callback
https://auvvrewlbpyymekonilv.supabase.co/auth/v1/callback
```

### Erro: Login funciona mas não redireciona

**Solução:** Verifique a **Site URL** no Supabase:
- Deve ser: `https://dashboard.douravita.com.br`

### Erro: Emails de outros domínios conseguem fazer login

**Solução:** Verifique se a Edge Function `validate-email-domain` está deployada e ativa:
- https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/functions

---

## 📚 Documentação de Referência

- **GOOGLE_OAUTH_FINAL_URL.md** - Guia detalhado de configuração
- **AUTHENTICATION_SYSTEM.md** - Arquitetura completa
- **CLOUDFLARE_DEPLOY_GUIDE.md** - Deploy no Cloudflare

---

**Tempo total estimado:** 15-25 minutos  
**Status:** ✅ Código atualizado e enviado para GitHub  
**Próximo:** Seguir este checklist para finalizar a configuração  
**Data:** 24 de Dezembro de 2024
