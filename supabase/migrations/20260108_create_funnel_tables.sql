-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(12,2) DEFAULT 0,
    channel TEXT,
    type TEXT, -- 'frontend', 'backend', etc (optional, but requested in 400 error logs)
    url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create funis table (if not exists, as it was referenced but not complained about as missing)
CREATE TABLE IF NOT EXISTS public.funis (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    url TEXT,
    ticket_medio DECIMAL(12,2),
    active INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create funil_produtos table (linking funnels to products)
CREATE TABLE IF NOT EXISTS public.funil_produtos (
    id SERIAL PRIMARY KEY,
    funil_id INTEGER REFERENCES public.funis(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    tipo TEXT CHECK (tipo IN ('frontend', 'backend', 'downsell')),
    ordem INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funil_produtos ENABLE ROW LEVEL SECURITY;

-- Allow public read access (simplifying for dashboard view)
CREATE POLICY "Public read access products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read access funis" ON public.funis FOR SELECT USING (true);
CREATE POLICY "Public read access funil_produtos" ON public.funil_produtos FOR SELECT USING (true);

-- Allow authenticated usage mainly for integrity
CREATE POLICY "Authenticated full access products" ON public.products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access funis" ON public.funis FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access funil_produtos" ON public.funil_produtos FOR ALL USING (auth.role() = 'authenticated');

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_funis_updated_at BEFORE UPDATE ON public.funis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_funil_produtos_updated_at BEFORE UPDATE ON public.funil_produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
