-- Migração: Atualizar get_public_business_by_slug para incluir comunidade
-- Data: 26 de outubro de 2025
-- Descrição: Adiciona community_name na função que carrega página individual do negócio

DROP FUNCTION IF EXISTS public.get_public_business_by_slug(text);

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
  created_at timestamp with time zone,
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
    b.gallery_images,
    b.opening_hours,
    b.website,
    b.instagram,
    b.views_count,
    b.clicks_count,
    b.contacts_count,
    b.featured,
    b.created_at,
    c.name AS community_name
  FROM public.businesses b
  LEFT JOIN public.communities c ON c.id = b.community_id
  WHERE b.slug = p_slug 
    AND b.subscription_active = true
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_public_business_by_slug IS 'Retorna dados completos de um negócio por slug, incluindo informações de comunidade';

