-- Create table for storing page speed metrics
CREATE TABLE IF NOT EXISTS site_speed_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url_path text NOT NULL,
  latency_ms integer NOT NULL,
  user_agent text,
  country text,
  device_type text,
  created_at timestamptz DEFAULT now()
);

-- Index for fast aggregation by URL
CREATE INDEX IF NOT EXISTS idx_site_speed_url ON site_speed_metrics(url_path);

-- Index for time-range filtering (e.g. "last 24h")
CREATE INDEX IF NOT EXISTS idx_site_speed_created_at ON site_speed_metrics(created_at);

-- Add RLS (Optional, but good practice)
ALTER TABLE site_speed_metrics ENABLE ROW LEVEL SECURITY;

-- Allow reading by authenticated users (Dashboard)
CREATE POLICY "Allow read access for authenticated users" ON site_speed_metrics
  FOR SELECT TO authenticated USING (true);

-- Allow insertion via Service Role (Worker)
-- (Service role bypasses RLS, so no policy needed explicitly for it, but good to be aware)
