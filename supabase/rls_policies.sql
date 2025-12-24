-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
-- Este arquivo configura políticas de segurança RÍGIDAS
-- para garantir que usuários só acessem seus próprios dados

-- ============================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================

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

-- ============================================
-- 2. POLÍTICAS PARA TABELA: users
-- ============================================

-- Usuários podem ler apenas seus próprios dados
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid()::text = "openId");

-- Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (auth.uid()::text = "openId");

-- ============================================
-- 3. POLÍTICAS PARA TABELA: simulation_params
-- ============================================

-- Usuários podem ver apenas suas próprias simulações
CREATE POLICY "Users can view own simulations"
ON simulation_params FOR SELECT
USING (
  "userId" = (
    SELECT id FROM users WHERE "openId" = auth.uid()::text
  )
);

-- Usuários podem criar simulações
CREATE POLICY "Users can create simulations"
ON simulation_params FOR INSERT
WITH CHECK (
  "userId" = (
    SELECT id FROM users WHERE "openId" = auth.uid()::text
  )
);

-- Usuários podem atualizar suas próprias simulações
CREATE POLICY "Users can update own simulations"
ON simulation_params FOR UPDATE
USING (
  "userId" = (
    SELECT id FROM users WHERE "openId" = auth.uid()::text
  )
);

-- Usuários podem deletar suas próprias simulações
CREATE POLICY "Users can delete own simulations"
ON simulation_params FOR DELETE
USING (
  "userId" = (
    SELECT id FROM users WHERE "openId" = auth.uid()::text
  )
);

-- ============================================
-- 4. POLÍTICAS PARA TABELA: daily_results
-- ============================================

CREATE POLICY "Users can view own daily results"
ON daily_results FOR SELECT
USING (
  "userId" = (
    SELECT id FROM users WHERE "openId" = auth.uid()::text
  )
);

CREATE POLICY "Users can create daily results"
ON daily_results FOR INSERT
WITH CHECK (
  "userId" = (
    SELECT id FROM users WHERE "openId" = auth.uid()::text
  )
);

CREATE POLICY "Users can update own daily results"
ON daily_results FOR UPDATE
USING (
  "userId" = (
    SELECT id FROM users WHERE "openId" = auth.uid()::text
  )
);

-- ============================================
-- 5. POLÍTICAS PARA TABELA: goals
-- ============================================

CREATE POLICY "Users can view own goals"
ON goals FOR SELECT
USING (
  "userId" = (
    SELECT id FROM users WHERE "openId" = auth.uid()::text
  )
);

CREATE POLICY "Users can create goals"
ON goals FOR INSERT
WITH CHECK (
  "userId" = (
    SELECT id FROM users WHERE "openId" = auth.uid()::text
  )
);

CREATE POLICY "Users can update own goals"
ON goals FOR UPDATE
USING (
  "userId" = (
    SELECT id FROM users WHERE "openId" = auth.uid()::text
  )
);

CREATE POLICY "Users can delete own goals"
ON goals FOR DELETE
USING (
  "userId" = (
    SELECT id FROM users WHERE "openId" = auth.uid()::text
  )
);

-- ============================================
-- 6. POLÍTICAS PARA TABELA: sub_goals
-- ============================================

CREATE POLICY "Users can view own sub_goals"
ON sub_goals FOR SELECT
USING (
  "userId" = (
    SELECT id FROM users WHERE "openId" = auth.uid()::text
  )
);

CREATE POLICY "Users can create sub_goals"
ON sub_goals FOR INSERT
WITH CHECK (
  "userId" = (
    SELECT id FROM users WHERE "openId" = auth.uid()::text
  )
);

CREATE POLICY "Users can update own sub_goals"
ON sub_goals FOR UPDATE
USING (
  "userId" = (
    SELECT id FROM users WHERE "openId" = auth.uid()::text
  )
);

CREATE POLICY "Users can delete own sub_goals"
ON sub_goals FOR DELETE
USING (
  "userId" = (
    SELECT id FROM users WHERE "openId" = auth.uid()::text
  )
);

-- ============================================
-- 7. POLÍTICAS PARA TABELA: products
-- ============================================

-- Produtos são compartilhados entre todos os usuários (READ-ONLY para usuários comuns)
CREATE POLICY "Everyone can view products"
ON products FOR SELECT
USING (true);

-- Apenas admins podem criar/atualizar/deletar produtos
CREATE POLICY "Only admins can manage products"
ON products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE "openId" = auth.uid()::text 
    AND role = 'admin'
  )
);

-- ============================================
-- 8. POLÍTICAS PARA TABELA: gtm_events
-- ============================================

-- GTM events são READ-ONLY para usuários
-- (Apenas Edge Function pode inserir usando service_role key)
CREATE POLICY "Users can view all gtm_events"
ON gtm_events FOR SELECT
USING (true);

-- ============================================
-- 9. POLÍTICAS PARA TABELA: metas_principais
-- ============================================

-- Todos podem ver metas (são compartilhadas)
CREATE POLICY "Everyone can view metas_principais"
ON metas_principais FOR SELECT
USING (true);

-- Apenas admins podem gerenciar metas
CREATE POLICY "Only admins can manage metas_principais"
ON metas_principais FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE "openId" = auth.uid()::text 
    AND role = 'admin'
  )
);

-- ============================================
-- 10. POLÍTICAS PARA TABELA: sub_metas
-- ============================================

-- Todos podem ver sub-metas
CREATE POLICY "Everyone can view sub_metas"
ON sub_metas FOR SELECT
USING (true);

-- Apenas admins podem gerenciar sub-metas
CREATE POLICY "Only admins can manage sub_metas"
ON sub_metas FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE "openId" = auth.uid()::text 
    AND role = 'admin'
  )
);

-- ============================================
-- 11. POLÍTICAS PARA TABELA: funis
-- ============================================

CREATE POLICY "Everyone can view funis"
ON funis FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage funis"
ON funis FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE "openId" = auth.uid()::text 
    AND role = 'admin'
  )
);

-- ============================================
-- 12. POLÍTICAS PARA TABELA: funil_produtos
-- ============================================

CREATE POLICY "Everyone can view funil_produtos"
ON funil_produtos FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage funil_produtos"
ON funil_produtos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE "openId" = auth.uid()::text 
    AND role = 'admin'
  )
);

-- ============================================
-- FIM DAS POLÍTICAS
-- ============================================

-- Para aplicar essas políticas no Supabase:
-- 1. Vá em SQL Editor no Dashboard do Supabase
-- 2. Cole este arquivo completo
-- 3. Execute (Run)
-- 4. Verifique se não há erros

-- Para testar as políticas:
-- SELECT * FROM simulation_params; -- Deve retornar apenas dados do usuário logado
-- SELECT * FROM products; -- Deve retornar todos os produtos
-- SELECT * FROM metas_principais; -- Deve retornar todas as metas
