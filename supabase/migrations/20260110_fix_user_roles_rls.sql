-- Fix RLS Infinite Recursion
-- The previous policy caused a loop because checking the role required querying the table, which checked the role...

-- 1. Create a helper function that bypasses RLS (SECURITY DEFINER) to get the current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM user_roles WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())),
    'user'
  );
$$;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "Masters can manage all roles" ON user_roles;

-- 3. Re-create the master policy using the recursion-free function
CREATE POLICY "Masters can manage all roles" ON user_roles
    FOR ALL USING (
        get_current_user_role() = 'master'
    );

-- 4. Ensure "Users can view own role" is present (it was non-recursive, but good to be safe)
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
CREATE POLICY "Users can view own role" ON user_roles
    FOR SELECT USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );
