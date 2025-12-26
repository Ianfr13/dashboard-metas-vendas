# 🎯 Plano de Ação: Sistema de Ranking e Gamificação

**Projeto:** Dashboard de Metas de Vendas  
**Data:** 26 de Dezembro de 2024  
**Objetivo:** Implementar sistema completo de ranking, gamificação e Hall of Fame para SDRs, Closers e Ciclo Completo

---

## 📋 Visão Geral

Este plano detalha a implementação de um sistema completo de ranking e gamificação para equipes de vendas, incluindo:
- Rankings separados por função (SDR, Closer, Ciclo Completo)
- Sistema de badges e premiações
- Hall of Fame mensal e anual
- Dashboard com gráficos e métricas
- Área administrativa para gerenciamento
- Atualização em tempo real via webhooks do GoHighLevel

---

## 🏗️ Arquitetura da Solução

### Princípios de Design

1. **Backend-First:** Toda lógica de cálculo, pontuação e agregação será feita em Edge Functions
2. **Segurança:** Frontend usa apenas `anon key`, sem expor chaves sensíveis
3. **Modularidade:** Edge Functions organizadas por domínio usando handlers
4. **Tempo Real:** Supabase Realtime para atualização automática
5. **Performance:** Índices otimizados e queries eficientes

### Fluxo de Dados

```
GoHighLevel Webhook → Edge Function webhook-receiver → Tabelas GHL
                                                              ↓
                                        Edge Function calculate-rankings
                                                              ↓
                                        Tabelas de Rankings/Badges
                                                              ↓
                                        Supabase Realtime → Frontend
```

---

## 📊 Fase 1: Estrutura do Banco de Dados

### 1.1 Novas Tabelas

#### `user_roles` (Funções dos Usuários)
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghl_user_id TEXT NOT NULL REFERENCES ghl_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('sdr', 'closer', 'ciclo_completo')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ghl_user_id)
);
```

#### `ranking_weights` (Pesos para Cálculo de Pontuação)
```sql
CREATE TABLE ranking_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('sdr', 'closer', 'ciclo_completo')),
  metric_name TEXT NOT NULL, -- ex: 'agendamentos', 'vendas', 'taxa_conversao'
  weight NUMERIC(5, 2) NOT NULL DEFAULT 1.0, -- peso da métrica
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, metric_name)
);
```

#### `user_metrics` (Métricas Calculadas por Usuário)
```sql
CREATE TABLE user_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghl_user_id TEXT NOT NULL REFERENCES ghl_users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Métricas SDR
  agendamentos INTEGER DEFAULT 0,
  comparecimentos INTEGER DEFAULT 0,
  nao_comparecimentos INTEGER DEFAULT 0,
  taxa_comparecimento NUMERIC(5, 2) DEFAULT 0, -- %
  vendas_geradas INTEGER DEFAULT 0,
  
  -- Métricas Closer
  vendas INTEGER DEFAULT 0,
  vendas_primeira_reuniao INTEGER DEFAULT 0,
  vendas_segunda_reuniao INTEGER DEFAULT 0,
  vendas_perdidas INTEGER DEFAULT 0,
  valor_total_vendido NUMERIC(12, 2) DEFAULT 0,
  ticket_medio NUMERIC(12, 2) DEFAULT 0,
  taxa_conversao NUMERIC(5, 2) DEFAULT 0, -- %
  
  -- Métricas Ciclo Completo
  vendas_ciclo_completo INTEGER DEFAULT 0,
  taxa_conversao_ponta_a_ponta NUMERIC(5, 2) DEFAULT 0, -- %
  
  -- Pontuação
  score NUMERIC(10, 2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ghl_user_id, period_type, period_start)
);
```

#### `rankings` (Rankings Calculados)
```sql
CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghl_user_id TEXT NOT NULL REFERENCES ghl_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('sdr', 'closer', 'ciclo_completo', 'geral')),
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  position INTEGER NOT NULL,
  score NUMERIC(10, 2) NOT NULL,
  metrics JSONB, -- snapshot das métricas
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ghl_user_id, role, period_type, period_start)
);
```

#### `badges` (Tipos de Badges)
```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- ex: 'ouro', 'prata', 'bronze', 'campeao_mes'
  display_name TEXT NOT NULL, -- ex: 'Ouro', 'Campeão do Mês'
  description TEXT,
  icon TEXT, -- emoji ou nome do ícone
  color TEXT, -- cor hex
  criteria JSONB, -- critérios para ganhar o badge
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `user_badges` (Badges Conquistados)
```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghl_user_id TEXT NOT NULL REFERENCES ghl_users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'yearly', 'all_time')),
  period_start DATE,
  period_end DATE,
  awarded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ghl_user_id, badge_id, period_type, period_start)
);
```

#### `hall_of_fame` (Hall da Fama)
```sql
CREATE TABLE hall_of_fame (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghl_user_id TEXT NOT NULL REFERENCES ghl_users(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'campeao_geral', 'melhor_sdr', 'melhor_closer', etc
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  score NUMERIC(10, 2) NOT NULL,
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category, period_type, period_start, period_end)
);
```

#### `premiacoes` (Premiações Configuráveis)
```sql
CREATE TABLE premiacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  premio TEXT, -- descrição do prêmio
  category TEXT NOT NULL, -- 'sdr', 'closer', 'geral', 'evolucao', 'streak'
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.2 Índices para Performance

```sql
-- Índices em user_metrics
CREATE INDEX idx_user_metrics_user_period ON user_metrics(ghl_user_id, period_type, period_start);
CREATE INDEX idx_user_metrics_period ON user_metrics(period_type, period_start DESC);
CREATE INDEX idx_user_metrics_score ON user_metrics(score DESC);

-- Índices em rankings
CREATE INDEX idx_rankings_role_period ON rankings(role, period_type, period_start);
CREATE INDEX idx_rankings_position ON rankings(position);
CREATE INDEX idx_rankings_period ON rankings(period_type, period_start DESC);

-- Índices em user_badges
CREATE INDEX idx_user_badges_user ON user_badges(ghl_user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX idx_user_badges_period ON user_badges(period_type, period_start DESC);

-- Índices em hall_of_fame
CREATE INDEX idx_hall_of_fame_category ON hall_of_fame(category, period_type, period_start DESC);
CREATE INDEX idx_hall_of_fame_user ON hall_of_fame(ghl_user_id);
```

### 1.3 Políticas RLS

```sql
-- user_roles: leitura para autenticados, escrita para service_role
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read user_roles" ON user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role all user_roles" ON user_roles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Replicar para todas as outras tabelas
-- (user_metrics, rankings, badges, user_badges, hall_of_fame, premiacoes, ranking_weights)
```

### 1.4 Realtime

```sql
-- Habilitar Realtime para atualização automática no frontend
ALTER PUBLICATION supabase_realtime ADD TABLE user_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE rankings;
ALTER PUBLICATION supabase_realtime ADD TABLE user_badges;
ALTER PUBLICATION supabase_realtime ADD TABLE hall_of_fame;
```

---

## ⚙️ Fase 2: Edge Functions

### 2.1 Estrutura de Handlers

Todas as Edge Functions seguirão o padrão de handlers modulares:

```typescript
// supabase/functions/[function-name]/handlers/
// - sdr.ts
// - closer.ts
// - ciclo-completo.ts
// - badges.ts
// - hall-of-fame.ts
```

### 2.2 Edge Functions a Criar

#### `calculate-rankings` (Principal)

**Responsabilidade:** Calcular métricas, pontuações e rankings

**Handlers:**
- `metrics-calculator.ts`: Calcula métricas por usuário
- `score-calculator.ts`: Calcula pontuação baseada em pesos
- `ranking-generator.ts`: Gera rankings por categoria
- `badge-assigner.ts`: Atribui badges automaticamente
- `hall-of-fame-updater.ts`: Atualiza Hall of Fame

**Trigger:** 
- Chamada manual via admin
- Webhook do GHL (após processar evento)
- Cron job (diário/semanal/mensal)

**Fluxo:**
1. Buscar dados de `ghl_opportunities`, `ghl_appointments`, `ghl_contacts`
2. Agregar métricas por usuário e período
3. Calcular pontuação usando pesos de `ranking_weights`
4. Gerar rankings e atribuir posições
5. Atribuir badges automaticamente
6. Atualizar Hall of Fame
7. Retornar resultado

**Exemplo de Cálculo de Score (SDR):**
```typescript
score = (agendamentos * peso_agendamentos) +
        (comparecimentos * peso_comparecimentos) +
        (taxa_comparecimento * peso_taxa_comparecimento) +
        (vendas_geradas * peso_vendas_geradas)
```

#### `get-ranking-sdr`

**Responsabilidade:** Retornar ranking de SDRs

**Parâmetros:**
- `period_type`: 'monthly' | 'yearly'
- `period_start`: data de início
- `limit`: número de resultados (default: 10)

**Retorno:**
```typescript
{
  rankings: [
    {
      position: 1,
      user: { id, name, email, avatar },
      metrics: {
        agendamentos: 50,
        comparecimentos: 40,
        taxa_comparecimento: 80,
        vendas_geradas: 15
      },
      score: 1250.5
    }
  ],
  period: { start, end, type }
}
```

#### `get-ranking-closer`

**Responsabilidade:** Retornar ranking de Closers

**Parâmetros:** Similares a `get-ranking-sdr`

**Retorno:**
```typescript
{
  rankings: [
    {
      position: 1,
      user: { id, name, email, avatar },
      metrics: {
        vendas: 20,
        vendas_primeira_reuniao: 12,
        vendas_segunda_reuniao: 8,
        valor_total_vendido: 150000,
        ticket_medio: 7500,
        taxa_conversao: 65
      },
      score: 2100.75
    }
  ],
  period: { start, end, type }
}
```

#### `get-ranking-ciclo-completo`

**Responsabilidade:** Retornar ranking de Ciclo Completo

**Parâmetros:** Similares aos anteriores

**Retorno:**
```typescript
{
  rankings: [
    {
      position: 1,
      user: { id, name, email, avatar },
      metrics: {
        vendas_ciclo_completo: 18,
        taxa_conversao_ponta_a_ponta: 45
      },
      score: 1800.0
    }
  ],
  period: { start, end, type }
}
```

#### `get-hall-of-fame`

**Responsabilidade:** Retornar Hall of Fame

**Parâmetros:**
- `period_type`: 'monthly' | 'yearly'
- `months_back`: número de meses para histórico (default: 6)

**Retorno:**
```typescript
{
  current_month: {
    campeao_geral: { user, score, metrics },
    melhor_sdr: { user, score, metrics },
    melhor_closer: { user, score, metrics },
    melhor_ciclo_completo: { user, score, metrics },
    maior_evolucao: { user, score, metrics },
    melhor_streak: { user, score, metrics }
  },
  history: [
    { period: '2024-11', category: 'campeao_geral', user, score },
    // ...
  ]
}
```

#### `get-user-badges`

**Responsabilidade:** Retornar badges de um usuário

**Parâmetros:**
- `user_id`: ID do usuário

**Retorno:**
```typescript
{
  user: { id, name, email },
  badges: [
    {
      badge: { name, display_name, icon, color },
      awarded_at: '2024-12-01',
      period: { start, end, type }
    }
  ],
  stats: {
    total_badges: 15,
    gold_badges: 5,
    silver_badges: 7,
    bronze_badges: 3
  }
}
```

#### `get-dashboard-stats`

**Responsabilidade:** Retornar estatísticas gerais do dashboard

**Parâmetros:**
- `period_type`: 'today' | 'week' | 'month' | 'custom'
- `start_date`: data de início (para custom)
- `end_date`: data de fim (para custom)
- `compare_previous`: boolean (comparar com período anterior)

**Retorno:**
```typescript
{
  cards: {
    total_agendamentos: { value: 150, change: +12 },
    total_vendas: { value: 45, change: +5 },
    taxa_conversao_geral: { value: 30, change: -2 },
    faturamento_total: { value: 337500, change: +15 },
    ticket_medio: { value: 7500, change: +3 },
    taxa_nao_comparecimento: { value: 20, change: -5 }
  },
  funil: {
    primeiro_contato: { count: 500, conversion: 100 },
    agendado: { count: 150, conversion: 30 },
    compareceu: { count: 120, conversion: 80 },
    venda: { count: 45, conversion: 37.5 }
  },
  evolucao_vendas: {
    labels: ['01/12', '02/12', ...],
    values: [5, 7, 3, ...]
  }
}
```

#### `get-performance-by-sdr`

**Responsabilidade:** Retornar performance de SDRs para gráficos

**Retorno:**
```typescript
{
  sdrs: [
    {
      name: 'João Silva',
      agendamentos: 50,
      comparecimentos: 40
    }
  ]
}
```

#### `get-performance-by-closer`

**Responsabilidade:** Retornar performance de Closers para gráficos

**Retorno:**
```typescript
{
  closers: [
    {
      name: 'Maria Santos',
      vendas: 20,
      valor_vendido: 150000
    }
  ]
}
```

#### `admin-manage-user-role`

**Responsabilidade:** Gerenciar função de usuário (admin)

**Parâmetros:**
- `user_id`: ID do usuário
- `role`: 'sdr' | 'closer' | 'ciclo_completo'
- `active`: boolean

**Ação:** Upsert em `user_roles`

#### `admin-manage-premiacao`

**Responsabilidade:** Gerenciar premiações (admin)

**Parâmetros:**
- `action`: 'create' | 'update' | 'delete'
- `premiacao`: objeto com dados da premiação

**Ação:** CRUD em `premiacoes`

#### `admin-manage-weights`

**Responsabilidade:** Gerenciar pesos de métricas (admin)

**Parâmetros:**
- `role`: 'sdr' | 'closer' | 'ciclo_completo'
- `weights`: objeto com pesos das métricas

**Ação:** Upsert em `ranking_weights`

---

## 🎨 Fase 3: Frontend - Componentes

### 3.1 Componentes Reutilizáveis

#### `RankingTable.tsx`
**Props:**
- `rankings`: array de rankings
- `type`: 'sdr' | 'closer' | 'ciclo_completo'
- `showBadges`: boolean

**Funcionalidade:**
- Exibir tabela com posição, nome, métricas e pontos
- Destacar top 3 com cores diferentes
- Mostrar badges ao lado do nome

#### `UserCard.tsx`
**Props:**
- `user`: objeto do usuário
- `metrics`: métricas do usuário
- `position`: posição no ranking
- `badge`: badge conquistado

**Funcionalidade:**
- Card visual com foto, nome e posição
- Exibir badge conquistado
- Mostrar métricas principais

#### `BadgeIcon.tsx`
**Props:**
- `badge`: objeto do badge
- `size`: 'sm' | 'md' | 'lg'

**Funcionalidade:**
- Renderizar ícone do badge com cor
- Tooltip com descrição

#### `MetricCard.tsx`
**Props:**
- `title`: título da métrica
- `value`: valor
- `change`: variação percentual
- `icon`: ícone

**Funcionalidade:**
- Card com métrica e comparação
- Indicador visual de crescimento/queda

#### `FunnelChart.tsx`
**Props:**
- `data`: dados do funil

**Funcionalidade:**
- Gráfico de funil com etapas
- Percentuais de conversão

#### `EvolutionChart.tsx`
**Props:**
- `data`: dados de evolução
- `period`: período

**Funcionalidade:**
- Gráfico de linha/barras
- Comparação com período anterior

#### `PerformanceBarChart.tsx`
**Props:**
- `data`: dados de performance
- `type`: 'sdr' | 'closer'

**Funcionalidade:**
- Gráfico de barras comparativo

#### `DistributionPieChart.tsx`
**Props:**
- `data`: dados de distribuição

**Funcionalidade:**
- Gráfico de pizza
- Legendas e percentuais

#### `ChampionBanner.tsx`
**Props:**
- `champion`: dados do campeão

**Funcionalidade:**
- Banner destacado no topo
- Foto, nome, categoria e pontuação
- Animação sutil

#### `CelebrationPopup.tsx`
**Props:**
- `user`: usuário que conquistou
- `achievement`: conquista
- `onClose`: callback

**Funcionalidade:**
- Modal com animação especial
- Confetti ou efeito visual
- Mensagem de parabéns

#### `FilterBar.tsx`
**Props:**
- `onFilterChange`: callback

**Funcionalidade:**
- Filtros de período
- Checkbox de comparação
- Select de visualização

### 3.2 Páginas

#### `/ranking` (Atualização da Página Existente)

**Seções:**
1. **Filtros:** Período, comparação, visualização
2. **Tabs:** SDRs, Closers, Ciclo Completo, Geral
3. **Ranking Table:** Tabela com rankings
4. **Top 3 Cards:** Cards destacados para top 3

**Dados:** 
- `get-ranking-sdr`
- `get-ranking-closer`
- `get-ranking-ciclo-completo`

#### `/hall-of-fame` (Nova Página)

**Seções:**
1. **Campeões Atuais:**
   - Campeão Geral do Mês
   - Melhor SDR do Mês
   - Melhor Closer do Mês
   - Melhor Ciclo Completo do Mês
   - Maior Evolução do Mês
   - Melhor Streak do Mês

2. **Histórico (6 meses):**
   - Timeline com campeões anteriores
   - Filtros por categoria

3. **Badges:**
   - Grid com todos os badges disponíveis
   - Indicador de quem conquistou cada badge

**Dados:**
- `get-hall-of-fame`
- `get-user-badges` (para cada usuário)

#### `/dashboard` (Atualização da Página Existente)

**Novas Seções:**
1. **Champion Banner:** Banner do campeão atual no topo
2. **Cards de Métricas:** 6 cards principais
3. **Gráficos:**
   - Funil de Vendas
   - Evolução de Vendas
   - Performance por SDR
   - Performance por Closer
   - Distribuição de Vendas
   - 1ª vs 2ª Reunião

**Dados:**
- `get-dashboard-stats`
- `get-performance-by-sdr`
- `get-performance-by-closer`
- `get-hall-of-fame` (para champion banner)

#### `/admin/usuarios` (Nova Página Admin)

**Funcionalidades:**
1. **Listar Usuários:**
   - Tabela com usuários do GHL
   - Filtros por função e status

2. **Atribuir Função:**
   - Select para escolher função
   - Toggle para ativar/desativar

3. **Editar Perfil:**
   - Modal com formulário
   - Campos: nome, email, foto

**Dados:**
- Query direta em `ghl_users` e `user_roles`
- Edge Function `admin-manage-user-role`

#### `/admin/premiacoes` (Nova Página Admin)

**Funcionalidades:**
1. **Listar Premiações:**
   - Tabela com premiações cadastradas
   - Filtros por categoria e período

2. **Criar Premiação:**
   - Modal com formulário
   - Campos: nome, descrição, prêmio, categoria, período

3. **Editar/Deletar:**
   - Ações inline na tabela

**Dados:**
- Query direta em `premiacoes`
- Edge Function `admin-manage-premiacao`

#### `/admin/pesos` (Nova Página Admin)

**Funcionalidades:**
1. **Configurar Pesos:**
   - Tabs por função (SDR, Closer, Ciclo Completo)
   - Inputs para cada métrica
   - Preview do cálculo de score

2. **Salvar:**
   - Botão para salvar pesos
   - Recalcular rankings automaticamente

**Dados:**
- Query direta em `ranking_weights`
- Edge Function `admin-manage-weights`

---

## 🔄 Fase 4: Integração em Tempo Real

### 4.1 Atualização Automática via Webhooks

**Fluxo:**
1. Webhook chega em `webhook-receiver`
2. Webhook é processado e dados são salvos em tabelas GHL
3. `webhook-receiver` chama `calculate-rankings` de forma assíncrona
4. `calculate-rankings` recalcula métricas e rankings
5. Supabase Realtime notifica frontend sobre mudanças
6. Frontend atualiza automaticamente

### 4.2 Supabase Realtime no Frontend

**Implementação:**
```typescript
// hooks/useRealtimeRankings.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtimeRankings(role: string, period: string) {
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    // Buscar dados iniciais
    fetchRankings();

    // Subscrever a mudanças
    const subscription = supabase
      .channel('rankings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rankings',
          filter: `role=eq.${role}`
        },
        () => {
          fetchRankings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [role, period]);

  async function fetchRankings() {
    // Chamar Edge Function
    const data = await getRankingByRole(role, period);
    setRankings(data.rankings);
  }

  return rankings;
}
```

### 4.3 Notificações de Conquistas

**Implementação:**
```typescript
// hooks/useAchievementNotifications.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useAchievementNotifications() {
  useEffect(() => {
    const subscription = supabase
      .channel('badge-awards')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges'
        },
        (payload) => {
          // Mostrar popup de comemoração
          showCelebrationPopup(payload.new);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);
}
```

---

## 📅 Cronograma de Implementação

### Semana 1: Banco de Dados e Estrutura Base
- [ ] Criar migration com todas as tabelas
- [ ] Criar índices e políticas RLS
- [ ] Habilitar Realtime
- [ ] Popular tabela `badges` com badges padrão
- [ ] Popular tabela `ranking_weights` com pesos padrão

### Semana 2: Edge Functions - Parte 1 (Cálculos)
- [ ] Criar `calculate-rankings` com handlers
  - [ ] `metrics-calculator.ts`
  - [ ] `score-calculator.ts`
  - [ ] `ranking-generator.ts`
  - [ ] `badge-assigner.ts`
  - [ ] `hall-of-fame-updater.ts`
- [ ] Testar cálculos com dados de exemplo
- [ ] Integrar com `webhook-receiver`

### Semana 3: Edge Functions - Parte 2 (APIs)
- [ ] Criar `get-ranking-sdr`
- [ ] Criar `get-ranking-closer`
- [ ] Criar `get-ranking-ciclo-completo`
- [ ] Criar `get-hall-of-fame`
- [ ] Criar `get-user-badges`
- [ ] Criar `get-dashboard-stats`
- [ ] Criar `get-performance-by-sdr`
- [ ] Criar `get-performance-by-closer`

### Semana 4: Edge Functions - Parte 3 (Admin)
- [ ] Criar `admin-manage-user-role`
- [ ] Criar `admin-manage-premiacao`
- [ ] Criar `admin-manage-weights`
- [ ] Testar todas as Edge Functions

### Semana 5: Frontend - Componentes
- [ ] Criar componentes reutilizáveis:
  - [ ] `RankingTable.tsx`
  - [ ] `UserCard.tsx`
  - [ ] `BadgeIcon.tsx`
  - [ ] `MetricCard.tsx`
  - [ ] `FunnelChart.tsx`
  - [ ] `EvolutionChart.tsx`
  - [ ] `PerformanceBarChart.tsx`
  - [ ] `DistributionPieChart.tsx`
  - [ ] `ChampionBanner.tsx`
  - [ ] `CelebrationPopup.tsx`
  - [ ] `FilterBar.tsx`

### Semana 6: Frontend - Páginas (Parte 1)
- [ ] Atualizar `/ranking`
- [ ] Criar `/hall-of-fame`
- [ ] Atualizar `/dashboard` com novos gráficos

### Semana 7: Frontend - Páginas (Parte 2 - Admin)
- [ ] Criar `/admin/usuarios`
- [ ] Criar `/admin/premiacoes`
- [ ] Criar `/admin/pesos`
- [ ] Adicionar links no menu admin

### Semana 8: Integração em Tempo Real
- [ ] Implementar hooks de Realtime
- [ ] Implementar notificações de conquistas
- [ ] Testar atualização automática
- [ ] Ajustar performance

### Semana 9: Testes e Refinamentos
- [ ] Testes de integração
- [ ] Testes de performance
- [ ] Ajustes de UX
- [ ] Correção de bugs

### Semana 10: Deploy e Documentação
- [ ] Deploy de todas as Edge Functions
- [ ] Aplicar migrations em produção
- [ ] Documentação de uso
- [ ] Treinamento da equipe

---

## 🎯 Critérios de Sucesso

### Funcionalidades
- [x] Rankings calculados automaticamente
- [x] Badges atribuídos automaticamente
- [x] Hall of Fame atualizado mensalmente
- [x] Dashboard com todos os gráficos
- [x] Área admin funcional
- [x] Atualização em tempo real

### Performance
- [x] Rankings calculados em < 5 segundos
- [x] Queries otimizadas com índices
- [x] Frontend responsivo (< 3s de carregamento)

### Segurança
- [x] RLS habilitado em todas as tabelas
- [x] JWT habilitado nas Edge Functions
- [x] Apenas anon key no frontend

### UX
- [x] Interface intuitiva
- [x] Animações suaves
- [x] Feedback visual de ações
- [x] Responsivo (mobile-friendly)

---

## 📝 Próximos Passos Imediatos

1. **Revisar e Aprovar este Plano**
2. **Criar Branch:** `feature/ranking-gamification`
3. **Iniciar Fase 1:** Criar migration do banco de dados
4. **Popular Dados Iniciais:** Badges e pesos padrão
5. **Testar Estrutura:** Inserir dados de exemplo

---

## 🚨 Pontos de Atenção

### Dados Históricos
- Como lidar com dados históricos do GHL?
- Precisamos sincronizar dados antigos ou começar do zero?

### Pesos das Métricas
- Quais são os pesos ideais para cada métrica?
- Precisamos de ajustes finos após testes?

### Badges
- Quais badges devem existir além dos mencionados?
- Critérios exatos para cada badge?

### Premiações
- Quais premiações iniciais devem ser cadastradas?
- Como será o fluxo de entrega de prêmios?

### Notificações
- Além do popup, precisamos de notificações por email/WhatsApp?
- Integração com outros sistemas?

---

**Plano criado por:** Manus AI  
**Data:** 26 de Dezembro de 2024  
**Status:** Aguardando Aprovação
