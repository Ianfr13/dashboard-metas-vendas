# Guia de Deploy no Cloudflare Pages

Este guia mostra o passo a passo para fazer o deploy do projeto **dashboard-metas-vendas** no Cloudflare Pages, incluindo a configuração das variáveis de ambiente.

## 🚀 Passo 1: Conectar Repositório ao Cloudflare

1.  **Acesse o Cloudflare Dashboard**:
    -   Vá para https://dash.cloudflare.com/

2.  **Navegue para Pages**:
    -   No menu lateral, clique em **Workers & Pages**.

3.  **Crie um Novo Projeto**:
    -   Clique em **Create application** → **Pages** → **Connect to Git**.

4.  **Selecione o Repositório**:
    -   Escolha sua conta GitHub e selecione o repositório `Ianfr13/dashboard-metas-vendas`.
    -   Clique em **Begin setup**.

## ⚙️ Passo 2: Configurar o Build

O Cloudflare vai pedir para você configurar o processo de build. Use as seguintes configurações:

| Configuração | Valor |
| :--- | :--- |
| **Project name** | `dashboard-metas-vendas` (ou o nome que preferir) |
| **Production branch** | `main` |
| **Framework preset** | `Vite` |
| **Build command** | `pnpm build` |
| **Build output directory** | `dist` |

**IMPORTANTE:** Se o Cloudflare não detectar `pnpm` automaticamente, você pode precisar ajustar o comando de build para:

```bash
npm install -g pnpm && pnpm install && pnpm build
```

## 🔑 Passo 3: Configurar Variáveis de Ambiente

Esta é a parte mais importante. Na seção **Environment variables (advanced)**, clique em **Add variable** para cada uma das variáveis abaixo.

### Variáveis Obrigatórias:

| Nome da Variável | Valor |
| :--- | :--- |
| `VITE_SUPABASE_URL` | `https://auvvrewlbpyymekonilv.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dnZyZXdsYnB5eW1la29uaWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4OTc3NzEsImV4cCI6MjA1MDQ3Mzc3MX0.QiNHN8Rk8j2Qp7sDlCxQdCqQyGCVFqJj-Hn5xJmEEy8` |

**Onde encontrar:**
-   `VITE_SUPABASE_URL`: No seu dashboard do Supabase → Project Settings → API.
-   `VITE_SUPABASE_ANON_KEY`: No seu dashboard do Supabase → Project Settings → API (use a chave `anon` `public`).

### Variáveis de Build (Opcional, mas recomendado):

Para garantir que o `pnpm` seja usado, adicione a seguinte variável:

| Nome da Variável | Valor |
| :--- | :--- |
| `PNPM_VERSION` | `8` (ou a versão mais recente) |

### Tabela de Resumo para Copiar e Colar:

| Nome da Variável | Valor |
| :--- | :--- |
| `VITE_SUPABASE_URL` | `https://auvvrewlbpyymekonilv.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dnZyZXdsYnB5eW1la29uaWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4OTc3NzEsImV4cCI6MjA1MDQ3Mzc3MX0.QiNHN8Rk8j2Qp7sDlCxQdCqQyGCVFqJj-Hn5xJmEEy8` |
| `PNPM_VERSION` | `8` |

**Nota:** O prefixo `VITE_` é crucial. O Vite só expõe variáveis de ambiente com esse prefixo para o código do frontend por segurança.

## 🚀 Passo 4: Fazer o Deploy

1.  Após configurar o build e as variáveis de ambiente, clique em **Save and Deploy**.
2.  O Cloudflare vai começar a buildar e fazer o deploy do seu site.
3.  Você pode acompanhar o progresso em tempo real.

## 🔗 Passo 5: Acessar o Site

-   Após o deploy ser concluído com sucesso, o Cloudflare fornecerá uma URL única (ex: `dashboard-metas-vendas.pages.dev`).
-   Você pode acessar seu dashboard por essa URL.

## 🔄 Deploys Futuros

-   A partir de agora, qualquer `git push` para a branch `main` irá automaticamente disparar um novo deploy no Cloudflare Pages.

## 🐛 Troubleshooting

### Erro: Build falha

-   **Causa Comum**: Problemas com o `pnpm` ou dependências.
-   **Solução**: Verifique os logs de build no dashboard do Cloudflare. Tente usar o comando de build `npm install -g pnpm && pnpm install && pnpm build`.

### Erro: App não conecta ao Supabase

-   **Causa Comum**: Variáveis de ambiente incorretas ou faltando.
-   **Solução**: Vá em **Settings** → **Environment variables** no seu projeto do Cloudflare Pages e verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretas e sem espaços extras.

### Erro: Login com Google não funciona

-   **Causa Comum**: A URL de deploy não foi adicionada ao Google Cloud Console.
-   **Solução**:
    1.  Vá para o seu projeto no Google Cloud Console → APIs & Services → Credentials.
    2.  Selecione suas credenciais OAuth.
    3.  Em **Authorized redirect URIs**, adicione a URL do seu site no Cloudflare Pages (ex: `https://dashboard-metas-vendas.pages.dev`).

---

**Status:** ✅ Guia completo criado.  
**Próximo passo:** Siga este guia para fazer o deploy.  
**Data:** 24 de Dezembro de 2024
