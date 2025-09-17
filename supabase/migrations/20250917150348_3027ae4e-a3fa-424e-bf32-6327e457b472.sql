-- Fix calculate_business_rating function to return consistent results
DROP FUNCTION IF EXISTS public.calculate_business_rating_internal(uuid);

CREATE OR REPLACE FUNCTION public.calculate_business_rating_internal(business_uuid uuid)
RETURNS TABLE(average_rating numeric, total_reviews integer, rating_distribution jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  WHERE business_id = business_uuid
    AND status = 'approved';
END;
$function$;

-- Update get_public_businesses to include consistent average rating calculation
DROP FUNCTION IF EXISTS public.get_public_businesses();

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
  opening_hours jsonb, 
  website text, 
  instagram text, 
  views_count integer, 
  clicks_count integer, 
  contacts_count integer, 
  featured boolean, 
  created_at timestamp with time zone,
  slug text,
  subscription_plan text,
  reviews_count bigint,
  average_rating numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    b.id,
    b.name,
    b.description,
    b.category::text,
    b.subcategory,
    b.city,
    b.state,
    b.latitude,
    b.longitude,
    b.logo_url,
    b.cover_image_url,
    b.gallery_images,
    b.opening_hours,
    b.website,
    b.instagram,
    b.views_count,
    b.clicks_count,
    b.contacts_count,
    b.featured,
    b.created_at,
    b.slug,
    b.subscription_plan,
    COALESCE(
      (SELECT COUNT(*) FROM business_reviews br WHERE br.business_id = b.id AND br.status = 'approved'), 
      0
    ) as reviews_count,
    COALESCE(
      (SELECT ROUND(AVG(rating::numeric), 1) FROM business_reviews br WHERE br.business_id = b.id AND br.status = 'approved'), 
      0
    ) as average_rating
  FROM businesses b
  WHERE b.subscription_active = true
    AND EXISTS (
      SELECT 1 
      FROM user_subscriptions us
      WHERE us.user_id = b.owner_id
        AND us.status IN ('active', 'cancelled')
        AND (us.expires_at IS NULL OR us.expires_at > now())
    );
$function$;

-- Add city field to business_service_areas table for neighborhoods
ALTER TABLE business_service_areas ADD COLUMN IF NOT EXISTS city text;

-- Update existing neighborhood entries to include city information
UPDATE business_service_areas 
SET city = CASE 
  WHEN area_type = 'neighborhood' AND city IS NULL THEN area_name 
  ELSE city 
END;