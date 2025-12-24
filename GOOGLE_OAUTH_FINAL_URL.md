# Guia de Configuração - Google OAuth com URL Definitiva

Este guia mostra como configurar o Google OAuth para a URL definitiva **dashboard.douravita.com.br**.

## 🚀 Passo 1: Configurar Domínio no Cloudflare

1.  **Acesse o Cloudflare Dashboard**:
    -   Vá para https://dash.cloudflare.com/

2.  **Selecione seu Site**:
    -   Clique no seu domínio `douravita.com.br`.

3.  **Navegue para Pages**:
    -   No menu lateral, clique em **Workers & Pages**.

4.  **Selecione seu Projeto**:
    -   Clique no seu projeto `dashboard-metas-vendas`.

5.  **Adicione o Domínio Personalizado**:
    -   Vá na aba **Custom domains**.
    -   Clique em **Set up a domain**.
    -   Digite `dashboard.douravita.com.br` e clique em **Continue**.
    -   O Cloudflare vai validar e ativar o domínio para o seu projeto Pages.

## 🔑 Passo 2: Atualizar Credenciais no Google Cloud

Agora, você precisa autorizar a nova URL no Google Cloud Console.

1.  **Acesse o Google Cloud Console**:
    -   Vá para https://console.cloud.google.com/

2.  **Navegue para as Credenciais**:
    -   Selecione seu projeto.
    -   Vá em **APIs & Services** → **Credentials**.

3.  **Edite o OAuth Client ID**:
    -   Encontre seu OAuth 2.0 Client ID na lista e clique no ícone de lápis (editar).

4.  **Adicione as URIs de Redirecionamento**:
    -   Em **Authorized redirect URIs**, clique em **ADD URI** e adicione as seguintes URLs:

        ```
        https://dashboard.douravita.com.br/auth/v1/callback
        https://auvvrewlbpyymekonilv.supabase.co/auth/v1/callback
        ```

    **Por que as duas?**
    -   A primeira é para o seu domínio personalizado.
    -   A segunda (do Supabase) é um fallback importante e recomendado pela documentação oficial.

5.  **Salve as Alterações**:
    -   Clique em **Save** no final da página.

## ⚙️ Passo 3: Verificar Configuração no Supabase

Nenhuma alteração é necessária no Supabase, mas é bom verificar:

1.  **Acesse o Supabase Dashboard**:
    -   Vá para https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/auth/url-configuration

2.  **Verifique a Site URL**:
    -   Certifique-se de que a **Site URL** está configurada como `https://dashboard.douravita.com.br`.

3.  **Adicione Redirect URLs Adicionais**:
    -   Em **Additional Redirect URLs**, adicione:
        ```
        https://dashboard.douravita.com.br/**
        ```
    -   Isso permite que o Supabase redirecione para qualquer página após o login (ex: `/dashboard`, `/settings`, etc.).

## ✅ Passo 4: Testar a Autenticação

1.  **Acesse seu site**:
    -   Vá para https://dashboard.douravita.com.br

2.  **Faça o Login**:
    -   Clique em "Login com Google".
    -   Use uma conta `@douravita.com.br`.

3.  **Verifique o Redirecionamento**:
    -   O login deve funcionar e você deve ser redirecionado para a página do dashboard.

## 🐛 Troubleshooting

### Erro: `redirect_uri_mismatch`

-   **Causa**: A URL do seu site não está autorizada no Google Cloud Console.
-   **Solução**: Siga o **Passo 2** cuidadosamente e garanta que a URL `https://dashboard.douravita.com.br/auth/v1/callback` está na lista.

### Erro: Login funciona mas não redireciona para o dashboard

-   **Causa**: A URL do site no Supabase pode estar incorreta.
-   **Solução**: Siga o **Passo 3** e configure a **Site URL** e as **Additional Redirect URLs** corretamente.

---

**Status:** ✅ Guia completo criado.  
**Próximo passo:** Siga este guia para finalizar a configuração.  
**Data:** 24 de Dezembro de 2024
