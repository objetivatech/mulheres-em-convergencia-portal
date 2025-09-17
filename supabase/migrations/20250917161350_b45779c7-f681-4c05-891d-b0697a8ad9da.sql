-- Update rating functions to use ALL reviews (no status filter)
CREATE OR REPLACE FUNCTION public.calculate_business_rating(business_uuid uuid)
RETURNS TABLE(average_rating numeric, total_reviews integer, rating_distribution jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ROUND(AVG(rating::numeric), 1), 0) as average_rating,
    COUNT(*)::integer as total_reviews,
    jsonb_build_object(
      '5', COUNT(*) FILTER (WHERE rating = 5),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '1', COUNT(*) FILTER (WHERE rating = 1)
    ) as rating_distribution
  FROM business_reviews 
  WHERE business_id = business_uuid; -- Count ALL reviews
END;
$$;

-- Provide an explicit ALL-reviews function to be used by the app
CREATE OR REPLACE FUNCTION public.calculate_business_rating_all(business_uuid uuid)
RETURNS TABLE(average_rating numeric, total_reviews integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(ROUND(AVG(rating::numeric), 1), 0) as average_rating,
    COUNT(*)::integer as total_reviews
  FROM public.business_reviews 
  WHERE business_id = business_uuid;
$$;

-- Update get_random_businesses to include average_rating (ALL reviews) and align reviews_count (ALL)
CREATE OR REPLACE FUNCTION public.get_random_businesses(limit_count integer DEFAULT 5)
RETURNS TABLE(id uuid, name text, description text, category text, city text, state text, logo_url text, cover_image_url text, slug text, subscription_plan text, views_count integer, reviews_count bigint, average_rating numeric)
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
    b.views_count,
    COALESCE((SELECT COUNT(*) FROM public.business_reviews br WHERE br.business_id = b.id), 0) as reviews_count,
    COALESCE((SELECT ROUND(AVG(br2.rating::numeric), 1) FROM public.business_reviews br2 WHERE br2.business_id = b.id), 0) as average_rating
  FROM public.businesses b
  WHERE b.subscription_active = true
    AND EXISTS (
      SELECT 1 
      FROM public.user_subscriptions us
      WHERE us.user_id = b.owner_id
        AND us.status IN ('active', 'cancelled')
        AND (us.expires_at IS NULL OR us.expires_at > now())
    )
  ORDER BY RANDOM()
  LIMIT limit_count;
$$;

-- Update get_featured_businesses to include average_rating (ALL reviews) and align reviews_count (ALL)
CREATE OR REPLACE FUNCTION public.get_featured_businesses(limit_count integer DEFAULT 5)
RETURNS TABLE(id uuid, name text, description text, category text, city text, state text, logo_url text, cover_image_url text, slug text, subscription_plan text, views_count integer, reviews_count bigint, average_rating numeric)
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
    b.views_count,
    COALESCE((SELECT COUNT(*) FROM public.business_reviews br WHERE br.business_id = b.id), 0) as reviews_count,
    COALESCE((SELECT ROUND(AVG(br2.rating::numeric), 1) FROM public.business_reviews br2 WHERE br2.business_id = b.id), 0) as average_rating
  FROM public.businesses b
  WHERE b.subscription_active = true
    AND b.subscription_plan IN ('intermediario', 'master')
    AND EXISTS (
      SELECT 1 
      FROM public.user_subscriptions us
      WHERE us.user_id = b.owner_id
        AND us.status IN ('active', 'cancelled')
        AND (us.expires_at IS NULL OR us.expires_at > now())
    )
  ORDER BY RANDOM()
  LIMIT limit_count;
$$;

-- Create or replace get_public_businesses expected by the directory to include ALL review metrics
CREATE OR REPLACE FUNCTION public.get_public_businesses()
RETURNS TABLE(
  id uuid, name text, description text, category text, subcategory text, city text, state text,
  latitude numeric, longitude numeric, logo_url text, cover_image_url text, website text, instagram text,
  views_count integer, clicks_count integer, featured boolean, slug text,
  created_at timestamp with time zone,
  reviews_count bigint, average_rating numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    b.id,
    b.name,
    b.description,
    b.category::text AS category,
    b.subcategory,
    b.city,
    b.state,
    b.latitude,
    b.longitude,
    b.logo_url,
    b.cover_image_url,
    b.website,
    b.instagram,
    b.views_count,
    b.clicks_count,
    b.featured,
    b.slug,
    b.created_at,
    COALESCE((SELECT COUNT(*) FROM public.business_reviews br WHERE br.business_id = b.id), 0) as reviews_count,
    COALESCE((SELECT ROUND(AVG(br2.rating::numeric), 1) FROM public.business_reviews br2 WHERE br2.business_id = b.id), 0) as average_rating
  FROM public.businesses b
  WHERE b.subscription_active = true
    AND EXISTS (
      SELECT 1 
      FROM public.user_subscriptions us
      WHERE us.user_id = b.owner_id
        AND us.status IN ('active', 'cancelled')
        AND (us.expires_at IS NULL OR us.expires_at > now())
    );
$$;