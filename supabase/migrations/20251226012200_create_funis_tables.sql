-- Tabela de funis
CREATE TABLE IF NOT EXISTS funis (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  url TEXT,
  ticket_medio NUMERIC(10, 2),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de produtos do funil (relacionamento entre funis e products)
CREATE TABLE IF NOT EXISTS produtos_funil (
  id SERIAL PRIMARY KEY,
  funil_id INTEGER NOT NULL REFERENCES funis(id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('frontend', 'backend', 'downsell')),
  ordem INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(funil_id, produto_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_funis_active ON funis(active);
CREATE INDEX IF NOT EXISTS idx_funis_created_at ON funis(created_at);
CREATE INDEX IF NOT EXISTS idx_produtos_funil_funil_id ON produtos_funil(funil_id);
CREATE INDEX IF NOT EXISTS idx_produtos_funil_produto_id ON produtos_funil(produto_id);
CREATE INDEX IF NOT EXISTS idx_produtos_funil_ordem ON produtos_funil(funil_id, ordem);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_funis_updated_at BEFORE UPDATE ON funis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE funis ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos_funil ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura (todos usuários autenticados)
CREATE POLICY "Users can read funis" ON funis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read produtos_funil" ON produtos_funil FOR SELECT TO authenticated USING (true);

-- Políticas de escrita (apenas usuários autenticados)
CREATE POLICY "Users can insert funis" ON funis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update funis" ON funis FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete funis" ON funis FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can insert produtos_funil" ON produtos_funil FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update produtos_funil" ON produtos_funil FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete produtos_funil" ON produtos_funil FOR DELETE TO authenticated USING (true);

-- Service role pode fazer tudo
CREATE POLICY "Service role can manage funis" ON funis FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage produtos_funil" ON produtos_funil FOR ALL TO service_role USING (true);
