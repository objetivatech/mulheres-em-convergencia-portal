-- Migração: Atualizar funções de showcase para incluir comunidade
-- Data: 26 de outubro de 2025
-- Descrição: Adiciona community_name nas funções get_featured_businesses e get_random_businesses

-- =============================================================================
-- Atualizar get_featured_businesses
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_featured_businesses(integer);

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
  community_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
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
    c.name AS community_name
  FROM businesses b
  LEFT JOIN communities c ON c.id = b.community_id
  WHERE b.subscription_active = true
    AND b.subscription_plan IN ('intermediario', 'master')
    AND EXISTS (
      SELECT 1 
      FROM user_subscriptions s
      WHERE s.user_id = b.owner_id
        AND s.status IN ('active', 'cancelled')
        AND (
          s.status = 'active' 
          OR (s.status = 'cancelled' AND s.expires_at > NOW())
        )
    )
  ORDER BY b.created_at DESC
  LIMIT limit_count;
$$;

-- =============================================================================
-- Atualizar get_random_businesses
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_random_businesses(integer);

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
    b.category::text,
    b.city,
    b.state,
    b.logo_url,
    b.cover_image_url,
    b.slug,
    b.subscription_plan,
    c.name AS community_name
  FROM businesses b
  LEFT JOIN communities c ON c.id = b.community_id
  WHERE b.subscription_active = true
    AND EXISTS (
      SELECT 1 
      FROM user_subscriptions s
      WHERE s.user_id = b.owner_id
        AND s.status IN ('active', 'cancelled')
        AND (
          s.status = 'active' 
          OR (s.status = 'cancelled' AND s.expires_at > NOW())
        )
    )
  ORDER BY RANDOM()
  LIMIT limit_count;
$$;

-- =============================================================================
-- Comentários
-- =============================================================================

COMMENT ON FUNCTION public.get_featured_businesses IS 'Retorna negócios em destaque (planos intermediário e master) com informações de comunidade';
COMMENT ON FUNCTION public.get_random_businesses IS 'Retorna negócios aleatórios com assinatura ativa e informações de comunidade';

