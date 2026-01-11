-- Create a secure RPC function to fetch the current user's role details
-- This avoids RLS issues where the user cannot query auth.users to verify their email
CREATE OR REPLACE FUNCTION public.get_my_user_role()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  current_email text;
  result json;
BEGIN
  -- Get email securely from auth system
  SELECT email INTO current_email FROM auth.users WHERE id = auth.uid();
  
  IF current_email IS NULL THEN
    RETURN null;
  END IF;

  -- Fetch row bypassing RLS
  SELECT row_to_json(ur) INTO result
  FROM user_roles ur
  WHERE ur.email = current_email;
  
  RETURN result;
END;
$$;
