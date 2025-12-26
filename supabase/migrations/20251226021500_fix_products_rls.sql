-- Reabilitar RLS na tabela products (caso tenha sido desabilitado)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas que podem estar causando conflito
DROP POLICY IF EXISTS "Service role can manage products" ON products;
DROP POLICY IF EXISTS "Users can read products" ON products;
DROP POLICY IF EXISTS "Users can insert products" ON products;
DROP POLICY IF EXISTS "Users can update products" ON products;
DROP POLICY IF EXISTS "Users can delete products" ON products;

-- Criar política para service_role ter acesso total (usado pelas Edge Functions)
CREATE POLICY "Service role has full access to products" 
  ON products 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Criar políticas para usuários autenticados
CREATE POLICY "Authenticated users can read products" 
  ON products 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert products" 
  ON products 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products" 
  ON products 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products" 
  ON products 
  FOR DELETE 
  TO authenticated 
  USING (true);
