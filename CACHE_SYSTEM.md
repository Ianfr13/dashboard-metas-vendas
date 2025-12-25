## 💾 Sistema de Cache com React Query

O frontend agora possui um sistema de cache inteligente que melhora drasticamente a performance e reduz chamadas desnecessárias à API.

### 🚀 Benefícios

| Benefício | Descrição |
|-----------|-----------|
| **⚡ Performance** | Dados são servidos instantaneamente do cache |
| **🔄 Menos Chamadas** | API só é chamada quando necessário |
| **💰 Economia** | Reduz custos de Edge Functions |
| **🎯 UX Melhor** | Navegação instantânea entre páginas |
| **🔌 Offline-First** | Dados disponíveis mesmo sem conexão temporária |

### 📊 Configuração

**Cache Global (App.tsx):**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutos
      gcTime: 10 * 60 * 1000,        // 10 minutos
      refetchOnWindowFocus: false,    // Não refetch ao focar
      retry: 1,                       // 1 retry automático
    },
  },
});
```

### 🎯 Como Usar

#### **1. Hook Básico**

```typescript
import { useDashboardData } from '@/hooks/useDashboardData';

function MyComponent() {
  const { data, isLoading, error, refetch } = useDashboardData({
    month: 1,
    year: 2025
  });

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  return (
    <div>
      <h1>Vendas: {data.totals.sales}</h1>
      <button onClick={() => refetch()}>Atualizar</button>
    </div>
  );
}
```

#### **2. Hook para Mês Atual**

```typescript
import { useCurrentMonthDashboard } from '@/hooks/useDashboardData';

function CurrentMonthStats() {
  const { data, isLoading } = useCurrentMonthDashboard();
  
  // Automaticamente busca dados do mês atual
  return <div>Vendas: {data?.totals.sales}</div>;
}
```

#### **3. Múltiplos Meses (Cache Independente)**

```typescript
function MultiMonthView() {
  const jan = useDashboardData({ month: 1, year: 2025 });
  const feb = useDashboardData({ month: 2, year: 2025 });
  const mar = useDashboardData({ month: 3, year: 2025 });

  // Cada mês tem seu próprio cache!
  // Se você já visitou Janeiro, ele carrega instantaneamente
}
```

### 🔄 Ciclo de Vida do Cache

```
1. Primeira Chamada
   ↓
   Busca da API (Edge Function)
   ↓
   Armazena no cache (fresh)
   ↓
2. Próximas 5 minutos
   ↓
   Serve do cache (instantâneo)
   ↓
3. Após 5 minutos (stale)
   ↓
   Serve do cache + busca em background
   ↓
   Atualiza cache silenciosamente
   ↓
4. Após 10 minutos sem uso
   ↓
   Cache é limpo (garbage collected)
```

### 🎨 Estados do Hook

```typescript
const {
  data,           // Dados do dashboard
  isLoading,      // true na primeira carga
  isFetching,     // true durante qualquer fetch (incluindo background)
  error,          // Erro se houver
  refetch,        // Função para forçar atualização
  isSuccess,      // true quando dados carregaram
  isError,        // true se deu erro
} = useDashboardData({ month, year });
```

### 💡 Boas Práticas

#### **✅ Fazer:**

```typescript
// 1. Usar o hook no topo do componente
const { data, isLoading } = useDashboardData({ month, year });

// 2. Tratar loading e error
if (isLoading) return <Skeleton />;
if (error) return <ErrorMessage error={error} />;

// 3. Usar refetch para atualização manual
<button onClick={() => refetch()}>Atualizar</button>

// 4. Desabilitar query quando necessário
const { data } = useDashboardData({ 
  month, 
  year, 
  enabled: isAuthenticated // Só busca se autenticado
});
```

#### **❌ Evitar:**

```typescript
// 1. Não chamar a API diretamente
// ❌ const data = await dashboardAPI.getData();
// ✅ const { data } = useDashboardData();

// 2. Não usar useEffect para buscar dados
// ❌ useEffect(() => { fetchData(); }, []);
// ✅ const { data } = useDashboardData();

// 3. Não criar estado local para dados da API
// ❌ const [data, setData] = useState();
// ✅ const { data } = useDashboardData();
```

### 🔍 Debug

Para ver o cache em ação, abra o DevTools:

```typescript
// Adicione no App.tsx (apenas desenvolvimento)
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### 📈 Performance

**Sem Cache:**
- Primeira carga: ~500ms
- Trocar de mês: ~500ms
- Voltar ao mês anterior: ~500ms
- Total: 1500ms

**Com Cache:**
- Primeira carga: ~500ms
- Trocar de mês: ~500ms
- Voltar ao mês anterior: **~0ms** ⚡
- Total: 1000ms (33% mais rápido)

### 🎯 Quando o Cache é Invalidado

O cache é automaticamente invalidado quando:
- ✅ Passa 5 minutos (stale)
- ✅ Passa 10 minutos sem uso (garbage collected)
- ✅ Você chama `refetch()` manualmente
- ✅ Você muda os parâmetros (month/year diferente)

### 🚀 Exemplo Completo

Veja `client/src/components/DashboardExample.tsx` para um exemplo completo com:
- Loading states
- Error handling
- Seletor de mês/ano
- Refetch manual
- Exibição de dados

### 📚 Recursos

- [React Query Docs](https://tanstack.com/query/latest)
- [Guia de Caching](https://tanstack.com/query/latest/docs/react/guides/caching)
- [Query Keys](https://tanstack.com/query/latest/docs/react/guides/query-keys)

**Agora o dashboard é super rápido!** ⚡💾
