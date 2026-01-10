-- Migration: Add script injection columns to pages
-- Date: 2026-01-10

ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS head_code TEXT,
ADD COLUMN IF NOT EXISTS body_code TEXT,
ADD COLUMN IF NOT EXISTS footer_code TEXT;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
