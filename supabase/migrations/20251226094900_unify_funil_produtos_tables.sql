-- Migration: Unificar tabelas funil_produtos e produtos_funil
-- Data: 2025-12-26
-- Objetivo: Resolver duplicação de tabelas que causava inconsistência de dados
-- 
-- Problema identificado:
-- - Tabela funil_produtos (antiga): usada para ESCRITA pela página admin
-- - Tabela produtos_funil (nova): usada para LEITURA pelas Edge Functions
-- - Resultado: dados salvos nunca eram lidos
--
-- Solução:
-- 1. Migrar dados de funil_produtos para produtos_funil
-- 2. Remover tabela funil_produtos
-- 3. Atualizar código para usar apenas produtos_funil

-- Passo 1: Migrar dados existentes de funil_produtos para produtos_funil
-- Nota: O campo taxa_take existe em funil_produtos mas não em produtos_funil
-- Como não é usado atualmente, será descartado na migração
INSERT INTO public.produtos_funil (funil_id, produto_id, tipo, ordem, created_at)
SELECT 
  funil_id, 
  produto_id, 
  tipo, 
  ordem, 
  created_at
FROM public.funil_produtos
ON CONFLICT (funil_id, produto_id) DO NOTHING; -- Previne duplicatas

-- Passo 2: Remover a tabela duplicada funil_produtos
-- Nota: CASCADE remove automaticamente todas as políticas RLS, índices e constraints associados
DROP TABLE IF EXISTS public.funil_produtos CASCADE;

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully: funil_produtos unified into produtos_funil';
END $$;
