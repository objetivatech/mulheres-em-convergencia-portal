-- Add functions for business showcase on home page
-- Function to get random businesses (all plans)
CREATE OR REPLACE FUNCTION public.get_random_businesses(limit_count integer DEFAULT 5)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  category text,
  city text,
  state text,
  logo_url text,
  cover_image_url text,
  slug text,
  subscription_plan text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    b.id,
    b.name,
    b.description,
    b.category::text,
    b.city,
    b.state,
    b.logo_url,
    b.cover_image_url,
    b.slug,
    b.subscription_plan
  FROM businesses b
  WHERE b.subscription_active = true
    AND EXISTS (
      SELECT 1 
      FROM user_subscriptions us
      WHERE us.user_id = b.owner_id
        AND us.status = 'active'
        AND (us.expires_at IS NULL OR us.expires_at > now())
    )
  ORDER BY RANDOM()
  LIMIT limit_count;
$$;

-- Function to get featured businesses (intermediario and master plans only)
CREATE OR REPLACE FUNCTION public.get_featured_businesses(limit_count integer DEFAULT 5)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  category text,
  city text,
  state text,
  logo_url text,
  cover_image_url text,
  slug text,
  subscription_plan text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    b.id,
    b.name,
    b.description,
    b.category::text,
    b.city,
    b.state,
    b.logo_url,
    b.cover_image_url,
    b.slug,
    b.subscription_plan
  FROM businesses b
  WHERE b.subscription_active = true
    AND b.subscription_plan IN ('intermediario', 'master')
    AND EXISTS (
      SELECT 1 
      FROM user_subscriptions us
      WHERE us.user_id = b.owner_id
        AND us.status = 'active'
        AND (us.expires_at IS NULL OR us.expires_at > now())
    )
  ORDER BY RANDOM()
  LIMIT limit_count;
$$;