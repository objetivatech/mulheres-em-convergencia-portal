-- ========================================
-- CORREÇÃO: Visibilidade de Negócios Cortesia
-- Data: 2025-01-XX
-- Objetivo: Garantir que negócios com is_complimentary = true apareçam no diretório
-- ========================================

-- 1. Corrigir get_public_businesses para incluir negócios cortesia
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
  website text, 
  instagram text, 
  views_count integer, 
  clicks_count integer, 
  featured boolean, 
  slug text,
  created_at timestamp with time zone,
  reviews_count bigint, 
  average_rating numeric
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
    COALESCE((SELECT COUNT(*) FROM public.business_reviews br WHERE br.business_id = b.id AND br.status = 'approved'), 0) as reviews_count,
    COALESCE((SELECT ROUND(AVG(br2.rating::numeric), 1) FROM public.business_reviews br2 WHERE br2.business_id = b.id AND br2.status = 'approved'), 0) as average_rating
  FROM public.businesses b
  WHERE (
    -- Negócios cortesia: sempre visíveis
    b.is_complimentary = true
    OR 
    -- Negócios normais: verificar assinatura ativa
    (
      b.subscription_active = true
      AND EXISTS (
        SELECT 1 
        FROM public.user_subscriptions us
        WHERE us.user_id = b.owner_id
          AND us.status IN ('active', 'cancelled')
          AND (us.expires_at IS NULL OR us.expires_at > now())
      )
    )
  );
$$;

-- 2. Corrigir get_public_business_by_id para incluir cortesia
CREATE OR REPLACE FUNCTION public.get_public_business_by_id(p_business_id uuid)
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
  WHERE b.id = p_business_id 
    AND (
      b.is_complimentary = true
      OR (
        b.subscription_active = true
        AND EXISTS (
          SELECT 1 
          FROM public.user_subscriptions us
          WHERE us.user_id = b.owner_id
            AND us.status IN ('active', 'cancelled')
            AND (us.expires_at IS NULL OR us.expires_at > now())
        )
      )
    )
  LIMIT 1;
$$;

-- 3. Corrigir get_public_business_by_slug para incluir cortesia
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
    AND (
      b.is_complimentary = true
      OR (
        b.subscription_active = true
        AND EXISTS (
          SELECT 1 
          FROM public.user_subscriptions us
          WHERE us.user_id = b.owner_id
            AND us.status IN ('active', 'cancelled')
            AND (us.expires_at IS NULL OR us.expires_at > now())
        )
      )
    );
$$;

-- 4. Comentários explicativos
COMMENT ON FUNCTION public.get_public_businesses IS 'Retorna negócios públicos: cortesia (is_complimentary=true) OU com assinatura ativa';
COMMENT ON FUNCTION public.get_public_business_by_id IS 'Retorna negócio por ID se cortesia OU com assinatura ativa';
COMMENT ON FUNCTION public.get_public_business_by_slug IS 'Retorna negócio por slug se cortesia OU com assinatura ativa';