CREATE POLICY "Authenticated users can update facebook_ad_accounts"
ON public.facebook_ad_accounts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
