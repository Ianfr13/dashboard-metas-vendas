# Guia de Desenvolvimento de APIs

Este guia prático mostra como criar novas rotas e endpoints no projeto **dashboard-metas-vendas**.

## 📋 Índice

1. [Criando uma Nova Rota tRPC](#1-criando-uma-nova-rota-trpc)
2. [Criando um Endpoint REST](#2-criando-um-endpoint-rest)
3. [Acessando o Banco de Dados (Supabase)](#3-acessando-o-banco-de-dados-supabase)
4. [Validação de Dados com Zod](#4-validação-de-dados-com-zod)
5. [Autenticação e Autorização](#5-autenticação-e-autorização)
6. [Testando as APIs](#6-testando-as-apis)

---

## 1. Criando uma Nova Rota tRPC

### Passo 1: Criar o arquivo do roteador

Crie um novo arquivo em `server/routes/`, por exemplo: `server/routes/customers.ts`

```typescript
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";

export const customersRouter = router({
  // Listar todos os clientes (requer autenticação)
  list: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await getDb();
    if (!supabase) throw new Error("Database not available");
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', ctx.user.id) // Filtrar por usuário autenticado
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }),

  // Obter um cliente específico
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const supabase = await getDb();
      if (!supabase) throw new Error("Database not available");
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .single();

      if (error) throw error;
      return data;
    }),

  // Criar novo cliente
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await getDb();
      if (!supabase) throw new Error("Database not available");
      
      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: ctx.user.id,
          name: input.name,
          email: input.email,
          phone: input.phone,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  // Atualizar cliente
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const supabase = await getDb();
      if (!supabase) throw new Error("Database not available");
      
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  // Deletar cliente
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await getDb();
      if (!supabase) throw new Error("Database not available");
      
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.user.id);

      if (error) throw error;
      return { success: true };
    }),
});
```

### Passo 2: Registrar o roteador

Edite `server/routers.ts` e adicione o novo roteador:

```typescript
import { customersRouter } from "./routes/customers.js";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  simulations: simulationsRouter,
  goals: goalsRouter,
  analytics: analyticsRouter,
  products: productsRouter,
  customers: customersRouter, // ← Adicione aqui
});
```

### Passo 3: Usar no Frontend

```tsx
import { trpc } from "@/lib/trpc";

function CustomersPage() {
  // Listar clientes
  const { data: customers } = trpc.customers.list.useQuery();

  // Criar cliente
  const createMutation = trpc.customers.create.useMutation();

  const handleCreate = () => {
    createMutation.mutate({
      name: "João Silva",
      email: "joao@example.com",
      phone: "11999999999",
    });
  };

  return (
    <div>
      <button onClick={handleCreate}>Criar Cliente</button>
      <ul>
        {customers?.map(customer => (
          <li key={customer.id}>{customer.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 2. Criando um Endpoint REST

### Passo 1: Criar o arquivo do roteador

Crie um novo arquivo em `server/routes/`, por exemplo: `server/routes/public-api.ts`

```typescript
import { Router } from "express";
import { getDb } from "../db";

const router = Router();

// GET /api/public/stats
router.get("/stats", async (req, res) => {
  try {
    const supabase = await getDb();
    if (!supabase) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { data, error } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;

    res.json({
      success: true,
      total_customers: data?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// POST /api/public/contact
router.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const supabase = await getDb();
    if (!supabase) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { error } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        message,
      });

    if (error) throw error;

    res.json({ success: true, message: "Message received" });
  } catch (error) {
    console.error("Error saving contact:", error);
    res.status(500).json({ error: "Failed to save message" });
  }
});

export default router;
```

### Passo 2: Registrar o roteador

Edite `server/_core/index.ts` e adicione o novo roteador:

```typescript
import publicApiRouter from "../routes/public-api.js";

// ...

app.use("/api/public", publicApiRouter);
```

### Passo 3: Testar com cURL

```bash
# GET
curl http://localhost:3000/api/public/stats

# POST
curl -X POST http://localhost:3000/api/public/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@example.com","message":"Olá!"}'
```

---

## 3. Acessando o Banco de Dados (Supabase)

### Operações CRUD Básicas

```typescript
import { getDb } from "../db";

const supabase = await getDb();

// SELECT
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', 'value');

// INSERT
const { data, error } = await supabase
  .from('table_name')
  .insert({ column1: 'value1', column2: 'value2' })
  .select()
  .single();

// UPDATE
const { data, error } = await supabase
  .from('table_name')
  .update({ column1: 'new_value' })
  .eq('id', 123)
  .select()
  .single();

// DELETE
const { error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', 123);
```

### Filtros Avançados

```typescript
// Múltiplas condições (AND)
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('active', 1)
  .gte('price', 100)
  .lte('price', 500);

// OR
const { data } = await supabase
  .from('products')
  .select('*')
  .or('type.eq.front,type.eq.upsell');

// LIKE
const { data } = await supabase
  .from('products')
  .select('*')
  .ilike('name', '%curso%');

// ORDER BY
const { data } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false });

// LIMIT
const { data } = await supabase
  .from('products')
  .select('*')
  .limit(10);
```

---

## 4. Validação de Dados com Zod

O projeto usa **Zod** para validação de dados de entrada.

### Exemplo Básico

```typescript
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  age: z.number().min(18, "Deve ter pelo menos 18 anos"),
  phone: z.string().optional(),
});

// Usar no tRPC
create: protectedProcedure
  .input(customerSchema)
  .mutation(async ({ input }) => {
    // input está validado e tipado!
  });
```

### Schemas Complexos

```typescript
const orderSchema = z.object({
  customer_id: z.number(),
  items: z.array(
    z.object({
      product_id: z.number(),
      quantity: z.number().min(1),
      price: z.number().positive(),
    })
  ).min(1, "Pelo menos um item é obrigatório"),
  total: z.number().positive(),
  payment_method: z.enum(["credit_card", "pix", "boleto"]),
});
```

---

## 5. Autenticação e Autorização

### Tipos de Procedimentos

| Procedimento | Descrição | Uso |
|--------------|-----------|-----|
| `publicProcedure` | Não requer autenticação | Endpoints públicos |
| `protectedProcedure` | Requer autenticação | Endpoints privados |
| `adminProcedure` | Requer autenticação + role admin | Endpoints administrativos |

### Exemplo de Uso

```typescript
// Público - qualquer um pode acessar
list: publicProcedure.query(async () => {
  // ...
});

// Protegido - apenas usuários autenticados
myData: protectedProcedure.query(async ({ ctx }) => {
  const userId = ctx.user.id; // ctx.user está disponível
  // ...
});

// Admin - apenas administradores
deleteUser: adminProcedure
  .input(z.object({ userId: z.number() }))
  .mutation(async ({ input }) => {
    // Apenas admins podem executar
  });
```

---

## 6. Testando as APIs

### Testando tRPC no Frontend

Use o React Query DevTools para inspecionar as queries:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

### Testando REST com cURL

```bash
# GET
curl http://localhost:3000/api/gtm/stats

# POST
curl -X POST http://localhost:3000/api/gtm/event \
  -H "Content-Type: application/json" \
  -d '{"event_name":"test_event","user_id":"123"}'
```

### Testando REST com Postman/Insomnia

1. Importe a coleção de endpoints
2. Configure a base URL: `http://localhost:3000`
3. Teste cada endpoint

---

## 📚 Recursos Adicionais

- [Documentação do tRPC](https://trpc.io/docs)
- [Documentação do Supabase JS](https://supabase.com/docs/reference/javascript/introduction)
- [Documentação do Zod](https://zod.dev/)
- [Documentação do Express](https://expressjs.com/)

---

## ✅ Checklist de Desenvolvimento

Ao criar uma nova API, certifique-se de:

- [ ] Validar todos os inputs com Zod
- [ ] Usar o procedimento correto (public/protected/admin)
- [ ] Filtrar dados por `user_id` quando necessário
- [ ] Tratar erros adequadamente
- [ ] Retornar tipos consistentes
- [ ] Documentar a rota neste arquivo
- [ ] Testar com dados reais
- [ ] Verificar políticas RLS no Supabase

---

**Bom desenvolvimento!** 🚀
