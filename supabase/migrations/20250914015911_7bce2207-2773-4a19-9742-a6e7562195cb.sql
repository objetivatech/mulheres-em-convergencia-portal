-- Create function to get business by slug for SEO-friendly URLs
CREATE OR REPLACE FUNCTION public.get_public_business_by_slug(p_slug text)
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
  created_at timestamp with time zone
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
        AND us.status = 'active'
        AND (us.expires_at IS NULL OR us.expires_at > now())
    );
$$;

-- Update existing get_public_businesses function to include slug
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
  slug text
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
    b.slug
  FROM public.businesses b
  WHERE b.subscription_active = true
    AND EXISTS (
      SELECT 1 
      FROM public.user_subscriptions us
      WHERE us.user_id = b.owner_id
        AND us.status = 'active'
        AND (us.expires_at IS NULL OR us.expires_at > now())
    );
$$;