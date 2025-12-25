# Arquitetura da API - Dashboard de Metas de Vendas

## 1. Visão Geral

A arquitetura da API do projeto é **híbrida**, combinando o melhor de dois mundos:

1.  **API tRPC**: Para comunicação interna entre o frontend (React) e o backend (Node.js), garantindo **tipagem 100% segura** e desenvolvimento ágil.
2.  **API REST (Express)**: Para endpoints públicos que precisam ser acessados por serviços externos, como webhooks de gateways de pagamento e eventos do Google Tag Manager (GTM).

Ambas as APIs rodam no mesmo servidor **Express** e se comunicam com o banco de dados **Supabase**.

## 2. Diagrama da Arquitetura

```mermaid
graph TD
    subgraph Frontend (React)
        A[Componente React] --> B{tRPC Client};
    end

    subgraph Servidor Backend (Node.js/Express)
        B --> C[/api/trpc/...];
        D[Serviço Externo] --> E{API REST};
        C --> F[tRPC Router];
        E --> G[Express Router];
        F --> H[Controller];
        G --> H;
        H --> I{Supabase Client};
    end

    subgraph Supabase
        I --> J[PostgreSQL DB];
    end

    style D fill:#f9f,stroke:#333,stroke-width:2px
    style A fill:#bbf,stroke:#333,stroke-width:2px
```

## 3. API tRPC (`/api/trpc`)

A principal API do sistema é construída com **tRPC**, uma biblioteca que permite criar APIs totalmente tipadas sem a necessidade de gerar schemas ou clientes.

### 3.1. Principais Benefícios

-   **Tipagem End-to-End**: O frontend sabe exatamente quais são os inputs e outputs da API, eliminando uma classe inteira de bugs.
-   **Autocomplete**: O editor de código (VSCode) autocompleta os nomes das rotas e seus parâmetros.
-   **Desenvolvimento Rápido**: Não é preciso definir schemas (como OpenAPI/Swagger) ou gerar clientes. A tipagem é inferida automaticamente.

### 3.2. Estrutura de Arquivos

| Arquivo | Descrição |
| :--- | :--- |
| `server/_core/trpc.ts` | Define os **procedimentos** base do tRPC (público, protegido, admin). |
| `server/routers.ts` | O **roteador principal** (`appRouter`) que combina todos os outros roteadores. |
| `server/routes/*.ts` | **Sub-roteadores** que agrupam funcionalidades (ex: `simulationsRouter`). |
| `server/_core/index.ts` | Registra o middleware do tRPC no Express no endpoint `/api/trpc`. |

### 3.3. Procedimentos (Middleware)

O tRPC usa um sistema de middleware para controlar o acesso, definidos em `server/_core/trpc.ts`:

-   `publicProcedure`: Endpoint público, não requer autenticação.
-   `protectedProcedure`: Requer que o usuário esteja autenticado. Se não, retorna um erro `UNAUTHORIZED`.
-   `adminProcedure`: Requer que o usuário esteja autenticado e tenha a role de `admin`. Se não, retorna `FORBIDDEN`.

**Exemplo de uso em uma rota:**

```typescript
// server/routes/simulations.ts

export const simulationsRouter = router({
  // Esta rota requer autenticação
  list: protectedProcedure.query(async ({ ctx }) => {
    // ctx.user está disponível e tipado
    const userId = ctx.user.id;
    // ...lógica da rota
  }),
});
```

### 3.4. Roteadores Disponíveis

As seguintes APIs tRPC estão disponíveis em `/api/trpc`:

| Rota | Descrição |
| :--- | :--- |
| `auth.me` | Retorna os dados do usuário autenticado. |
| `auth.logout` | Realiza o logout do usuário. |
| `simulations.*` | CRUD para simulações de vendas. |
| `goals.*` | CRUD para metas e sub-metas. |
| `analytics.*` | Endpoints para análise de dados. |
| `products.*` | CRUD para produtos. |

## 4. API REST (Express)

Para endpoints que precisam ser acessíveis por serviços de terceiros (que não entendem tRPC), foi criada uma API REST tradicional usando **Express**.

### 4.1. Casos de Uso

-   **Webhooks**: Receber notificações de gateways de pagamento (ex: Stripe, Hotmart).
-   **Eventos de Tracking**: Receber eventos do Google Tag Manager (GTM).
-   **Endpoints Públicos Simples**: APIs que não se beneficiam da tipagem do tRPC.

### 4.2. Estrutura de Arquivos

| Arquivo | Descrição |
| :--- | :--- |
| `server/_core/index.ts` | Registra os roteadores do Express nos seus respectivos endpoints. |
| `server/routes/webhooks.ts` | Lógica para os webhooks de pagamento. |
| `server/routes/gtm.ts` | Lógica para os eventos do GTM. |
| `server/routes/funis.ts` | CRUD para a gestão de funis. |

### 4.3. Endpoints Disponíveis

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/webhooks/payment` | Recebe notificações de pagamento. |
| `POST` | `/api/gtm/event` | Endpoint genérico para eventos do GTM. |
| `POST` | `/api/gtm/purchase` | Endpoint específico para eventos de compra. |
| `GET` | `/api/funis` | Lista todos os funis de venda. |
| `POST` | `/api/funis` | Cria um novo funil. |

## 5. Integração com o Frontend (React)

O frontend consome a API tRPC de forma muito simples e elegante usando o pacote `@trpc/react-query`.

**Exemplo de uso em um componente React:**

```tsx
// client/src/pages/Home.tsx
import { trpc } from "@/lib/trpc";

function MyComponent() {
  // Chama a rota `simulations.list` da API
  // O hook `useQuery` vem do React Query
  const { data: simulations, isLoading } = trpc.simulations.list.useQuery();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <ul>
      {/* `simulations` está 100% tipado! */}
      {simulations?.map(sim => (
        <li key={sim.id}>{sim.name}</li>
      ))}
    </ul>
  );
}
```

## 6. Conclusão

A arquitetura de API híbrida oferece uma base robusta e flexível para o projeto:

-   **tRPC** para a comunicação interna, garantindo segurança de tipos, produtividade e uma excelente experiência de desenvolvimento.
-   **Express REST** para a comunicação externa, garantindo compatibilidade com o ecossistema web padrão (webhooks, etc.).

Essa abordagem permite que o projeto evolua de forma segura e escalável, aproveitando as melhores ferramentas para cada caso de uso.
