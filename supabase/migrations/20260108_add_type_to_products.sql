-- Add type column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'type') THEN 
        ALTER TABLE public.products ADD COLUMN type TEXT; 
    END IF;
END $$;

-- Check active column type and convert if necessary (optional, but good for consistency)
-- If it is integer, we might leave it or change it. Let's strictly add 'type' first as that's the hard failure.
-- The error log also showed columns="name","price","channel","type","url","active"
