-- Add tracking_params column to pages table for Link Generator state
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS tracking_params JSONB DEFAULT '{}'::jsonb;
