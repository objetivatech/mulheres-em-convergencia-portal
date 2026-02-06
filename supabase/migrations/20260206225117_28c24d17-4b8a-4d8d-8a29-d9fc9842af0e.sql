
-- Recriar função get_random_businesses com reviews
DROP FUNCTION IF EXISTS public.get_random_businesses(integer);

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
  subscription_plan text, 
  community_name text,
  average_rating numeric,
  reviews_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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
    b.subscription_plan, 
    c.name AS community_name,
    COALESCE(
      (SELECT AVG(br.rating)::numeric FROM public.business_reviews br WHERE br.business_id = b.id AND br.status = 'approved'),
      0
    ) AS average_rating,
    COALESCE(
      (SELECT COUNT(*) FROM public.business_reviews br WHERE br.business_id = b.id AND br.status = 'approved'),
      0
    ) AS reviews_count
  FROM public.businesses b
  LEFT JOIN public.communities c ON c.id = b.community_id
  WHERE is_business_visible(b)
  ORDER BY RANDOM()
  LIMIT limit_count;
$$;

-- Recriar função get_featured_businesses com reviews
DROP FUNCTION IF EXISTS public.get_featured_businesses(integer);

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
  subscription_plan text, 
  community_name text,
  average_rating numeric,
  reviews_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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
    b.subscription_plan, 
    c.name AS community_name,
    COALESCE(
      (SELECT AVG(br.rating)::numeric FROM public.business_reviews br WHERE br.business_id = b.id AND br.status = 'approved'),
      0
    ) AS average_rating,
    COALESCE(
      (SELECT COUNT(*) FROM public.business_reviews br WHERE br.business_id = b.id AND br.status = 'approved'),
      0
    ) AS reviews_count
  FROM public.businesses b
  LEFT JOIN public.communities c ON c.id = b.community_id
  WHERE is_business_visible(b)
    AND b.subscription_plan IN ('intermediario', 'master')
  ORDER BY RANDOM()
  LIMIT limit_count;
$$;
