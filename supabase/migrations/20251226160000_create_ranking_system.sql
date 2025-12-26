-- Migration: Sistema de Ranking e Gamificação
-- Autor: Manus AI
-- Data: 2024-12-26
-- Descrição: Cria tabelas para sistema de ranking de SDRs, Closers e Ciclo Completo

-- ============================================================================
-- Tabela: user_roles
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES ghl_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('sdr', 'closer', 'ciclo_completo')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

COMMENT ON TABLE user_roles IS 'Funções dos usuários do GoHighLevel (SDR, Closer, Ciclo Completo)';

-- ============================================================================
-- Tabela: user_metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES ghl_users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  
  -- Métricas SDR
  agendamentos INTEGER DEFAULT 0,
  comparecimentos INTEGER DEFAULT 0,
  nao_comparecimentos INTEGER DEFAULT 0,
  taxa_comparecimento NUMERIC(5, 2) DEFAULT 0,
  vendas_geradas INTEGER DEFAULT 0,
  
  -- Métricas Closer
  vendas INTEGER DEFAULT 0,
  vendas_primeira_reuniao INTEGER DEFAULT 0,
  vendas_segunda_reuniao INTEGER DEFAULT 0,
  vendas_perdidas INTEGER DEFAULT 0,
  valor_total_vendido NUMERIC(12, 2) DEFAULT 0,
  ticket_medio NUMERIC(12, 2) DEFAULT 0,
  taxa_conversao NUMERIC(5, 2) DEFAULT 0,
  
  -- Métricas Ciclo Completo
  vendas_ciclo_completo INTEGER DEFAULT 0,
  taxa_conversao_ponta_a_ponta NUMERIC(5, 2) DEFAULT 0,
  
  -- Score e Posição
  score NUMERIC(10, 2) DEFAULT 0,
  position INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_user_metrics_user_month ON user_metrics(user_id, month DESC);
CREATE INDEX IF NOT EXISTS idx_user_metrics_month ON user_metrics(month DESC);
CREATE INDEX IF NOT EXISTS idx_user_metrics_score ON user_metrics(score DESC);

COMMENT ON TABLE user_metrics IS 'Métricas calculadas por usuário e mês para sistema de ranking';

-- ============================================================================
-- Tabela: badges
-- ============================================================================
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES ghl_users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN (
    'ouro', 'prata', 'bronze', 
    'campeao_mes', 'campeao_ano',
    'streak_3_meses', 'maior_evolucao'
  )),
  month DATE NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB,
  UNIQUE(user_id, badge_type, month)
);

CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_month ON badges(month DESC);
CREATE INDEX IF NOT EXISTS idx_badges_type ON badges(badge_type);

COMMENT ON TABLE badges IS 'Badges conquistados pelos usuários no sistema de gamificação';

-- ============================================================================
-- Trigger para atualizar updated_at
-- ============================================================================
CREATE TRIGGER update_user_roles_updated_at 
  BEFORE UPDATE ON user_roles
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_metrics_updated_at 
  BEFORE UPDATE ON user_metrics
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura para usuários autenticados
CREATE POLICY "Permitir leitura de funções" ON user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura de métricas" ON user_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura de badges" ON badges FOR SELECT TO authenticated USING (true);

-- Políticas completas para service_role
CREATE POLICY "Permitir tudo para service_role em user_roles" ON user_roles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para service_role em user_metrics" ON user_metrics FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para service_role em badges" ON badges FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- Realtime
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE user_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE badges;
