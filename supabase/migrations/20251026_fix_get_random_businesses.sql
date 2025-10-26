-- Migração: Corrigir get_random_businesses para mostrar todos os negócios ativos
-- Data: 26 de outubro de 2025
-- Problema: Função estava filtrando apenas negócios com assinatura em user_subscriptions
-- Solução: Confiar apenas em businesses.subscription_active = true

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
  ORDER BY RANDOM()
  LIMIT limit_count;
$$;

COMMENT ON FUNCTION public.get_random_businesses IS 'Retorna negócios aleatórios com assinatura ativa (confia em businesses.subscription_active)';

