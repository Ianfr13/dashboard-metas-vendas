-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('marketing', 'comercial', 'ambos')),
  url TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_channel ON products(channel);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura (todos usuários autenticados)
CREATE POLICY "Users can read products" ON products FOR SELECT TO authenticated USING (true);

-- Políticas de escrita (apenas usuários autenticados)
CREATE POLICY "Users can insert products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update products" ON products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete products" ON products FOR DELETE TO authenticated USING (true);

-- Service role pode fazer tudo
CREATE POLICY "Service role can manage products" ON products FOR ALL TO service_role USING (true);
