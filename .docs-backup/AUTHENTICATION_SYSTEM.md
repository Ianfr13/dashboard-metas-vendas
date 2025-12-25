# Sistema de Autenticação - Google OAuth + Domínio Restrito

## 1. Visão Geral

Este documento descreve o sistema de autenticação implementado, que permite login apenas para usuários com emails do domínio **@douravita.com.br** usando Google OAuth.

## 2. Diagrama do Fluxo de Autenticação

```mermaid
graph TD
    subgraph Frontend
        A[Usuário clica em "Login com Google"] --> B{Supabase Client};
        B --> C{Redireciona para Google};
    end

    subgraph Google
        C --> D[Tela de Login do Google];
        D --> E{Usuário autoriza};
        E --> F{Redireciona para Supabase};
    end

    subgraph Supabase Cloud
        F --> G{Supabase Auth};
        G --> H{Webhook: user.signed_in};
        H --> I{Edge Function: validate-email-domain};
        I -- Domínio OK --> J[Cria sessão JWT];
        I -- Domínio Inválido --> K[Desloga e deleta usuário];
    end

    subgraph Frontend
        J --> L[Redireciona para /dashboard];
        K --> M[Mostra erro na tela de login];
    end

    style A fill:#bbf,stroke:#333,stroke-width:2px
    style L fill:#bbf,stroke:#333,stroke-width:2px
    style M fill:#fbb,stroke:#333,stroke-width:2px
```

## 3. Componentes da Arquitetura

### 3.1. Google OAuth Provider (Supabase)

- **Configuração**: Habilitado no dashboard do Supabase com Client ID e Secret do Google Cloud.
- **Redirect URI**: `https://auvvrewlbpyymekonilv.supabase.co/auth/v1/callback`

### 3.2. Edge Function: `validate-email-domain`

- **Propósito**: Validar o domínio do email após o login.
- **Trigger**: Webhook do Supabase Auth nos eventos `user.created` e `user.signed_in`.
- **Lógica**:
  1. Recebe o payload do usuário.
  2. Extrai o domínio do email.
  3. Se o domínio for `douravita.com.br`, permite o login.
  4. Se o domínio for outro, **desloga e deleta o usuário imediatamente**.
- **Arquivo**: `supabase/functions/validate-email-domain/index.ts`

### 3.3. Políticas de Row Level Security (RLS)

- **Propósito**: Garantir que usuários autenticados só acessem os dados permitidos.
- **Lógica**: Todas as tabelas sensíveis agora têm políticas que verificam `auth.role() = 'authenticated'`.
- **Exemplo**: `CREATE POLICY "Authenticated users can view gtm_events" ON gtm_events FOR SELECT USING (auth.role() = 'authenticated');`
- **Arquivo**: `supabase/rls_policies_auth.sql`

### 3.4. Componentes do Frontend (React)

- **`LoginPage.tsx`**: Página de login com o botão "Continuar com Google".
  - Usa `signInWithOAuth` com o parâmetro `hd: 'douravita.com.br'` para sugerir o domínio correto ao Google.
  - Mostra mensagens de erro se o login falhar.

- **`ProtectedRoute.tsx`**: Componente de ordem superior (HOC) que protege as rotas.
  - Verifica se o usuário está autenticado e se o domínio é o correto.
  - Redireciona para `/login` se não estiver autenticado.

- **`Header.tsx`**: Cabeçalho da aplicação que mostra o nome do usuário e o botão de logout.

## 4. Como Configurar e Usar

### Passo 1: Configurar Google Cloud

- Siga as instruções em [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) para obter o Client ID e Secret.

### Passo 2: Configurar Supabase

1. **Adicionar credenciais do Google**: Cole o Client ID e Secret no provider do Google no dashboard do Supabase.
2. **Criar Webhook**:
   - Vá em **Database** → **Webhooks**.
   - Clique em **Create a new hook**.
   - **Name**: `Validate Email Domain`
   - **Table**: `auth.users`
   - **Events**: `INSERT` e `UPDATE`
   - **Type**: `HTTP Request`
   - **URL**: `https://auvvrewlbpyymekonilv.supabase.co/functions/v1/validate-email-domain`
   - **Headers**: Adicione um header `Authorization` com `Bearer SUPABASE_SERVICE_ROLE_KEY` (use a service role key do seu projeto).

### Passo 3: Aplicar Políticas RLS

- Execute o script `supabase/rls_policies_auth.sql` no SQL Editor do Supabase.

### Passo 4: Deploy da Edge Function

```bash
supabase functions deploy validate-email-domain --no-verify-jwt
```

### Passo 5: Usar no Frontend

- Proteja as rotas do seu dashboard com o componente `ProtectedRoute`:

  ```tsx
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route 
      path="/dashboard"
      element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      }
    />
  </Routes>
  ```

## 5. Segurança do Sistema

| Camada | Proteção |
| :--- | :--- |
| **Login** | Apenas contas Google são permitidas. |
| **Domínio** | Edge Function `validate-email-domain` bloqueia e deleta usuários de outros domínios. |
| **Acesso a Dados** | RLS garante que apenas usuários autenticados possam ler os dados. |
| **Frontend** | Rotas protegidas redirecionam usuários não autenticados para a página de login. |

## 6. Conclusão

Este sistema combina a facilidade do Google OAuth com a segurança robusta da validação de domínio via Edge Function e o controle de acesso granular do RLS.

O resultado é um sistema de autenticação seguro, eficiente e fácil de usar para os membros da equipe Douravita.

---

**Última atualização:** 24 de Dezembro de 2024
**Status:** ✅ Implementado
