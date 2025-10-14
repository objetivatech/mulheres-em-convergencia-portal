-- FASE 3: Corrigir Funções SQL de Negócios (com DROP)

-- Remover funções antigas primeiro
DROP FUNCTION IF EXISTS public.get_random_businesses(integer);
DROP FUNCTION IF EXISTS public.get_featured_businesses(integer);

-- Recriar função get_random_businesses com filtro correto
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
  views_count integer,
  reviews_count integer
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
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
    b.views_count,
    (SELECT COUNT(*)::integer FROM business_reviews WHERE business_id = b.id AND status = 'approved') as reviews_count
  FROM public.businesses b
  WHERE (
    -- Negócios cortesia OU
    b.is_complimentary = true
    OR (
      -- Negócios com assinatura ativa e plano iniciante
      b.subscription_active = true
      AND b.subscription_plan = 'iniciante'
      AND EXISTS (
        SELECT 1 
        FROM public.user_subscriptions us
        WHERE us.user_id = b.owner_id
          AND us.status IN ('active', 'cancelled')
          AND (us.expires_at IS NULL OR us.expires_at > now())
      )
    )
  )
  ORDER BY RANDOM()
  LIMIT limit_count;
$$;

-- Recriar função get_featured_businesses com filtro correto
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
  views_count integer,
  reviews_count integer
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
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
    b.views_count,
    (SELECT COUNT(*)::integer FROM business_reviews WHERE business_id = b.id AND status = 'approved') as reviews_count
  FROM public.businesses b
  WHERE (
    -- Negócios cortesia com plano intermediário ou impulso
    (b.is_complimentary = true AND b.subscription_plan IN ('intermediario', 'impulso'))
    OR (
      -- Negócios com assinatura ativa e plano intermediário ou impulso
      b.subscription_active = true
      AND b.subscription_plan IN ('intermediario', 'impulso')
      AND EXISTS (
        SELECT 1 
        FROM public.user_subscriptions us
        WHERE us.user_id = b.owner_id
          AND us.status IN ('active', 'cancelled')
          AND (us.expires_at IS NULL OR us.expires_at > now())
      )
    )
  )
  ORDER BY RANDOM()
  LIMIT limit_count;
$$;