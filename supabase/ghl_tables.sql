-- Tabelas para integração com GoHighLevel CRM

-- Tabela de vendedores (usuários do GHL)
CREATE TABLE IF NOT EXISTS ghl_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  active BOOLEAN DEFAULT true,
  ghl_data JSONB, -- Dados brutos do GHL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de leads/contatos do GHL
CREATE TABLE IF NOT EXISTS ghl_contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  assigned_user_id TEXT REFERENCES ghl_users(id),
  tags TEXT[],
  source TEXT,
  ghl_data JSONB, -- Dados brutos do GHL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS ghl_appointments (
  id TEXT PRIMARY KEY,
  contact_id TEXT REFERENCES ghl_contacts(id),
  assigned_user_id TEXT REFERENCES ghl_users(id),
  title TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT, -- scheduled, confirmed, completed, cancelled, no_show
  appointment_type TEXT,
  notes TEXT,
  ghl_data JSONB, -- Dados brutos do GHL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de reuniões realizadas (appointments completed)
CREATE TABLE IF NOT EXISTS ghl_meetings (
  id TEXT PRIMARY KEY,
  appointment_id TEXT REFERENCES ghl_appointments(id),
  contact_id TEXT REFERENCES ghl_contacts(id),
  assigned_user_id TEXT REFERENCES ghl_users(id),
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  outcome TEXT, -- success, no_show, rescheduled, cancelled
  notes TEXT,
  ghl_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sincronização entre CRM e GTM
CREATE TABLE IF NOT EXISTS crm_gtm_sync (
  id SERIAL PRIMARY KEY,
  contact_id TEXT REFERENCES ghl_contacts(id),
  contact_name TEXT NOT NULL,
  gtm_event_id INTEGER, -- Referência ao gtm_events se necessário
  transaction_id TEXT,
  purchase_value NUMERIC(10, 2),
  purchase_date TIMESTAMP WITH TIME ZONE,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  match_confidence NUMERIC(3, 2), -- 0.00 a 1.00
  match_method TEXT, -- exact_name, fuzzy_name, email, phone
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ghl_contacts_name ON ghl_contacts(name);
CREATE INDEX IF NOT EXISTS idx_ghl_contacts_email ON ghl_contacts(email);
CREATE INDEX IF NOT EXISTS idx_ghl_contacts_assigned_user ON ghl_contacts(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_ghl_appointments_contact ON ghl_appointments(contact_id);
CREATE INDEX IF NOT EXISTS idx_ghl_appointments_user ON ghl_appointments(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_ghl_appointments_start_time ON ghl_appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_ghl_meetings_contact ON ghl_meetings(contact_id);
CREATE INDEX IF NOT EXISTS idx_ghl_meetings_user ON ghl_meetings(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_ghl_meetings_date ON ghl_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_crm_gtm_sync_contact ON crm_gtm_sync(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_gtm_sync_name ON crm_gtm_sync(contact_name);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ghl_users_updated_at BEFORE UPDATE ON ghl_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ghl_contacts_updated_at BEFORE UPDATE ON ghl_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ghl_appointments_updated_at BEFORE UPDATE ON ghl_appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ghl_meetings_updated_at BEFORE UPDATE ON ghl_meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (todos podem ler, apenas admins podem modificar)
ALTER TABLE ghl_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghl_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghl_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghl_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_gtm_sync ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura (todos usuários autenticados)
CREATE POLICY "Users can read ghl_users" ON ghl_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read ghl_contacts" ON ghl_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read ghl_appointments" ON ghl_appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read ghl_meetings" ON ghl_meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read crm_gtm_sync" ON crm_gtm_sync FOR SELECT TO authenticated USING (true);

-- Políticas de escrita (apenas service_role via Edge Functions)
CREATE POLICY "Service role can manage ghl_users" ON ghl_users FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage ghl_contacts" ON ghl_contacts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage ghl_appointments" ON ghl_appointments FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage ghl_meetings" ON ghl_meetings FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage crm_gtm_sync" ON crm_gtm_sync FOR ALL TO service_role USING (true);
