-- Migration: Add folder and archive columns to pages table
-- Date: 2026-01-13

-- Add folder column for organization
ALTER TABLE pages ADD COLUMN IF NOT EXISTS folder TEXT DEFAULT NULL;

-- Add archive column (archived pages stay published)
ALTER TABLE pages ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Index for folder filtering
CREATE INDEX IF NOT EXISTS pages_folder_idx ON pages (folder);

-- Index for archive filtering
CREATE INDEX IF NOT EXISTS pages_is_archived_idx ON pages (is_archived);

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
