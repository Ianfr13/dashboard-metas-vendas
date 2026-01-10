-- Migration: Add Proxy Mode support
-- Date: 2026-01-10

ALTER TABLE ab_test_variants 
ADD COLUMN IF NOT EXISTS is_proxy BOOLEAN DEFAULT false;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
