# Arquitetura de API com Edge Functions

## 1. Visão Geral

A arquitetura da API foi **completamente reestruturada** para usar exclusivamente **Edge Functions** do Supabase. Esta abordagem oferece segurança máxima, escalabilidade e uma experiência de desenvolvimento moderna.

**Principais Mudanças:**

1.  **Backend Tradicional Removido**: O servidor Express/tRPC foi eliminado. Toda a lógica de negócio agora reside nas Edge Functions.
2.  **Edge Functions como API**: O frontend agora se comunica diretamente com as Edge Functions do Supabase.
3.  **Segurança Máxima**: Nenhuma chave (nem mesmo a `anonKey`) é exposta no frontend. A comunicação é autenticada via JWT do usuário.
4.  **Dados via GTM**: A API de webhooks de pagamento foi removida. Todos os dados de vendas e eventos agora chegam via Google Tag Manager (GTM) e são processados por uma Edge Function específica.

## 2. Diagrama da Nova Arquitetura

```mermaid
graph TD
    subgraph Frontend (React)
        A[Componente React] --> B{Helper de Funções};
    end

    subgraph Supabase Cloud
        B --> C{Edge Functions};
        D[Google Tag Manager] --> E{Edge Function (gtm-event)};
        C --> F{Supabase Auth (JWT)};
        E --> F;
        F --> G{RLS Policies};
        G --> H[PostgreSQL DB];
    end

    style D fill:#f9f,stroke:#333,stroke-width:2px
    style A fill:#bbf,stroke:#333,stroke-width:2px
```

## 3. Edge Functions

As Edge Functions são o coração da nova arquitetura. Elas são escritas em TypeScript e rodam no Deno, um ambiente de execução seguro para JavaScript/TypeScript.

### 3.1. Estrutura de Arquivos

Todas as funções residem em `supabase/functions/`:

| Arquivo | Descrição |
| :--- | :--- |
| `supabase/functions/list-simulations/index.ts` | Lista as simulações do usuário. |
| `supabase/functions/create-simulation/index.ts` | Cria uma nova simulação. |
| `supabase/functions/gtm-event/index.ts` | Recebe eventos do GTM. |
| `supabase/functions/_shared/cors.ts` | Configurações de CORS compartilhadas. |

### 3.2. Segurança nas Edge Functions

A segurança é garantida em múltiplas camadas:

1.  **Autenticação JWT**: Cada requisição do frontend para uma Edge Function inclui o JWT do usuário no header `Authorization`. A função valida este token usando o Supabase Auth.
2.  **Row Level Security (RLS)**: Mesmo com um JWT válido, o acesso aos dados é controlado pelas políticas de RLS no banco de dados. A função assume a identidade do usuário e só pode acessar os dados que o usuário tem permissão para ver.
3.  **Nenhuma Chave Exposta**: O frontend não precisa de nenhuma chave de API. Ele apenas precisa saber a URL da Edge Function.

**Exemplo de validação de JWT em uma Edge Function:**

```typescript
// supabase/functions/list-simulations/index.ts

const authHeader = req.headers.get('Authorization');

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_ANON_KEY'),
  { global: { headers: { Authorization: authHeader } } }
);

const { data: { user } } = await supabaseClient.auth.getUser();

if (!user) {
  throw new Error('Unauthorized');
}
```

### 3.3. Funções Criadas

| Função | Endpoint | Método | Autenticação |
| :--- | :--- | :--- | :--- |
| `list-simulations` | `/functions/v1/list-simulations` | `GET` | JWT Obrigatório |
| `create-simulation` | `/functions/v1/create-simulation` | `POST` | JWT Obrigatório |
| `gtm-event` | `/functions/v1/gtm-event` | `POST` | Nenhuma (Pública) |

## 4. Integração com o Frontend (React)

O frontend agora usa um helper (`client/src/lib/edge-functions.ts`) para chamar as Edge Functions de forma segura e tipada.

**Exemplo de uso:**

```typescript
// client/src/lib/edge-functions.ts

async function callFunction<T>(functionName: string, options: any): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(`${FUNCTIONS_URL}/${functionName}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    // ...
  });

  return response.json();
}

// Em um componente React
import { simulationsAPI } from '@/lib/edge-functions';

function MyComponent() {
  const [simulations, setSimulations] = useState([]);

  useEffect(() => {
    simulationsAPI.list().then(setSimulations);
  }, []);

  // ...
}
```

## 5. Deploy das Edge Functions

O deploy das Edge Functions é feito via **Supabase CLI**.

1.  **Instalar CLI**:
    ```bash
    npm install -g supabase
    ```
2.  **Login**:
    ```bash
    supabase login
    ```
3.  **Link ao Projeto**:
    ```bash
    supabase link --project-ref auvvrewlbpyymekonilv
    ```
4.  **Deploy**:
    ```bash
    supabase functions deploy
    ```

Consulte o arquivo `EDGE_FUNCTIONS_DEPLOY.md` para mais detalhes.

## 6. Conclusão

A nova arquitetura baseada em Edge Functions é o padrão ouro para aplicações Supabase modernas.

-   ✅ **Segurança Máxima**: Nenhuma chave no frontend.
-   ✅ **Escalabilidade**: Funções serverless que escalam sob demanda.
-   ✅ **Simplicidade**: Lógica de negócio centralizada nas Edge Functions.
-   ✅ **Performance**: Funções executadas perto do usuário e do banco de dados.

Esta abordagem elimina a necessidade de um servidor backend tradicional, reduzindo custos e complexidade, ao mesmo tempo que aumenta a segurança e a performance do projeto para o nível mais alto possível.
