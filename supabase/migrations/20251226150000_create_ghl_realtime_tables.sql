-- Migration: Criar tabelas para integração em tempo real com GoHighLevel
-- Autor: Manus AI
-- Data: 2025-12-26
-- Descrição: Cria as tabelas ghl_opportunities e ghl_webhook_logs para suportar
--            a captura de eventos em tempo real via webhooks do GoHighLevel

-- ============================================================================
-- Tabela: ghl_opportunities
-- ============================================================================
-- Armazena todas as oportunidades (deals) do pipeline de vendas do CRM
CREATE TABLE IF NOT EXISTS public.ghl_opportunities (
  id TEXT PRIMARY KEY, -- ID da oportunidade no GoHighLevel
  location_id TEXT NOT NULL, -- ID da location/sub-account no GHL
  pipeline_id TEXT NOT NULL, -- ID do pipeline
  stage_id TEXT NOT NULL, -- ID do estágio atual no pipeline
  contact_id TEXT REFERENCES public.ghl_contacts(id) ON DELETE SET NULL, -- Referência ao contato
  assigned_user_id TEXT REFERENCES public.ghl_users(id) ON DELETE SET NULL, -- Usuário responsável
  name TEXT NOT NULL, -- Nome da oportunidade
  status TEXT NOT NULL CHECK (status IN ('open', 'won', 'lost', 'abandoned')), -- Status da oportunidade
  monetary_value NUMERIC(12, 2) DEFAULT 0, -- Valor monetário
  source TEXT, -- Origem da oportunidade
  ghl_data JSONB, -- Payload completo do GoHighLevel para referência
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_ghl_opportunities_location ON public.ghl_opportunities(location_id);
CREATE INDEX IF NOT EXISTS idx_ghl_opportunities_pipeline ON public.ghl_opportunities(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_ghl_opportunities_stage ON public.ghl_opportunities(stage_id);
CREATE INDEX IF NOT EXISTS idx_ghl_opportunities_contact ON public.ghl_opportunities(contact_id);
CREATE INDEX IF NOT EXISTS idx_ghl_opportunities_user ON public.ghl_opportunities(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_ghl_opportunities_status ON public.ghl_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_ghl_opportunities_created ON public.ghl_opportunities(created_at DESC);

-- Habilitar Row Level Security
ALTER TABLE public.ghl_opportunities ENABLE ROW LEVEL SECURITY;

-- Política RLS: Permitir leitura para usuários autenticados
CREATE POLICY "Permitir leitura de oportunidades para usuários autenticados"
  ON public.ghl_opportunities
  FOR SELECT
  TO authenticated
  USING (true);

-- Política RLS: Permitir todas as operações para service_role (Edge Functions)
CREATE POLICY "Permitir todas as operações para service_role"
  ON public.ghl_opportunities
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Habilitar Realtime para notificações em tempo real no frontend
ALTER PUBLICATION supabase_realtime ADD TABLE public.ghl_opportunities;

-- ============================================================================
-- Tabela: ghl_webhook_logs
-- ============================================================================
-- Armazena logs de todos os webhooks recebidos do GoHighLevel
-- Garante idempotência, auditoria e facilita debugging
CREATE TABLE IF NOT EXISTS public.ghl_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id TEXT NOT NULL, -- ID único do webhook (para idempotência)
  event_type TEXT NOT NULL, -- Tipo do evento (ex: OpportunityCreate, ContactUpdate)
  status TEXT NOT NULL DEFAULT 'recebido' CHECK (status IN ('recebido', 'processado', 'erro')),
  payload JSONB, -- Payload completo do webhook
  error_log TEXT, -- Mensagem de erro (se houver)
  processed_at TIMESTAMPTZ, -- Timestamp do processamento
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice único para garantir idempotência (não processar o mesmo webhook duas vezes)
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_id_unique ON public.ghl_webhook_logs(webhook_id);

-- Índices para queries de monitoramento
CREATE INDEX IF NOT EXISTS idx_ghl_webhook_logs_event_type ON public.ghl_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_ghl_webhook_logs_status ON public.ghl_webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_ghl_webhook_logs_created ON public.ghl_webhook_logs(created_at DESC);

-- Habilitar Row Level Security
ALTER TABLE public.ghl_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Política RLS: Permitir leitura para usuários autenticados
CREATE POLICY "Permitir leitura de logs para usuários autenticados"
  ON public.ghl_webhook_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Política RLS: Permitir todas as operações para service_role (Edge Functions)
CREATE POLICY "Permitir todas as operações para service_role nos logs"
  ON public.ghl_webhook_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Habilitar Realtime para monitoramento em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.ghl_webhook_logs;

-- ============================================================================
-- Comentários nas tabelas para documentação
-- ============================================================================
COMMENT ON TABLE public.ghl_opportunities IS 'Armazena oportunidades do pipeline de vendas do GoHighLevel, sincronizadas em tempo real via webhooks';
COMMENT ON TABLE public.ghl_webhook_logs IS 'Logs de webhooks recebidos do GoHighLevel para garantir idempotência e auditoria';
