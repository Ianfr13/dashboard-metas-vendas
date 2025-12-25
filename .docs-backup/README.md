# 📊 Dashboard de Metas de Vendas

**Versão:** 2.0.0 (Refatorado)  
**Última Atualização:** 24/12/2024  
**Status:** ✅ Operacional

## 🎯 Visão Geral

O **Dashboard de Metas de Vendas** é uma aplicação web completa para gerenciamento e visualização de metas de vendas, com foco em times de marketing e comercial. A aplicação permite cadastrar metas mensais, produtos, funis de venda, e acompanhar o progresso em tempo real.

## ✨ Funcionalidades Principais

### 1. Dashboard Principal (`/`)
- **Visualização da Meta Principal:** Gauge com progresso da meta mensal.
- **Cards de Overview:** Meta Total, Marketing, Comercial, Ticket Médio.
- **Cards de Progresso:** Dias Restantes, Progresso Esperado, Déficit/Superávit.
- **Ritmo de Vendas:** Ritmo Atual vs Ritmo Necessário.
- **Tabs de Detalhamento:** Marketing, Comercial, Operações.
- **Sub-Metas:** Lista de milestones com status.

### 2. Página de Métricas (`/metricas`)
- **Integração com GTM Analytics:** Visualização de eventos.
- **Funil de Conversão:** Análise de performance.
- **Gráficos de Evolução:** Acompanhamento de métricas ao longo do tempo.
- **Métricas por Produto:** Análise de performance individual.

### 3. Página de Ranking (`/ranking`)
- **Ranking de Vendedores:** Classificação por performance.
- **Filtros:** Por período, time, etc.

### 4. Painel de Administração (`/admin`)
- **Dashboard Admin:** Estatísticas e ações rápidas.
- **Gerenciamento de Metas (`/admin/metas`):** CRUD de metas e sub-metas.
- **Gerenciamento de Produtos (`/admin/produtos`):** CRUD de produtos (nome, valor, canal).
- **Gerenciamento de Funis (`/admin/funis`):** CRUD de funis com produtos (frontend/backend/downsell) e cálculo automático de ticket médio.
- **Configurações (`/admin/configuracoes`):** Informações do sistema.

## 🛠️ Arquitetura e Tecnologias

| Categoria | Tecnologia | Descrição |
|---|---|---|
| **Frontend** | React, Vite, TypeScript, TailwindCSS | Interface de usuário moderna e reativa. |
| **Backend** | Supabase | Backend-as-a-Service (BaaS) com banco de dados PostgreSQL. |
| **Serverless** | Cloudflare Workers, Supabase Edge Functions | Funções serverless para lógica de negócio e integrações. |
| **Autenticação** | Supabase Auth (Google OAuth) | Autenticação segura com provedor Google. |
| **Banco de Dados** | PostgreSQL (Supabase) | Banco de dados relacional para persistência de dados. |
| **Deploy** | Cloudflare Workers | Deploy da aplicação em ambiente serverless global. |

### Estrutura de Dados

**Tabelas Principais:**
- `metas_principais`: Metas mensais
- `sub_metas`: Sub-metas de progresso
- `products`: Catálogo de produtos
- `funis`: Funis de venda
- `funil_produtos`: Relacionamento entre funis e produtos
- `gtm_events`: Eventos de analytics
- `users`: Usuários do sistema

## 🚀 Como Começar

### Pré-requisitos
- Node.js (v18+)
- pnpm
- Supabase CLI
- Cloudflare Wrangler CLI

### Instalação

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/Ianfr13/dashboard-metas-vendas.git
   cd dashboard-metas-vendas
   ```

2. **Instalar dependências:**
   ```bash
   pnpm install
   ```

3. **Configurar variáveis de ambiente:**
   - Crie um arquivo `.env` na raiz do projeto.
   - Adicione as variáveis do Supabase:
     ```
     VITE_SUPABASE_URL=https://auvvrewlbpyymekonilv.supabase.co
     VITE_SUPABASE_ANON_KEY=...
     ```

### Desenvolvimento Local

```bash
pnpm dev
```

A aplicação estará disponível em `http://localhost:5173`.

### Build para Produção

```bash
pnpm build
```

O build será gerado na pasta `dist/`.

## 🔒 Segurança

### Políticas RLS (Row Level Security)

- **Desenvolvimento:** Políticas públicas para facilitar testes.
- **Produção:** **OBRIGATÓRIO** substituir por políticas baseadas em autenticação.

**Exemplo (produção):**
```sql
-- Permitir apenas usuários autenticados
CREATE POLICY "Authenticated users can select products" 
ON products FOR SELECT 
USING (auth.role() = 'authenticated');

-- Permitir apenas admins para modificar
CREATE POLICY "Only admins can modify products" 
ON products FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');
```

### JWT (JSON Web Tokens)

- **Desenvolvimento:** JWT desabilitado nas Edge Functions.
- **Produção:** **OBRIGATÓRIO** reabilitar JWT (`verify_jwt: true`) nas Edge Functions para garantir segurança.

## 🔄 Commits Recentes

- `5ee96cb` - feat: Recriar páginas Produtos e Funis com estrutura antiga
- `9638741` - fix: Corrigir campos obrigatórios e RLS policies
- `c22b65a` - feat: Refatorar Admin em sub-páginas modulares
- `30c6e8b` - fix: Desabilitar JWT na Edge Function gtm-analytics
- `cece3d1` - feat: Migrar backend completo de tRPC/Drizzle para Supabase

## 📝 Notas Adicionais

- **Backup:** Arquivos antigos (servidor Node.js/tRPC, Admin.tsx monolítico) estão na pasta `.backup/`.
- **Code Splitting:** O bundle JS está grande (~1.2 MB). Recomenda-se implementar code-splitting para otimizar o carregamento.
- **Analytics:** Configurar variáveis de ambiente `VITE_ANALYTICS_ENDPOINT` e `VITE_ANALYTICS_WEBSITE_ID` para habilitar analytics.

---

**Autor:** Manus AI  
**Repositório:** [Ianfr13/dashboard-metas-vendas](https://github.com/Ianfr13/dashboard-metas-vendas)
