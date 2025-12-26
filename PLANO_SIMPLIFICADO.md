# 🎯 Plano Simplificado: Sistema de Ranking e Gamificação

**Data:** 26 de Dezembro de 2024  
**Objetivo:** Implementar ranking e gamificação de forma simples e direta

---

## 📋 Resumo

- **1 Edge Function** com handlers para toda a lógica
- **Páginas existentes** serão atualizadas (não criar novas rotas principais)
- **Estrutura simples** de banco de dados
- **Sem complicação**

---

## 🗄️ Banco de Dados (Simples)

### Tabelas Necessárias

#### 1. `user_roles`
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghl_user_id TEXT NOT NULL REFERENCES ghl_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('sdr', 'closer', 'ciclo_completo')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ghl_user_id)
);
```

#### 2. `user_metrics`
```sql
CREATE TABLE user_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghl_user_id TEXT NOT NULL REFERENCES ghl_users(id),
  month DATE NOT NULL, -- primeiro dia do mês
  
  -- Métricas SDR
  agendamentos INTEGER DEFAULT 0,
  comparecimentos INTEGER DEFAULT 0,
  taxa_comparecimento NUMERIC(5, 2) DEFAULT 0,
  
  -- Métricas Closer
  vendas INTEGER DEFAULT 0,
  vendas_primeira_reuniao INTEGER DEFAULT 0,
  vendas_segunda_reuniao INTEGER DEFAULT 0,
  valor_total NUMERIC(12, 2) DEFAULT 0,
  ticket_medio NUMERIC(12, 2) DEFAULT 0,
  taxa_conversao NUMERIC(5, 2) DEFAULT 0,
  
  -- Métricas Ciclo Completo
  vendas_ciclo_completo INTEGER DEFAULT 0,
  
  -- Score
  score NUMERIC(10, 2) DEFAULT 0,
  position INTEGER,
  
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ghl_user_id, month)
);
```

#### 3. `badges`
```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghl_user_id TEXT NOT NULL REFERENCES ghl_users(id),
  badge_type TEXT NOT NULL, -- 'ouro', 'prata', 'bronze', 'campeao_mes', etc
  month DATE NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ghl_user_id, badge_type, month)
);
```

**Índices:**
```sql
CREATE INDEX idx_user_metrics_month ON user_metrics(month DESC);
CREATE INDEX idx_user_metrics_score ON user_metrics(score DESC);
CREATE INDEX idx_badges_month ON badges(month DESC);
```

---

## ⚙️ Edge Function (UMA SÓ)

### Estrutura: `supabase/functions/ranking-system/`

```
ranking-system/
├── index.ts              # Router principal
└── handlers/
    ├── calculate.ts      # Calcular métricas e rankings
    ├── get-rankings.ts   # Buscar rankings
    ├── get-metrics.ts    # Buscar métricas para gráficos
    └── admin.ts          # Funções admin
```

### `index.ts` (Router)
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { calculate } from './handlers/calculate.ts'
import { getRankings } from './handlers/get-rankings.ts'
import { getMetrics } from './handlers/get-metrics.ts'
import { adminActions } from './handlers/admin.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, ...params } = await req.json()

    let result
    switch (action) {
      case 'calculate':
        result = await calculate(params)
        break
      case 'get-rankings':
        result = await getRankings(params)
        break
      case 'get-metrics':
        result = await getMetrics(params)
        break
      case 'admin':
        result = await adminActions(params)
        break
      default:
        throw new Error('Action not found')
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

### Handlers

#### `calculate.ts` - Calcular Rankings
```typescript
// Busca dados do GHL (opportunities, appointments, contacts)
// Agrega por usuário
// Calcula métricas
// Calcula score (com pesos fixos ou da config)
// Ordena e atribui posições
// Atribui badges (top 3 = ouro/prata/bronze)
// Salva em user_metrics e badges
```

#### `get-rankings.ts` - Buscar Rankings
```typescript
// Parâmetros: role (sdr/closer/ciclo_completo), month
// Retorna: lista de usuários ordenados por score com métricas
```

#### `get-metrics.ts` - Buscar Métricas para Gráficos
```typescript
// Parâmetros: type (funil/evolucao/performance), period
// Retorna: dados formatados para gráficos
```

#### `admin.ts` - Funções Admin
```typescript
// Parâmetros: subaction (set-role/recalculate)
// set-role: atribuir função a usuário
// recalculate: forçar recálculo de rankings
```

---

## 🎨 Frontend (Atualizar Páginas Existentes)

### 1. `/metricas` (Atualizar)

**Adicionar:**
- **Cards de Métricas Gerais:**
  - Total de agendamentos
  - Total de vendas
  - Taxa de conversão geral
  - Faturamento total
  - Ticket médio
  - Taxa de não comparecimento

- **Gráficos:**
  - Funil de Vendas (Primeiro Contato → Agendado → Compareceu → Venda)
  - Evolução de Vendas (linha/barras)
  - Performance por SDR (barras)
  - Performance por Closer (barras)
  - Distribuição de Vendas (pizza: Realizada/Sinal/Perdida)
  - 1ª vs 2ª Reunião (barras)

**API:**
```typescript
const data = await rankingAPI.getMetrics({ 
  type: 'funil', // ou 'evolucao', 'performance-sdr', etc
  period: 'month' 
})
```

### 2. `/ranking` (Atualizar)

**Estrutura:**
- **Tabs:** SDRs | Closers | Ciclo Completo
- **Cada Tab:**
  - Top 3 em destaque (cards com badges)
  - Tabela com todos os usuários (posição, nome, métricas, score)
  - Filtro de mês

**API:**
```typescript
const rankings = await rankingAPI.getRankings({ 
  role: 'sdr', // ou 'closer', 'ciclo_completo'
  month: '2024-12' 
})
```

**Componentes:**
- `RankingTable.tsx`: Tabela de ranking
- `TopThreeCards.tsx`: Cards dos top 3 com badges
- `BadgeIcon.tsx`: Ícone do badge

### 3. `/ranking/hall-of-fame` (Nova Sub-rota)

**Estrutura:**
- **Campeões do Mês Atual:**
  - Campeão Geral
  - Melhor SDR
  - Melhor Closer
  - Melhor Ciclo Completo

- **Histórico (6 meses):**
  - Timeline com campeões anteriores
  - Filtro por categoria

**API:**
```typescript
const hallOfFame = await rankingAPI.getRankings({ 
  role: 'all',
  months: 6 
})
```

### 4. `/admin/usuarios` (Nova Página Admin)

**Funcionalidade:**
- Listar usuários do GHL
- Atribuir função (SDR/Closer/Ciclo Completo)
- Ativar/desativar usuário
- Botão "Recalcular Rankings"

**API:**
```typescript
await rankingAPI.admin({ 
  subaction: 'set-role',
  user_id: 'xxx',
  role: 'sdr'
})

await rankingAPI.admin({ 
  subaction: 'recalculate' 
})
```

---

## 🔄 Integração com Webhooks

### Atualizar `webhook-receiver`

Após processar webhook, chamar o cálculo de rankings:

```typescript
// No final do processamento do webhook
EdgeRuntime.waitUntil(
  fetch('https://xxx.supabase.co/functions/v1/ranking-system', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'calculate' })
  }).catch(err => console.error('Erro ao calcular rankings:', err))
)
```

---

## 📊 Lógica de Cálculo (Simples)

### Métricas por Função

**SDR:**
- Agendamentos (contar `ghl_appointments` criados)
- Comparecimentos (contar `ghl_appointments` com status 'completed')
- Taxa de comparecimento (comparecimentos / agendamentos * 100)
- Vendas geradas (contar `ghl_opportunities` com venda onde SDR foi quem agendou)

**Closer:**
- Vendas (contar `ghl_opportunities` com status 'won')
- Vendas 1ª reunião (filtrar por flag)
- Vendas 2ª reunião (filtrar por flag)
- Valor total (somar `monetary_value`)
- Ticket médio (valor total / vendas)
- Taxa de conversão (vendas / reuniões * 100)

**Ciclo Completo:**
- Vendas ciclo completo (vendas onde mesmo usuário fez agendamento e fechamento)
- Taxa de conversão ponta a ponta

### Cálculo de Score (Pesos Fixos Iniciais)

**SDR:**
```
score = (agendamentos * 10) + 
        (comparecimentos * 20) + 
        (taxa_comparecimento * 5) + 
        (vendas_geradas * 50)
```

**Closer:**
```
score = (vendas * 100) + 
        (taxa_conversao * 10) + 
        (ticket_medio / 100)
```

**Ciclo Completo:**
```
score = (vendas_ciclo_completo * 150) + 
        (taxa_conversao_ponta_a_ponta * 15)
```

### Atribuição de Badges

- **Posição 1:** Badge "Ouro" + Badge "Campeão do Mês"
- **Posição 2:** Badge "Prata"
- **Posição 3:** Badge "Bronze"

---

## 🔄 Tempo Real (Opcional/Futuro)

Habilitar Realtime nas tabelas:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE user_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE badges;
```

Frontend:
```typescript
// Hook para atualização automática
useEffect(() => {
  const subscription = supabase
    .channel('rankings')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'user_metrics' },
      () => fetchRankings()
    )
    .subscribe()
  
  return () => subscription.unsubscribe()
}, [])
```

---

## 📅 Cronograma Simplificado

### Fase 1: Backend (2-3 dias)
- [ ] Criar migration com 3 tabelas
- [ ] Criar Edge Function `ranking-system` com 4 handlers
- [ ] Testar cálculos com dados de exemplo
- [ ] Integrar com `webhook-receiver`

### Fase 2: Frontend - Métricas (2 dias)
- [ ] Atualizar `/metricas` com cards e gráficos
- [ ] Criar componentes de gráficos
- [ ] Integrar com API

### Fase 3: Frontend - Ranking (2 dias)
- [ ] Atualizar `/ranking` com tabs e tabela
- [ ] Criar componentes de ranking
- [ ] Criar sub-rota `/ranking/hall-of-fame`

### Fase 4: Frontend - Admin (1 dia)
- [ ] Criar `/admin/usuarios`
- [ ] Integrar com API admin

### Fase 5: Testes e Ajustes (1 dia)
- [ ] Testar fluxo completo
- [ ] Ajustar pesos se necessário
- [ ] Corrigir bugs

**Total: ~1 semana**

---

## 🎯 Estrutura de Arquivos Final

```
supabase/
├── functions/
│   ├── ranking-system/          # NOVA
│   │   ├── index.ts
│   │   └── handlers/
│   │       ├── calculate.ts
│   │       ├── get-rankings.ts
│   │       ├── get-metrics.ts
│   │       └── admin.ts
│   └── webhook-receiver/
│       └── index.ts             # ATUALIZAR (chamar ranking-system)
└── migrations/
    └── 20241226_ranking_system.sql  # NOVA

client/src/
├── pages/
│   ├── Metricas.tsx             # ATUALIZAR
│   ├── Ranking.tsx              # ATUALIZAR
│   └── admin/
│       └── Usuarios.tsx         # NOVA
├── components/
│   ├── ranking/                 # NOVA PASTA
│   │   ├── RankingTable.tsx
│   │   ├── TopThreeCards.tsx
│   │   ├── BadgeIcon.tsx
│   │   └── HallOfFame.tsx
│   └── metricas/                # ATUALIZAR
│       ├── MetricCard.tsx
│       ├── FunnelChart.tsx
│       ├── EvolutionChart.tsx
│       ├── PerformanceChart.tsx
│       └── DistributionChart.tsx
└── lib/
    └── ranking-api.ts           # NOVA (wrapper para Edge Function)
```

---

## 🚀 Próximos Passos

1. **Aprovar este plano simplificado**
2. **Criar branch:** `feature/ranking-system`
3. **Começar pela migration do banco**
4. **Criar Edge Function com handlers**
5. **Testar backend antes de mexer no frontend**

---

## ✅ Diferenças do Plano Anterior

| Antes | Agora |
|-------|-------|
| 13 Edge Functions | 1 Edge Function com 4 handlers |
| 7 tabelas | 3 tabelas |
| 5 páginas novas | 1 página nova + atualizar 2 existentes |
| 10 semanas | 1 semana |
| Complexo | Simples e direto |

---

**Muito mais simples e prático! O que acha?** 🚀
