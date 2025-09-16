-- Create business service areas table
CREATE TABLE IF NOT EXISTS public.business_service_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  area_type TEXT NOT NULL CHECK (area_type IN ('city', 'neighborhood')),
  area_name TEXT NOT NULL,
  state TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_service_areas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Business owners can manage their service areas"
ON public.business_service_areas
FOR ALL 
USING (business_id IN (
  SELECT id FROM public.businesses WHERE owner_id = auth.uid()
));

CREATE POLICY "Everyone can view service areas"
ON public.business_service_areas
FOR SELECT
USING (active = true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_service_areas_business_id ON public.business_service_areas(business_id);
CREATE INDEX IF NOT EXISTS idx_business_service_areas_area_type ON public.business_service_areas(area_type);
CREATE INDEX IF NOT EXISTS idx_business_service_areas_state ON public.business_service_areas(state);

-- Update business rating calculation function to count ALL reviews in average (approved + rejected)
-- but only approved reviews for public display
CREATE OR REPLACE FUNCTION public.calculate_business_rating_internal(business_uuid uuid)
RETURNS TABLE(average_rating numeric, total_reviews integer, rating_distribution jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
  WHERE business_id = business_uuid;
END;
$$;

-- Create function to check if user has business
CREATE OR REPLACE FUNCTION public.user_has_business(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE owner_id = user_uuid 
    AND subscription_active = true
  );
$$ ;

-- Create function to get admin business analytics
CREATE OR REPLACE FUNCTION public.get_admin_business_analytics()
RETURNS TABLE(
  business_id uuid,
  business_name text,
  business_category text,
  business_city text,
  business_state text,
  owner_email text,
  subscription_plan text,
  subscription_active boolean,
  total_views integer,
  total_clicks integer,
  total_contacts integer,
  total_reviews bigint,
  average_rating numeric,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    b.id as business_id,
    b.name as business_name,
    b.category::text as business_category,
    b.city as business_city,
    b.state as business_state,
    p.email as owner_email,
    b.subscription_plan,
    b.subscription_active,
    b.views_count as total_views,
    b.clicks_count as total_clicks,
    b.contacts_count as total_contacts,
    COALESCE((SELECT COUNT(*) FROM business_reviews br WHERE br.business_id = b.id AND br.status = 'approved'), 0) as total_reviews,
    COALESCE((
      SELECT ROUND(AVG(rating::numeric), 1) 
      FROM business_reviews br 
      WHERE br.business_id = b.id
    ), 0) as average_rating,
    b.created_at
  FROM businesses b
  LEFT JOIN profiles p ON p.id = b.owner_id
  WHERE get_current_user_admin_status() = true
  ORDER BY b.created_at DESC;
$$;

-- Create function to get business service areas
CREATE OR REPLACE FUNCTION public.get_business_service_areas(business_uuid uuid)
RETURNS TABLE(
  id uuid,
  area_type text,
  area_name text,
  state text,
  active boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    bsa.id,
    bsa.area_type,
    bsa.area_name,
    bsa.state,
    bsa.active
  FROM business_service_areas bsa
  WHERE bsa.business_id = business_uuid
    AND bsa.active = true
  ORDER BY bsa.area_type, bsa.area_name;
$$;

-- Update get_public_businesses to use correct rating calculation
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
  reviews_count bigint,
  average_rating numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
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
    COALESCE((SELECT COUNT(*) FROM business_reviews br WHERE br.business_id = b.id AND br.status = 'approved'), 0) as reviews_count,
    COALESCE((
      SELECT ROUND(AVG(rating::numeric), 1) 
      FROM business_reviews br 
      WHERE br.business_id = b.id
    ), 0) as average_rating
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

-- Add trigger for updated_at on service areas
CREATE TRIGGER update_business_service_areas_updated_at
  BEFORE UPDATE ON public.business_service_areas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();