-- Add missing columns for Facebook metrics
ALTER TABLE facebook_insights 
ADD COLUMN IF NOT EXISTS reach integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS frequency numeric(10,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS unique_clicks integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS unique_ctr numeric(10,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cpp numeric(10,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS add_to_cart integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS initiate_checkout integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS landing_page_views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS link_clicks integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS lead_value numeric(14,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_p25_watched integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_p50_watched integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_p75_watched integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_p100_watched integer DEFAULT 0;
