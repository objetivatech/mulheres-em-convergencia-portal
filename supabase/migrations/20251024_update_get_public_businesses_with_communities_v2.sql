-- Atualizar função get_public_businesses para incluir informações de comunidades
-- Esta migração adiciona o nome da comunidade aos negócios públicos
-- Versão 2: Corrige erro ao fazer DROP da função antes de recriar

-- Drop da função existente primeiro
DROP FUNCTION IF EXISTS public.get_public_businesses();

-- Recriar função com suporte a comunidades
CREATE OR REPLACE FUNCTION public.get_public_businesses()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  category text,
  subcategory text,
  community_id uuid,
  community_name text,
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
  reviews_count bigint,
  average_rating numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    b.id,
    b.name,
    b.description,
    b.category::text,
    b.subcategory,
    b.community_id,
    c.name as community_name,
    b.city,
    b.state,
    b.latitude,
    b.longitude,
    b.logo_url,
    b.cover_image_url,
    b.website,
    b.instagram,
    COALESCE(b.views_count, 0) as views_count,
    COALESCE(b.clicks_count, 0) as clicks_count,
    COALESCE(b.featured, false) as featured,
    b.slug,
    COUNT(DISTINCT r.id) as reviews_count,
    COALESCE(AVG(r.rating), 0) as average_rating
  FROM businesses b
  LEFT JOIN communities c ON b.community_id = c.id AND c.active = true
  LEFT JOIN business_reviews r ON b.id = r.business_id AND r.status = 'approved'
  WHERE b.active = true
  GROUP BY 
    b.id, 
    b.name, 
    b.description, 
    b.category, 
    b.subcategory,
    b.community_id,
    c.name,
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
    b.slug
  ORDER BY b.featured DESC, b.created_at DESC;
$$;

COMMENT ON FUNCTION public.get_public_businesses() IS 'Retorna todos os negócios públicos ativos com informações de comunidades e estatísticas de avaliações';

