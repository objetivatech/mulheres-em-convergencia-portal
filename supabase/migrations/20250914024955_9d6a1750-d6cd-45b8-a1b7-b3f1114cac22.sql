-- Fix 31-day subscription rule
-- Update public business functions to check subscription validity correctly

CREATE OR REPLACE FUNCTION public.get_public_businesses()
RETURNS TABLE(id uuid, name text, description text, category text, subcategory text, city text, state text, latitude numeric, longitude numeric, logo_url text, cover_image_url text, gallery_images text[], website text, instagram text, views_count integer, clicks_count integer, contacts_count integer, featured boolean, created_at timestamp with time zone, slug text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    b.slug
  FROM public.businesses b
  WHERE b.subscription_active = true
    AND EXISTS (
      SELECT 1 
      FROM public.user_subscriptions us
      WHERE us.user_id = b.owner_id
        AND us.status IN ('active', 'cancelled')
        AND (us.expires_at IS NULL OR us.expires_at > now())
    );
$function$;

CREATE OR REPLACE FUNCTION public.get_public_business_by_slug(p_slug text)
RETURNS TABLE(id uuid, name text, description text, category text, subcategory text, city text, state text, latitude numeric, longitude numeric, logo_url text, cover_image_url text, gallery_images text[], opening_hours jsonb, website text, instagram text, views_count integer, clicks_count integer, contacts_count integer, featured boolean, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    b.opening_hours,
    b.website,
    b.instagram,
    b.views_count,
    b.clicks_count,
    b.contacts_count,
    b.featured,
    b.created_at
  FROM public.businesses b
  WHERE b.slug = p_slug 
    AND b.subscription_active = true
    AND EXISTS (
      SELECT 1 
      FROM public.user_subscriptions us
      WHERE us.user_id = b.owner_id
        AND us.status IN ('active', 'cancelled')
        AND (us.expires_at IS NULL OR us.expires_at > now())
    );
$function$;

CREATE OR REPLACE FUNCTION public.get_public_business_by_id(p_business_id uuid)
RETURNS TABLE(id uuid, name text, description text, category text, subcategory text, city text, state text, latitude numeric, longitude numeric, logo_url text, cover_image_url text, gallery_images text[], opening_hours jsonb, website text, instagram text, views_count integer, clicks_count integer, contacts_count integer, featured boolean, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    b.opening_hours,
    b.website,
    b.instagram,
    b.views_count,
    b.clicks_count,
    b.contacts_count,
    b.featured,
    b.created_at
  FROM public.businesses b
  WHERE b.id = p_business_id 
    AND b.subscription_active = true
    AND EXISTS (
      SELECT 1 
      FROM public.user_subscriptions us
      WHERE us.user_id = b.owner_id
        AND us.status IN ('active', 'cancelled')
        AND (us.expires_at IS NULL OR us.expires_at > now())
    )
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_random_businesses(limit_count integer DEFAULT 5)
RETURNS TABLE(id uuid, name text, description text, category text, city text, state text, logo_url text, cover_image_url text, slug text, subscription_plan text)
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
    b.subscription_plan
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

CREATE OR REPLACE FUNCTION public.get_featured_businesses(limit_count integer DEFAULT 5)
RETURNS TABLE(id uuid, name text, description text, category text, city text, state text, logo_url text, cover_image_url text, slug text, subscription_plan text)
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
    b.subscription_plan
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

CREATE OR REPLACE FUNCTION public.get_business_contacts(p_business_id uuid)
RETURNS TABLE(phone text, email text, whatsapp text, website text, instagram text, address text, postal_code text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    b.phone,
    b.email,
    b.whatsapp,
    b.website,
    b.instagram,
    b.address,
    b.postal_code
  FROM public.businesses b
  WHERE b.id = p_business_id 
    AND b.subscription_active = true
    AND (
      public.get_current_user_admin_status() 
      OR b.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 
        FROM public.user_subscriptions us
        WHERE us.user_id = auth.uid()
          AND us.status IN ('active', 'cancelled')
          AND (us.expires_at IS NULL OR us.expires_at > now())
      )
      OR EXISTS (
        SELECT 1 
        FROM public.user_subscriptions us
        WHERE us.user_id = b.owner_id
          AND us.status IN ('active', 'cancelled')
          AND (us.expires_at IS NULL OR us.expires_at > now())
      )
    );
$function$;