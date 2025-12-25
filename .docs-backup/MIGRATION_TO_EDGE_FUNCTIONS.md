# Migração para Edge Functions - Resumo Executivo

## 🎯 Objetivo

Reestruturar completamente a arquitetura da API para usar **Edge Functions** do Supabase, eliminando a exposição de chaves no frontend e removendo a dependência de webhooks de pagamento.

## ✅ O que foi feito

### 1. Remoção de Webhooks de Pagamento

**Antes:**
- API REST em `server/routes/webhooks.ts` recebia notificações de gateways de pagamento
- Processamento de vendas no backend Node.js

**Depois:**
- ✅ Arquivo `webhooks.ts` removido (backup em `webhooks.ts.backup`)
- ✅ Registro da rota removido de `server/_core/index.ts`
- ✅ Todos os dados de vendas agora vêm via **Google Tag Manager (GTM)**

**Motivo:** Centralizar todos os eventos de tracking (views, leads, vendas) em um único canal (GTM), simplificando a arquitetura.

### 2. Criação de Edge Functions

Foram criadas **3 Edge Functions** em TypeScript/Deno:

| Função | Arquivo | Descrição |
|--------|---------|-----------|
| `list-simulations` | `supabase/functions/list-simulations/index.ts` | Lista simulações do usuário autenticado |
| `create-simulation` | `supabase/functions/create-simulation/index.ts` | Cria nova simulação |
| `gtm-event` | `supabase/functions/gtm-event/index.ts` | Recebe eventos do GTM (público) |

**Arquivos auxiliares:**
- `supabase/functions/_shared/cors.ts` - Configuração de CORS compartilhada

### 3. Atualização do Frontend

**Criado:**
- `client/src/lib/edge-functions.ts` - Helper para chamar Edge Functions

**Exemplo de uso:**
```typescript
import { simulationsAPI } from '@/lib/edge-functions';

// Listar simulações
const simulations = await simulationsAPI.list();

// Criar simulação
await simulationsAPI.create({
  name: 'Simulação Janeiro',
  scenario: '3M',
  vslConversionRate: 30,
});
```

### 4. Remoção de Chaves do Frontend

**Antes:**
```typescript
// client/src/lib/supabase.ts
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Depois:**
```typescript
// client/src/lib/supabase.ts
const supabaseAnonKey = ''; // REMOVIDA!
```

**Variáveis de ambiente atualizadas:**
- `.env.example` - Anon key comentada no frontend
- `VITE_SUPABASE_ANON_KEY` - Não é mais necessária

### 5. Documentação Criada

| Arquivo | Descrição |
|---------|-----------|
| `EDGE_FUNCTIONS_ARCHITECTURE.md` | Arquitetura completa com Edge Functions |
| `EDGE_FUNCTIONS_DEPLOY.md` | Guia de deploy via Supabase CLI |
| `MIGRATION_TO_EDGE_FUNCTIONS.md` | Este arquivo (resumo executivo) |

## 🔐 Segurança Aprimorada

### Antes (Arquitetura Antiga)

```
Frontend → Anon Key → Supabase (RLS)
```

**Problemas:**
- Anon key exposta no frontend
- Mesmo protegida por RLS, ainda é uma chave visível

### Depois (Arquitetura Nova)

```
Frontend → JWT do Usuário → Edge Function → Supabase (RLS)
```

**Vantagens:**
- ✅ **Nenhuma chave exposta** no frontend
- ✅ Autenticação via JWT (único por usuário)
- ✅ Edge Functions validam JWT antes de acessar dados
- ✅ RLS aplicado automaticamente via JWT
- ✅ Service role key usada apenas nas Edge Functions (server-side)

## 📊 Comparação de Arquiteturas

| Aspecto | Antes (tRPC + Express) | Depois (Edge Functions) |
|---------|------------------------|-------------------------|
| **Servidor Backend** | Node.js/Express | Nenhum (Serverless) |
| **Chaves no Frontend** | Anon Key | Nenhuma |
| **Autenticação** | JWT + RLS | JWT + RLS |
| **Webhooks de Pagamento** | API REST dedicada | Via GTM |
| **Escalabilidade** | Manual (servidor) | Automática (serverless) |
| **Custo** | Servidor 24/7 | Pay-per-use |
| **Deploy** | CI/CD complexo | `supabase functions deploy` |
| **Latência** | Depende do servidor | Edge (próximo ao usuário) |

## 🚀 Próximos Passos

### 1. Deploy das Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref auvvrewlbpyymekonilv

# Deploy
supabase functions deploy
```

### 2. Atualizar Frontend para Usar Edge Functions

Substituir chamadas tRPC por chamadas ao helper de Edge Functions:

**Antes:**
```typescript
const { data } = trpc.simulations.list.useQuery();
```

**Depois:**
```typescript
const simulations = await simulationsAPI.list();
```

### 3. Configurar GTM para Enviar Eventos

Atualizar o GTM para enviar todos os eventos para a Edge Function `gtm-event`:

```javascript
// No GTM
fetch('https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_name: 'purchase',
    event_data: { transaction_id: '123', value: 997 },
    page_url: window.location.href,
  }),
});
```

### 4. Criar Edge Functions Restantes

Ainda faltam criar Edge Functions para:
- [ ] `update-simulation`
- [ ] `delete-simulation`
- [ ] `list-goals`
- [ ] `create-goal`
- [ ] `list-products`

Seguir o padrão das funções já criadas.

### 5. Remover Backend Antigo (Opcional)

Após migração completa, você pode remover:
- `server/routes/*` (exceto arquivos de backup)
- `server/routers.ts`
- Dependências do tRPC

## 🎓 Aprendizados

1. **Edge Functions são o futuro**: Serverless, escalável e seguro por padrão.
2. **Menos é mais**: Eliminar o backend tradicional simplifica a arquitetura.
3. **Segurança em camadas**: JWT + RLS + Edge Functions = Segurança máxima.
4. **GTM como hub de dados**: Centralizar eventos simplifica o fluxo de dados.

## 📚 Referências

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Runtime](https://deno.land/)
- [JWT Authentication](https://jwt.io/)

---

**Migração realizada em:** 24 de Dezembro de 2024  
**Status:** ✅ Concluída (75% - Edge Functions criadas, aguardando deploy)
