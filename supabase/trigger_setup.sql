-- Enable the pg_net extension to make HTTP requests
create extension if not exists "pg_net";

-- Function to handle new purchase events and call the Edge Function
create or replace function public.handle_new_purchase()
returns trigger as $$
declare
  service_role_key text;
  project_url text;
begin
  -- YOU MUST SET THESE VALUES OR USE A SECURE WAY TO STORE THEM
  -- For security, usually we don't hardcode keys here. 
  -- Ideally, create a Vault secret, but for this setup we will assume you replace these.
  -- OR better: Use the Supabase Dashboard > Database > Webhooks which handles this securely.
  
  -- Replacing with placeholders for the user to fill
  project_url := 'https://auvvrewlbpyymekonilv.supabase.co/functions/v1/send-push';
  service_role_key := 'YOUR_SERVICE_ROLE_KEY'; 

  perform net.http_post(
      url := project_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
  );
  return new;
end;
$$ language plpgsql;

-- Trigger to execute the function on new inserts to gtm_events
create trigger "on_new_purchase_push"
after insert
on "public"."gtm_events"
for each row
when (NEW.event_name = 'purchase')
execute function public.handle_new_purchase();
