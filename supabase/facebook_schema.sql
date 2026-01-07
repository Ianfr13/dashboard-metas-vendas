-- =====================================================
-- Facebook Ads Integration Schema
-- Dashboard Metas Vendas
-- Created: 2026-01-07
-- =====================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- FACEBOOK AD ACCOUNTS
-- Stores connected Facebook Ad Accounts
-- =====================================================
CREATE TABLE IF NOT EXISTS facebook_ad_accounts (
  id TEXT PRIMARY KEY,                    -- Facebook Account ID (act_XXXXXXXXX)
  name TEXT NOT NULL,                     -- Account Name
  currency TEXT DEFAULT 'BRL',            -- Account currency
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  account_status INTEGER DEFAULT 1,       -- 1=Active, 2=Disabled, etc
  active BOOLEAN DEFAULT true,            -- Our internal flag
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FACEBOOK CAMPAIGNS
-- Stores campaign structure
-- =====================================================
CREATE TABLE IF NOT EXISTS facebook_campaigns (
  id TEXT PRIMARY KEY,                    -- Campaign ID
  account_id TEXT REFERENCES facebook_ad_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT,                            -- ACTIVE, PAUSED, DELETED, etc
  effective_status TEXT,                  -- Computed status
  objective TEXT,                         -- CONVERSIONS, LEAD_GENERATION, TRAFFIC, etc
  buying_type TEXT,                       -- AUCTION or RESERVED
  daily_budget DECIMAL(12,2),
  lifetime_budget DECIMAL(12,2),
  budget_remaining DECIMAL(12,2),
  start_time TIMESTAMPTZ,
  stop_time TIMESTAMPTZ,
  created_time TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FACEBOOK AD SETS
-- Stores ad set structure (targeting, placements)
-- =====================================================
CREATE TABLE IF NOT EXISTS facebook_adsets (
  id TEXT PRIMARY KEY,                    -- AdSet ID
  campaign_id TEXT REFERENCES facebook_campaigns(id) ON DELETE CASCADE,
  account_id TEXT REFERENCES facebook_ad_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT,
  effective_status TEXT,
  optimization_goal TEXT,                 -- OFFSITE_CONVERSIONS, LEAD_GENERATION, etc
  billing_event TEXT,                     -- IMPRESSIONS, LINK_CLICKS, etc
  bid_amount DECIMAL(12,2),
  daily_budget DECIMAL(12,2),
  lifetime_budget DECIMAL(12,2),
  targeting JSONB,                        -- Full targeting spec
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_time TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FACEBOOK ADS
-- Stores individual ad creatives
-- =====================================================
CREATE TABLE IF NOT EXISTS facebook_ads (
  id TEXT PRIMARY KEY,                    -- Ad ID
  adset_id TEXT REFERENCES facebook_adsets(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES facebook_campaigns(id) ON DELETE CASCADE,
  account_id TEXT REFERENCES facebook_ad_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT,
  effective_status TEXT,
  creative_id TEXT,
  creative_thumbnail_url TEXT,
  preview_shareable_link TEXT,
  created_time TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FACEBOOK INSIGHTS (Daily Metrics)
-- Stores daily performance metrics per campaign
-- =====================================================
CREATE TABLE IF NOT EXISTS facebook_insights (
  id SERIAL PRIMARY KEY,
  account_id TEXT REFERENCES facebook_ad_accounts(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES facebook_campaigns(id) ON DELETE CASCADE,
  adset_id TEXT,
  ad_id TEXT,
  date DATE NOT NULL,
  
  -- Spend & Reach
  spend DECIMAL(12,2) DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  frequency DECIMAL(8,4) DEFAULT 0,
  
  -- Clicks & Engagement
  clicks BIGINT DEFAULT 0,
  unique_clicks BIGINT DEFAULT 0,
  ctr DECIMAL(8,4) DEFAULT 0,                -- Click-Through Rate
  unique_ctr DECIMAL(8,4) DEFAULT 0,
  cpc DECIMAL(8,4) DEFAULT 0,                -- Cost Per Click
  cpm DECIMAL(8,4) DEFAULT 0,                -- Cost Per 1000 Impressions
  cpp DECIMAL(8,4) DEFAULT 0,                -- Cost Per 1000 People Reached
  
  -- Conversions (from actions array)
  leads INTEGER DEFAULT 0,                   -- lead, onsite_conversion.lead_grouped
  purchases INTEGER DEFAULT 0,               -- purchase, offsite_conversion.fb_pixel_purchase
  add_to_cart INTEGER DEFAULT 0,
  initiate_checkout INTEGER DEFAULT 0,
  landing_page_views INTEGER DEFAULT 0,
  link_clicks INTEGER DEFAULT 0,
  
  -- Values
  purchase_value DECIMAL(12,2) DEFAULT 0,
  lead_value DECIMAL(12,2) DEFAULT 0,
  
  -- Calculated Costs
  cost_per_lead DECIMAL(12,2) DEFAULT 0,
  cost_per_purchase DECIMAL(12,2) DEFAULT 0,
  
  -- ROAS
  roas DECIMAL(8,4) DEFAULT 0,               -- Return on Ad Spend
  
  -- Video Metrics (if applicable)
  video_views INTEGER DEFAULT 0,
  video_p25_watched INTEGER DEFAULT 0,
  video_p50_watched INTEGER DEFAULT 0,
  video_p75_watched INTEGER DEFAULT 0,
  video_p100_watched INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint per date/campaign
  UNIQUE(campaign_id, date)
);

-- =====================================================
-- FACEBOOK INSIGHTS HOURLY (for real-time granularity)
-- Optional: for intraday metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS facebook_insights_hourly (
  id SERIAL PRIMARY KEY,
  account_id TEXT REFERENCES facebook_ad_accounts(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES facebook_campaigns(id) ON DELETE CASCADE,
  hour_start TIMESTAMPTZ NOT NULL,
  
  spend DECIMAL(12,2) DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(campaign_id, hour_start)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_fb_campaigns_account ON facebook_campaigns(account_id);
CREATE INDEX IF NOT EXISTS idx_fb_campaigns_status ON facebook_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_fb_adsets_campaign ON facebook_adsets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_fb_ads_adset ON facebook_ads(adset_id);
CREATE INDEX IF NOT EXISTS idx_fb_ads_campaign ON facebook_ads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_fb_insights_date ON facebook_insights(date);
CREATE INDEX IF NOT EXISTS idx_fb_insights_campaign ON facebook_insights(campaign_id);
CREATE INDEX IF NOT EXISTS idx_fb_insights_account ON facebook_insights(account_id);
CREATE INDEX IF NOT EXISTS idx_fb_insights_date_range ON facebook_insights(date, campaign_id);
CREATE INDEX IF NOT EXISTS idx_fb_insights_hourly_time ON facebook_insights_hourly(hour_start);

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_facebook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fb_accounts_updated_at 
  BEFORE UPDATE ON facebook_ad_accounts
  FOR EACH ROW EXECUTE FUNCTION update_facebook_updated_at();

CREATE TRIGGER update_fb_campaigns_updated_at 
  BEFORE UPDATE ON facebook_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_facebook_updated_at();

CREATE TRIGGER update_fb_adsets_updated_at 
  BEFORE UPDATE ON facebook_adsets
  FOR EACH ROW EXECUTE FUNCTION update_facebook_updated_at();

CREATE TRIGGER update_fb_ads_updated_at 
  BEFORE UPDATE ON facebook_ads
  FOR EACH ROW EXECUTE FUNCTION update_facebook_updated_at();

CREATE TRIGGER update_fb_insights_updated_at 
  BEFORE UPDATE ON facebook_insights
  FOR EACH ROW EXECUTE FUNCTION update_facebook_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE facebook_ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_adsets ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_insights_hourly ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read Facebook data
CREATE POLICY "Authenticated users can view facebook_ad_accounts"
  ON facebook_ad_accounts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view facebook_campaigns"
  ON facebook_campaigns FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view facebook_adsets"
  ON facebook_adsets FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view facebook_ads"
  ON facebook_ads FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view facebook_insights"
  ON facebook_insights FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view facebook_insights_hourly"
  ON facebook_insights_hourly FOR SELECT
  USING (auth.role() = 'authenticated');

-- Service role has full access (for Edge Functions)
CREATE POLICY "Service role full access fb_accounts"
  ON facebook_ad_accounts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access fb_campaigns"
  ON facebook_campaigns FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access fb_adsets"
  ON facebook_adsets FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access fb_ads"
  ON facebook_ads FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access fb_insights"
  ON facebook_insights FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access fb_insights_hourly"
  ON facebook_insights_hourly FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE facebook_ad_accounts IS 'Facebook Ad Accounts connected to the dashboard';
COMMENT ON TABLE facebook_campaigns IS 'Facebook Campaigns synced from Ads API';
COMMENT ON TABLE facebook_adsets IS 'Facebook Ad Sets with targeting configuration';
COMMENT ON TABLE facebook_ads IS 'Individual Facebook Ads/Creatives';
COMMENT ON TABLE facebook_insights IS 'Daily performance metrics from Facebook Insights API';
COMMENT ON TABLE facebook_insights_hourly IS 'Hourly metrics for real-time tracking';
