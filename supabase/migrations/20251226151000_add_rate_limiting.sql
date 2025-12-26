-- Migration: Adicionar controle de rate limiting para webhooks
-- Autor: Manus AI
-- Data: 2025-12-26
-- Descrição: Cria tabela para controlar rate limiting e prevenir abuso do endpoint de webhooks

-- ============================================================================
-- Tabela: ghl_webhook_rate_limit
-- ============================================================================
-- Controla o número de requisições por IP/origem em janelas de tempo
CREATE TABLE IF NOT EXISTS public.ghl_webhook_rate_limit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP ou outro identificador único
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  last_request TIMESTAMPTZ DEFAULT now(),
  blocked_until TIMESTAMPTZ, -- Se bloqueado, até quando
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca rápida por identificador
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON public.ghl_webhook_rate_limit(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON public.ghl_webhook_rate_limit(window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limit_blocked ON public.ghl_webhook_rate_limit(blocked_until);

-- Habilitar Row Level Security
ALTER TABLE public.ghl_webhook_rate_limit ENABLE ROW LEVEL SECURITY;

-- Política RLS: Apenas service_role pode acessar
CREATE POLICY "Apenas service_role pode acessar rate limit"
  ON public.ghl_webhook_rate_limit
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Função: Limpar registros antigos de rate limiting
-- ============================================================================
-- Remove registros mais antigos que 24 horas para manter a tabela limpa
CREATE OR REPLACE FUNCTION clean_old_rate_limit_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.ghl_webhook_rate_limit
  WHERE window_start < now() - INTERVAL '24 hours'
    AND (blocked_until IS NULL OR blocked_until < now());
END;
$$;

-- ============================================================================
-- Comentários
-- ============================================================================
COMMENT ON TABLE public.ghl_webhook_rate_limit IS 'Controla rate limiting de webhooks para prevenir abuso e custos excessivos';
COMMENT ON FUNCTION clean_old_rate_limit_records IS 'Remove registros de rate limiting mais antigos que 24 horas';
