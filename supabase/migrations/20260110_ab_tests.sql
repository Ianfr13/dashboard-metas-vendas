-- Migration: Create A/B Testing tables
-- Date: 2026-01-10

-- Function to generate random slug
CREATE OR REPLACE FUNCTION generate_random_slug(length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Testes A/B
CREATE TABLE IF NOT EXISTS ab_tests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,                    -- Nome interno (ex: "Black Friday 2026")
  slug VARCHAR(100) NOT NULL UNIQUE DEFAULT generate_random_slug(8),  -- Slug aleatório auto-gerado
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Variantes do Teste A/B
CREATE TABLE IF NOT EXISTS ab_test_variants (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  weight INTEGER DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
  visits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ab_tests_slug ON ab_tests(slug);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_test_variants_test_id ON ab_test_variants(test_id);

-- Updated_at trigger
CREATE TRIGGER update_ab_tests_updated_at BEFORE UPDATE ON ab_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_variants ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read tests
CREATE POLICY "Authenticated users can view ab_tests" ON ab_tests
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage ab_tests" ON ab_tests
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view ab_test_variants" ON ab_test_variants
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage ab_test_variants" ON ab_test_variants
  FOR ALL USING (auth.role() = 'authenticated');

-- Public read for the worker (needs to read config without auth)
CREATE POLICY "Public read ab_tests for worker" ON ab_tests
  FOR SELECT USING (true);

CREATE POLICY "Public read ab_test_variants for worker" ON ab_test_variants
  FOR SELECT USING (true);

-- RPC function to increment visits atomically
CREATE OR REPLACE FUNCTION increment_ab_variant_visits(variant_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE ab_test_variants 
  SET visits = visits + 1 
  WHERE id = variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
