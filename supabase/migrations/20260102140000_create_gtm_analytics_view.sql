-- Migration: Create GTM Analytics View (Enhanced)
-- Purpose: Simplify analysis of GTM events by extracting UTM parameters and standardizing traffic sources (Youtube, FB, Taboola, etc).

CREATE OR REPLACE VIEW gtm_analytics_view AS
WITH parsed_events AS (
  SELECT
    id,
    created_at,
    timestamp,
    event_name,
    user_id,
    session_id,
    page_url,
    referrer,
    -- Converte event_data de TEXT para JSONB de forma segura
    CASE 
      WHEN event_data IS NULL OR event_data = '' THEN '{}'::jsonb
      ELSE event_data::jsonb 
    END AS event_data_json
  FROM
    gtm_events
)
SELECT
  id,
  created_at,
  timestamp,
  event_name,
  user_id,
  session_id,
  page_url,
  referrer,
  event_data_json,
  
  -- Extract Value (Revenue)
  COALESCE(
    (event_data_json->>'value')::numeric, 
    (event_data_json->>'transaction_value')::numeric, 
    0
  ) as value,
  
  -- Extract UTM Parameters from page_url
  substring(page_url from 'utm_source=([^&]+)') as utm_source,
  substring(page_url from 'utm_medium=([^&]+)') as utm_medium,
  substring(page_url from 'utm_campaign=([^&]+)') as utm_campaign,
  substring(page_url from 'utm_term=([^&]+)') as utm_term,
  substring(page_url from 'utm_content=([^&]+)') as utm_content,

  -- Computed Traffic Source (Channel Grouping)
  CASE
    -- 1. Trust UTM Source first
    WHEN page_url ILIKE '%utm_source=%' THEN substring(page_url from 'utm_source=([^&]+)')
    
    -- 2. Known Social/Ad Platforms via Referrer
    WHEN referrer ILIKE '%youtube%' OR referrer ILIKE '%youtu.be%' THEN 'youtube'
    WHEN referrer ILIKE '%facebook%' OR referrer ILIKE '%fb.com%' THEN 'facebook'
    WHEN referrer ILIKE '%instagram%' THEN 'instagram'
    WHEN referrer ILIKE '%linkedin%' THEN 'linkedin'
    WHEN referrer ILIKE '%t.co%' OR referrer ILIKE '%twitter%' OR referrer ILIKE '%x.com%' THEN 'twitter'
    WHEN referrer ILIKE '%tiktok%' THEN 'tiktok'
    WHEN referrer ILIKE '%taboola%' THEN 'taboola'
    WHEN referrer ILIKE '%outbrain%' THEN 'outbrain'
    WHEN referrer ILIKE '%pinterest%' THEN 'pinterest'
    WHEN referrer ILIKE '%google%' THEN 'google'
    WHEN referrer ILIKE '%bing%' THEN 'bing'
    WHEN referrer ILIKE '%yahoo%' THEN 'yahoo'
    
    -- 3. Direct/None
    WHEN referrer IS NULL OR referrer = '' OR referrer ILIKE '%/localhost%' OR referrer ILIKE '%/auvvrewlbpyymekonilv%' THEN 'direct'
    
    -- 4. Fallback
    ELSE 'referral'
  END as traffic_source,

  -- Computed Traffic Medium
  CASE
    WHEN page_url ILIKE '%utm_medium=%' THEN substring(page_url from 'utm_medium=([^&]+)')
    -- Organic Search
    WHEN referrer ILIKE '%google%' AND page_url NOT ILIKE '%utm_source=%' THEN 'organic'
    WHEN referrer ILIKE '%bing%' AND page_url NOT ILIKE '%utm_source=%' THEN 'organic'
    WHEN referrer ILIKE '%yahoo%' AND page_url NOT ILIKE '%utm_source=%' THEN 'organic'
    -- Direct
    WHEN referrer IS NULL OR referrer = '' THEN '(none)'
    ELSE 'referral'
  END as traffic_medium

FROM
  parsed_events;
