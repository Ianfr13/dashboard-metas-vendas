-- Migration: Create all tables for dashboard-metas-vendas
-- Database: PostgreSQL (Supabase)
-- Date: 2025-01-24

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  open_id VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  login_method VARCHAR(64),
  role VARCHAR(20) DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_signed_in TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Simulation Parameters table
CREATE TABLE IF NOT EXISTS simulation_params (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  scenario VARCHAR(10) NOT NULL CHECK (scenario IN ('3M', '4M', '5M')),
  
  -- Conversion rates (stored as text for precision)
  vsl_conversion_rate TEXT NOT NULL,
  tsl_conversion_rate TEXT NOT NULL,
  checkout_conversion_rate TEXT NOT NULL,
  upsell_conversion_rate TEXT NOT NULL,
  sdr_conversion_rate TEXT NOT NULL,
  
  -- Costs and traffic metrics
  target_cpa TEXT NOT NULL,
  target_cpl TEXT NOT NULL,
  avg_ctr TEXT NOT NULL,
  
  -- Tickets
  front_ticket TEXT NOT NULL,
  upsell_ticket TEXT NOT NULL,
  avg_ticket TEXT NOT NULL,
  
  -- Sales team
  sdr_daily_meetings INTEGER NOT NULL DEFAULT 4,
  sdr_count INTEGER NOT NULL DEFAULT 1,
  closer_count INTEGER NOT NULL DEFAULT 2,
  
  -- Metadata
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Daily Results table
CREATE TABLE IF NOT EXISTS daily_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  scenario VARCHAR(10) NOT NULL CHECK (scenario IN ('3M', '4M', '5M')),
  week INTEGER NOT NULL,
  
  -- Sales achieved
  marketing_direct_sales INTEGER NOT NULL DEFAULT 0,
  commercial_sales INTEGER NOT NULL DEFAULT 0,
  
  -- Revenue achieved
  marketing_direct_revenue TEXT NOT NULL,
  commercial_revenue TEXT NOT NULL,
  
  -- Traffic metrics achieved
  actual_views INTEGER DEFAULT 0,
  actual_leads INTEGER DEFAULT 0,
  actual_investment TEXT,
  actual_cpa TEXT,
  actual_cpl TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  scenario VARCHAR(10) NOT NULL CHECK (scenario IN ('3M', '4M', '5M')),
  period VARCHAR(20) NOT NULL CHECK (period IN ('monthly', 'weekly', 'daily')),
  
  -- Target values
  target_revenue TEXT NOT NULL,
  target_sales INTEGER NOT NULL,
  target_marketing_sales INTEGER NOT NULL,
  target_commercial_sales INTEGER NOT NULL,
  
  -- Sub-goals as JSON
  sub_goals TEXT,
  
  -- Date range
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  
  -- Status
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Sub Goals table
CREATE TABLE IF NOT EXISTS sub_goals (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('product', 'funnel', 'channel', 'team', 'other')),
  
  -- Target values
  target_revenue TEXT NOT NULL,
  target_sales INTEGER NOT NULL,
  
  -- Progress tracking
  current_revenue TEXT,
  current_sales INTEGER,
  
  -- Status
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Calculated Metrics table (Cache)
CREATE TABLE IF NOT EXISTS calculated_metrics (
  id SERIAL PRIMARY KEY,
  simulation_params_id INTEGER NOT NULL REFERENCES simulation_params(id) ON DELETE CASCADE,
  scenario VARCHAR(10) NOT NULL CHECK (scenario IN ('3M', '4M', '5M')),
  period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  week INTEGER,
  day INTEGER,
  
  -- Calculated metrics
  required_views INTEGER NOT NULL,
  required_leads INTEGER NOT NULL,
  required_clicks INTEGER NOT NULL,
  traffic_investment TEXT NOT NULL,
  expected_revenue TEXT NOT NULL,
  roi TEXT NOT NULL,
  roas TEXT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('front', 'upsell', 'high-ticket')),
  channel VARCHAR(20) NOT NULL DEFAULT 'both' CHECK (channel IN ('marketing', 'comercial', 'both')),
  url TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- GTM Events table
CREATE TABLE IF NOT EXISTS gtm_events (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(100) NOT NULL,
  event_data TEXT,
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  page_url TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Funis table
CREATE TABLE IF NOT EXISTS funis (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  url TEXT,
  ticket_medio DECIMAL(10, 2),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Funil Produtos table (relationship)
CREATE TABLE IF NOT EXISTS funil_produtos (
  id SERIAL PRIMARY KEY,
  funil_id INTEGER NOT NULL REFERENCES funis(id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('frontend', 'backend', 'downsell')),
  taxa_take DECIMAL(5, 2),
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Metas Principais table
CREATE TABLE IF NOT EXISTS metas_principais (
  id SERIAL PRIMARY KEY,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  valor_meta DECIMAL(12, 2) NOT NULL,
  valor_atual DECIMAL(12, 2) DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Sub Metas table
CREATE TABLE IF NOT EXISTS sub_metas (
  id SERIAL PRIMARY KEY,
  meta_principal_id INTEGER NOT NULL REFERENCES metas_principais(id) ON DELETE CASCADE,
  valor DECIMAL(12, 2) NOT NULL,
  atingida INTEGER NOT NULL DEFAULT 0,
  data_atingida TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Custos table
CREATE TABLE IF NOT EXISTS custos (
  id SERIAL PRIMARY KEY,
  canal VARCHAR(20) NOT NULL CHECK (canal IN ('marketing', 'comercial')),
  tipo VARCHAR(100) NOT NULL,
  valor_mensal DECIMAL(10, 2) NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Distribuição Canal table
CREATE TABLE IF NOT EXISTS distribuicao_canal (
  id SERIAL PRIMARY KEY,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  percentual_marketing DECIMAL(5, 2) NOT NULL,
  percentual_comercial DECIMAL(5, 2) NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_open_id ON users(open_id);
CREATE INDEX IF NOT EXISTS idx_simulation_params_user_id ON simulation_params(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_results_user_id ON daily_results(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_results_date ON daily_results(date);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_goals_goal_id ON sub_goals(goal_id);
CREATE INDEX IF NOT EXISTS idx_gtm_events_event_name ON gtm_events(event_name);
CREATE INDEX IF NOT EXISTS idx_gtm_events_timestamp ON gtm_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_funil_produtos_funil_id ON funil_produtos(funil_id);
CREATE INDEX IF NOT EXISTS idx_funil_produtos_produto_id ON funil_produtos(produto_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulation_params_updated_at BEFORE UPDATE ON simulation_params
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_results_updated_at BEFORE UPDATE ON daily_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_goals_updated_at BEFORE UPDATE ON sub_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calculated_metrics_updated_at BEFORE UPDATE ON calculated_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funis_updated_at BEFORE UPDATE ON funis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custos_updated_at BEFORE UPDATE ON custos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distribuicao_canal_updated_at BEFORE UPDATE ON distribuicao_canal
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metas_principais_updated_at BEFORE UPDATE ON metas_principais
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_params ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculated_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtm_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE funis ENABLE ROW LEVEL SECURITY;
ALTER TABLE funil_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_principais ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE custos ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribuicao_canal ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - can be customized)
-- Users can read their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = open_id);

CREATE POLICY "Users can view own simulation_params" ON simulation_params
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE open_id = auth.uid()::text));

CREATE POLICY "Users can view own daily_results" ON daily_results
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE open_id = auth.uid()::text));

CREATE POLICY "Users can view own goals" ON goals
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE open_id = auth.uid()::text));

CREATE POLICY "Users can view own sub_goals" ON sub_goals
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE open_id = auth.uid()::text));

-- Public read access for products, funis (can be restricted later)
CREATE POLICY "Public read access for products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Public read access for funis" ON funis
  FOR SELECT USING (true);

CREATE POLICY "Public read access for funil_produtos" ON funil_produtos
  FOR SELECT USING (true);

-- GTM events can be inserted by anyone (webhook)
CREATE POLICY "Allow insert gtm_events" ON gtm_events
  FOR INSERT WITH CHECK (true);

-- Metas principais and sub_metas accessible by authenticated users
CREATE POLICY "Authenticated users can view metas_principais" ON metas_principais
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view sub_metas" ON sub_metas
  FOR SELECT USING (auth.role() = 'authenticated');
