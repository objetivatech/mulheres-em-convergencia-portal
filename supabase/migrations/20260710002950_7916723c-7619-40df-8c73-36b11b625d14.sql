
-- 1) Hide commenter email from anonymous public
REVOKE SELECT (author_email) ON public.blog_comments FROM anon;
REVOKE SELECT (author_email) ON public.blog_comments FROM authenticated;
-- Admins/service role still have full access via has_role/service_role.

-- 2) Hide reviewer_email from public
REVOKE SELECT (reviewer_email) ON public.business_reviews FROM anon;
REVOKE SELECT (reviewer_email) ON public.business_reviews FROM authenticated;

-- 3) Restrict walk-in event_registrations updates to admins only
DROP POLICY IF EXISTS "Anyone can update walkin registrations" ON public.event_registrations;
CREATE POLICY "Admins can update walkin registrations"
  ON public.event_registrations
  FOR UPDATE
  TO authenticated
  USING (user_id IS NULL AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id IS NULL AND public.has_role(auth.uid(), 'admin'));

-- 4) Enforce folder ownership on storage INSERT for business-* buckets
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-logos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Authenticated users can upload covers" ON storage.objects;
CREATE POLICY "Authenticated users can upload covers"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-covers'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Authenticated users can upload gallery images" ON storage.objects;
CREATE POLICY "Authenticated users can upload gallery images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-gallery'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
