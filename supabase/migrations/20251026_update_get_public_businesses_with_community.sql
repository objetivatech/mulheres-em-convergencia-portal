-- Migração: Atualizar get_public_businesses para incluir comunidade
-- Data: 26 de outubro de 2025
-- Descrição: Adiciona community_id e community_name na função get_public_businesses

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
  website text, 
  instagram text, 
  views_count integer, 
  clicks_count integer, 
  featured boolean, 
  slug text,
  created_at timestamp with time zone,
  reviews_count bigint, 
  average_rating numeric,
  community_id uuid,
  community_name text
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
    COALESCE(COUNT(DISTINCT r.id), 0) AS reviews_count,
    COALESCE(AVG(r.rating), 0) AS average_rating,
    b.community_id,
    c.name AS community_name
  FROM public.businesses b
  LEFT JOIN public.business_reviews r ON r.business_id = b.id
  LEFT JOIN public.communities c ON c.id = b.community_id
  WHERE 
    b.subscription_active = true
    AND (b.is_complimentary = true OR EXISTS (
      SELECT 1 
      FROM public.user_subscriptions s
      WHERE s.user_id = b.owner_id
        AND s.status IN ('active', 'cancelled')
        AND (
          s.status = 'active' 
          OR (s.status = 'cancelled' AND s.expires_at > NOW())
        )
    ))
  GROUP BY b.id, b.name, b.description, b.category, b.subcategory, b.city, b.state, 
           b.latitude, b.longitude, b.logo_url, b.cover_image_url, b.website, 
           b.instagram, b.views_count, b.clicks_count, b.featured, b.slug, 
           b.created_at, b.community_id, c.name
  ORDER BY b.featured DESC, b.created_at DESC;
$$;

COMMENT ON FUNCTION public.get_public_businesses IS 'Retorna negócios públicos com informações de comunidade: cortesia (is_complimentary=true) OU com assinatura ativa';

