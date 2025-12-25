# Deploy de Edge Functions no Supabase

## ⚠️ Nota Importante

O deploy de Edge Functions via MCP ainda não está totalmente funcional. Por enquanto, você precisa fazer o deploy manualmente via **Supabase CLI** ou **Dashboard**.

## Opção 1: Deploy via Supabase CLI (Recomendado)

### 1. Instalar Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Ou via npm
npm install -g supabase
```

### 2. Login no Supabase

```bash
supabase login
```

### 3. Link ao projeto

```bash
supabase link --project-ref auvvrewlbpyymekonilv
```

### 4. Deploy das funções

```bash
# Deploy de todas as funções
supabase functions deploy

# Ou deploy de uma função específica
supabase functions deploy list-simulations
```

## Opção 2: Deploy via Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/functions
2. Clique em "New Function"
3. Cole o código da função
4. Clique em "Deploy"

## Edge Functions Criadas

### 1. list-simulations

**Arquivo:** `supabase/functions/list-simulations/index.ts`

**Descrição:** Lista todas as simulações do usuário autenticado.

**Endpoint:** `https://auvvrewlbpyymekonilv.supabase.co/functions/v1/list-simulations`

**Método:** GET

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Resposta:**
```json
[
  {
    "id": 1,
    "user_id": 123,
    "name": "Simulação Janeiro",
    "scenario": "3M",
    ...
  }
]
```

## Como Chamar do Frontend

```typescript
// Obter o token JWT do usuário autenticado
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Chamar a Edge Function
const response = await fetch(
  'https://auvvrewlbpyymekonilv.supabase.co/functions/v1/list-simulations',
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const simulations = await response.json();
```

## Próximas Edge Functions a Criar

- [ ] `create-simulation` - Criar nova simulação
- [ ] `update-simulation` - Atualizar simulação
- [ ] `delete-simulation` - Deletar simulação
- [ ] `list-goals` - Listar metas
- [ ] `create-goal` - Criar meta
- [ ] `list-products` - Listar produtos
- [ ] `gtm-event` - Receber eventos do GTM

## Vantagens das Edge Functions

✅ **Nenhuma chave exposta no frontend** - Apenas JWT do usuário  
✅ **Serverless** - Escala automaticamente  
✅ **Global** - Deploy em múltiplas regiões  
✅ **Seguro** - Autenticação JWT obrigatória  
✅ **TypeScript nativo** - Suporte total a Deno  

## Segurança

- ✅ `verify_jwt: true` - Todas as funções requerem JWT válido
- ✅ RLS aplicado automaticamente via JWT
- ✅ Sem exposição de service role key
- ✅ CORS configurado corretamente
