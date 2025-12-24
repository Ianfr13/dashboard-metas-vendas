-- ============================================
-- Row Level Security (RLS) Policies - Auth
-- ============================================
-- Políticas de segurança para usuários autenticados via Google OAuth

-- ============================================
-- 1. GARANTIR QUE RLS ESTÁ HABILITADO
-- ============================================

ALTER TABLE gtm_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_principais ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_params ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. POLÍTICAS PARA gtm_events
-- ============================================

-- Apenas usuários autenticados podem ver eventos
DROP POLICY IF EXISTS "Authenticated users can view gtm_events" ON gtm_events;
CREATE POLICY "Authenticated users can view gtm_events"
ON gtm_events FOR SELECT
USING (auth.role() = 'authenticated');

-- ============================================
-- 3. POLÍTICAS PARA metas_principais
-- ============================================

-- Apenas usuários autenticados podem ver metas
DROP POLICY IF EXISTS "Authenticated users can view metas_principais" ON metas_principais;
CREATE POLICY "Authenticated users can view metas_principais"
ON metas_principais FOR SELECT
USING (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem criar/atualizar metas
DROP POLICY IF EXISTS "Authenticated users can manage metas_principais" ON metas_principais;
CREATE POLICY "Authenticated users can manage metas_principais"
ON metas_principais FOR ALL
USING (auth.role() = 'authenticated');

-- ============================================
-- 4. POLÍTICAS PARA sub_metas
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view sub_metas" ON sub_metas;
CREATE POLICY "Authenticated users can view sub_metas"
ON sub_metas FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage sub_metas" ON sub_metas;
CREATE POLICY "Authenticated users can manage sub_metas"
ON sub_metas FOR ALL
USING (auth.role() = 'authenticated');

-- ============================================
-- 5. POLÍTICAS PARA products
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
CREATE POLICY "Authenticated users can view products"
ON products FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;
CREATE POLICY "Authenticated users can manage products"
ON products FOR ALL
USING (auth.role() = 'authenticated');

-- ============================================
-- 6. POLÍTICAS PARA simulation_params
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view simulations" ON simulation_params;
CREATE POLICY "Authenticated users can view simulations"
ON simulation_params FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage simulations" ON simulation_params;
CREATE POLICY "Authenticated users can manage simulations"
ON simulation_params FOR ALL
USING (auth.role() = 'authenticated');

-- ============================================
-- 7. VERIFICAR POLÍTICAS ATIVAS
-- ============================================

-- Para verificar as políticas criadas:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. Apenas usuários autenticados (via Google OAuth) podem acessar os dados
-- 2. Usuários não autenticados não veem NADA
-- 3. A Edge Function validate-email-domain garante que apenas emails @douravita.com.br podem fazer login
-- 4. Combinação de RLS + Edge Function = Segurança máxima

-- Para aplicar essas políticas:
-- 1. Copie este arquivo
-- 2. Cole no SQL Editor do Supabase
-- 3. Execute
