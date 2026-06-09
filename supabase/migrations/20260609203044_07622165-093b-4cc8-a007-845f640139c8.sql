
-- 1. ambassador_points: drop public insert; service_role bypasses RLS
DROP POLICY IF EXISTS "Sistema pode inserir pontos" ON public.ambassador_points;

-- 2. ambassador_user_achievements: drop public insert
DROP POLICY IF EXISTS "Sistema pode inserir conquistas" ON public.ambassador_user_achievements;

-- 3. blog_comments: hide author_email from anonymous public; admins/authenticated still see
REVOKE SELECT (author_email) ON public.blog_comments FROM anon;

-- 4. blog_post_tags: remove permissive ALL/INSERT public policies; admins/blog_editors manage
DROP POLICY IF EXISTS "Allow blog post tag management" ON public.blog_post_tags;
DROP POLICY IF EXISTS "Allow blog post tag insertion" ON public.blog_post_tags;
CREATE POLICY "Admins and editors manage post tags"
  ON public.blog_post_tags
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'blog_editor'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'blog_editor'::app_role));

-- 5. business_reviews: hide reviewer_email from anonymous public
REVOKE SELECT (reviewer_email) ON public.business_reviews FROM anon;

-- 7. conecta_referrals: restrict SELECT to participants and admins
DROP POLICY IF EXISTS "conecta_referrals_select" ON public.conecta_referrals;
CREATE POLICY "conecta_referrals_select_own"
  ON public.conecta_referrals
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = from_user_id
    OR auth.uid() = to_user_id
    OR public.conecta_is_admin(auth.uid())
  );

-- 8. landing_pages: drop duplicate permissive SELECT policy
DROP POLICY IF EXISTS "Landing pages ativas são visíveis publicamente" ON public.landing_pages;

-- 9. user_subscriptions: drop public insert/update; edge functions use service_role
DROP POLICY IF EXISTS "Edge functions can insert user subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Edge functions can update user subscriptions" ON public.user_subscriptions;
