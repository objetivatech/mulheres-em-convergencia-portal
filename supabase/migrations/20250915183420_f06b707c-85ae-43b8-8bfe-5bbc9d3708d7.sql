-- Fix remaining function search path security warnings
-- Update remaining functions to have explicit search_path

CREATE OR REPLACE FUNCTION public.get_featured_businesses(limit_count integer DEFAULT 5)
RETURNS TABLE(id uuid, name text, description text, category text, city text, state text, logo_url text, cover_image_url text, slug text, subscription_plan text, views_count integer, reviews_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_random_businesses(limit_count integer DEFAULT 5)
RETURNS TABLE(id uuid, name text, description text, category text, city text, state text, logo_url text, cover_image_url text, slug text, subscription_plan text, views_count integer, reviews_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_business_boosts(business_uuid uuid)
RETURNS TABLE(boost_type text, active boolean, expires_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    bb.boost_type,
    bb.active AND bb.expires_at > now() AS active,
    bb.expires_at
  FROM public.business_boosts bb
  WHERE bb.business_id = business_uuid
    AND bb.active = true;
$function$;