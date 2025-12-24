# Configuração do Google OAuth no Supabase

## 📋 Passo 1: Criar Projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Nome sugerido: `Dashboard Metas Vendas`

## 🔑 Passo 2: Configurar OAuth Consent Screen

1. Vá em **APIs & Services** → **OAuth consent screen**
2. Selecione **Internal** (apenas usuários da organização)
   - Se não tiver Google Workspace, selecione **External**
3. Preencha:
   - **App name:** Dashboard Metas Vendas
   - **User support email:** seu-email@douravita.com.br
   - **Developer contact:** seu-email@douravita.com.br
4. Clique em **Save and Continue**
5. Em **Scopes**, adicione:
   - `userinfo.email`
   - `userinfo.profile`
6. Clique em **Save and Continue**

## 🔐 Passo 3: Criar Credenciais OAuth

1. Vá em **APIs & Services** → **Credentials**
2. Clique em **Create Credentials** → **OAuth client ID**
3. Tipo: **Web application**
4. Nome: `Supabase Auth`
5. **Authorized redirect URIs**, adicione:
   ```
   https://auvvrewlbpyymekonilv.supabase.co/auth/v1/callback
   ```
6. Clique em **Create**
7. **Copie o Client ID e Client Secret** (você vai precisar)

## ⚙️ Passo 4: Configurar no Supabase

1. Acesse: https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/auth/providers
2. Encontre **Google** na lista de providers
3. Habilite o toggle
4. Cole:
   - **Client ID:** (do passo 3)
   - **Client Secret:** (do passo 3)
5. Clique em **Save**

## 🛡️ Passo 5: Configurar Restrição de Domínio

Vou criar uma Edge Function que valida o domínio do email após o login.

**Arquivo:** `supabase/functions/validate-email-domain/index.ts`

Esta função será chamada automaticamente após cada login via webhook.

## 📝 Passo 6: Testar o Login

1. No frontend, clique em "Login com Google"
2. Selecione uma conta Google
3. Se o email for `@douravita.com.br`: ✅ Login permitido
4. Se o email for de outro domínio: ❌ Login bloqueado

---

**Próximos passos:** Vou criar a Edge Function e os componentes do frontend.
