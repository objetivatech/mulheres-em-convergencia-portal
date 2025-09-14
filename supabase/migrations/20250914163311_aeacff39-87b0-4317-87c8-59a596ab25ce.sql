-- Create RPC for safe blog post view increment
CREATE OR REPLACE FUNCTION public.increment_blog_post_views(p_slug text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE blog_posts 
  SET views_count = views_count + 1,
      updated_at = now()
  WHERE slug = p_slug 
    AND status = 'published';
  
  RETURN FOUND;
END;
$$;

-- Update business analytics function to also update aggregated data in businesses table
CREATE OR REPLACE FUNCTION public.update_business_analytics(business_uuid uuid, metric_name text, increment_by integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert or update analytics for today
  INSERT INTO public.business_analytics (business_id, date, views_count, clicks_count, contacts_count, reviews_count, search_appearances, map_clicks)
  VALUES (
    business_uuid, 
    CURRENT_DATE,
    CASE WHEN metric_name = 'views' THEN increment_by ELSE 0 END,
    CASE WHEN metric_name = 'clicks' THEN increment_by ELSE 0 END,
    CASE WHEN metric_name = 'contacts' THEN increment_by ELSE 0 END,
    CASE WHEN metric_name = 'reviews' THEN increment_by ELSE 0 END,
    CASE WHEN metric_name = 'search_appearances' THEN increment_by ELSE 0 END,
    CASE WHEN metric_name = 'map_clicks' THEN increment_by ELSE 0 END
  )
  ON CONFLICT (business_id, date) DO UPDATE SET
    views_count = business_analytics.views_count + CASE WHEN metric_name = 'views' THEN increment_by ELSE 0 END,
    clicks_count = business_analytics.clicks_count + CASE WHEN metric_name = 'clicks' THEN increment_by ELSE 0 END,
    contacts_count = business_analytics.contacts_count + CASE WHEN metric_name = 'contacts' THEN increment_by ELSE 0 END,
    reviews_count = business_analytics.reviews_count + CASE WHEN metric_name = 'reviews' THEN increment_by ELSE 0 END,
    search_appearances = business_analytics.search_appearances + CASE WHEN metric_name = 'search_appearances' THEN increment_by ELSE 0 END,
    map_clicks = business_analytics.map_clicks + CASE WHEN metric_name = 'map_clicks' THEN increment_by ELSE 0 END;

  -- Also update aggregated counters in businesses table
  UPDATE businesses 
  SET 
    views_count = views_count + CASE WHEN metric_name = 'views' THEN increment_by ELSE 0 END,
    clicks_count = clicks_count + CASE WHEN metric_name = 'clicks' THEN increment_by ELSE 0 END,
    contacts_count = contacts_count + CASE WHEN metric_name = 'contacts' THEN increment_by ELSE 0 END,
    updated_at = now()
  WHERE id = business_uuid;
END;
$$;

-- Update get_random_businesses to include reviews_count
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
  views_count integer,
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
    b.views_count,
    COALESCE((SELECT COUNT(*) FROM business_reviews br WHERE br.business_id = b.id), 0) as reviews_count
  FROM businesses b
  WHERE b.subscription_active = true
    AND EXISTS (
      SELECT 1 
      FROM user_subscriptions us
      WHERE us.user_id = b.owner_id
        AND us.status IN ('active', 'cancelled')
        AND (us.expires_at IS NULL OR us.expires_at > now())
    )
  ORDER BY RANDOM()
  LIMIT limit_count;
$$;

-- Update get_featured_businesses to include reviews_count
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
  views_count integer,
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
    b.views_count,
    COALESCE((SELECT COUNT(*) FROM business_reviews br WHERE br.business_id = b.id), 0) as reviews_count
  FROM businesses b
  WHERE b.subscription_active = true
    AND b.subscription_plan IN ('intermediario', 'master')
    AND EXISTS (
      SELECT 1 
      FROM user_subscriptions us
      WHERE us.user_id = b.owner_id
        AND us.status IN ('active', 'cancelled')
        AND (us.expires_at IS NULL OR us.expires_at > now())
    )
  ORDER BY RANDOM()
  LIMIT limit_count;
$$;

-- Update get_public_businesses to include reviews_count
CREATE OR REPLACE FUNCTION public.get_public_businesses()
RETURNS TABLE(
  id uuid, 
  name text, 
  description text, 
  category text, 
  subcategory text, 
  city text, 
  state text, 
  latitude numeric, 
  longitude numeric, 
  logo_url text, 
  cover_image_url text, 
  gallery_images text[], 
  website text, 
  instagram text, 
  views_count integer, 
  clicks_count integer, 
  contacts_count integer, 
  featured boolean, 
  created_at timestamp with time zone, 
  slug text,
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
    b.category::text AS category,
    b.subcategory,
    b.city,
    b.state,
    b.latitude,
    b.longitude,
    b.logo_url,
    b.cover_image_url,
    b.gallery_images,
    b.website,
    b.instagram,
    b.views_count,
    b.clicks_count,
    b.contacts_count,
    b.featured,
    b.created_at,
    b.slug,
    COALESCE((SELECT COUNT(*) FROM business_reviews br WHERE br.business_id = b.id), 0) as reviews_count
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