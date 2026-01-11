-- Add vturb_config column to pages table for VTurb delay script configuration
ALTER TABLE pages ADD COLUMN IF NOT EXISTS vturb_config JSONB DEFAULT NULL;
