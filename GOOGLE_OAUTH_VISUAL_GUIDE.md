## 🚀 Guia Visual: Configurando a Autenticação Google

Vamos finalizar a configuração passo a passo. Siga este guia visual para criar as credenciais no Google Cloud e configurar no Supabase.

---

### **Parte 1: Google Cloud Console (5-10 minutos)**

**Objetivo:** Criar as credenciais (Client ID e Client Secret) que o Supabase usará para se comunicar com o Google.

#### **Passo 1: Acesse o Google Cloud Console**

- **Acesse:** https://console.cloud.google.com/
- Faça login com sua conta Google.

#### **Passo 2: Crie um Novo Projeto**

1.  No topo da página, clique no seletor de projetos (ao lado do logo do Google Cloud).
2.  Clique em **NEW PROJECT**.
3.  **Project name:** `Dashboard Douravita`
4.  Clique em **CREATE**.

    *[IMAGEM: Tela de criação de novo projeto no Google Cloud]*

#### **Passo 3: Configure a Tela de Consentimento OAuth**

1.  No menu de navegação (☰), vá para **APIs & Services** → **OAuth consent screen**.
2.  **User Type:** Escolha **Internal** se você usa Google Workspace e quer restringir apenas para sua organização. Caso contrário, escolha **External**.
3.  Clique em **CREATE**.
4.  Preencha as informações do aplicativo:
    -   **App name:** `Dashboard Douravita`
    -   **User support email:** `seu-email@douravita.com.br`
    -   **Developer contact information:** `seu-email@douravita.com.br`
5.  Clique em **SAVE AND CONTINUE** até o final. Não precisa preencher as outras seções (Scopes, Test users).

    *[IMAGEM: Tela de configuração do OAuth consent screen com os campos preenchidos]*

#### **Passo 4: Crie as Credenciais OAuth**

1.  No menu lateral, clique em **Credentials**.
2.  Clique em **+ CREATE CREDENTIALS** → **OAuth client ID**.
3.  **Application type:** Selecione **Web application**.
4.  **Name:** `Dashboard Douravita Web Client`
5.  Em **Authorized redirect URIs**, clique em **+ ADD URI** e adicione **EXATAMENTE** as duas URLs abaixo:

    ```
    https://dashboard.douravita.com.br/auth/v1/callback
    ```
    ```
    https://auvvrewlbpyymekonilv.supabase.co/auth/v1/callback
    ```

    *[IMAGEM: Tela de criação de Client ID com as duas URIs de redirecionamento adicionadas]*

6.  Clique em **CREATE**.

#### **Passo 5: Copie Suas Credenciais**

-   Uma janela vai aparecer com seu **Client ID** e **Client Secret**.
-   **Copie e guarde esses dois valores.** Você vai precisar deles na próxima parte.

    *[IMAGEM: Janela pop-up mostrando o Client ID e o Client Secret]*

---

### **Parte 2: Supabase Dashboard (3 minutos)**

**Objetivo:** Informar ao Supabase as credenciais do Google que você acabou de criar.

#### **Passo 6: Configure o Provider Google**

1.  **Acesse:** https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/auth/providers
2.  Encontre **Google** na lista e clique para expandir.
3.  Habilite o toggle **Enabled**.
4.  Cole o **Client ID** e o **Client Secret** que você copiou do Google Cloud.
5.  Clique em **Save**.

    *[IMAGEM: Tela de configuração do provider Google no Supabase com os campos preenchidos]*

#### **Passo 7: Configure as URLs do Site**

1.  **Acesse:** https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/auth/url-configuration
2.  **Site URL:** `https://dashboard.douravita.com.br`
3.  **Additional Redirect URLs:** Adicione `https://dashboard.douravita.com.br/**`
4.  Clique em **Save**.

    *[IMAGEM: Tela de configuração de URLs no Supabase com os campos preenchidos]*

---

### **Parte 3: Finalização e Teste (5 minutos)**

#### **Passo 8: Aplique as Regras de Segurança (RLS)**

1.  **Acesse:** https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/sql
2.  Abra o arquivo `supabase/rls_policies_auth.sql` do seu projeto.
3.  Copie todo o conteúdo do arquivo.
4.  Cole no SQL Editor do Supabase e clique em **RUN**.

#### **Passo 9: Promova o Primeiro Admin**

-   Ainda no SQL Editor, execute o comando para se tornar admin:

    ```sql
    UPDATE user_roles SET role = 'admin' WHERE email = 'seu-email@douravita.com.br';
    ```

#### **Passo 10: Teste Final**

1.  Aguarde o último deploy do Cloudflare terminar (após o commit que fiz).
2.  Acesse: https://dashboard.douravita.com.br
3.  Você deve ser redirecionado para a página de login.
4.  Clique em **"Continuar com Google"**.
5.  Faça o login com sua conta `@douravita.com.br`.

**Se tudo deu certo, você será redirecionado para o dashboard principal!** 🎉

---

### **Troubleshooting Rápido**

-   **Erro `redirect_uri_mismatch`?**
    -   Verifique se as duas URIs de redirecionamento no **Passo 4** estão corretas e salvas no Google Cloud.

-   **Login funciona mas volta para a tela de login?**
    -   Verifique se a **Site URL** no **Passo 7** está correta no Supabase.

-   **Não consegue acessar a página `/admin`?**
    -   Execute o comando do **Passo 9** para se promover a admin e faça login novamente.
