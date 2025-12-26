-- Remove campo 'type' da tabela products se ele existir
-- Esta migration corrige tabelas criadas anteriormente com o campo type

-- Remover coluna type se existir
ALTER TABLE products DROP COLUMN IF EXISTS type;

-- Garantir que a estrutura está correta
-- (Se a coluna já foi removida, estas linhas não farão nada)
