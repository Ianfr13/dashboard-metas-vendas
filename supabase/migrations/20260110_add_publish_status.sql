-- Add publish status columns to pages table
ALTER TABLE pages 
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS published_slug TEXT DEFAULT NULL;
