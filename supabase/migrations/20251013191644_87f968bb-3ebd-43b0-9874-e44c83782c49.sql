-- ============================================
-- CORRIGIR AVISOS DE SEGURANÇA DO LINTER
-- ============================================

-- 1. Recriar VIEW sem SECURITY DEFINER
DROP VIEW IF EXISTS public.public_business_reviews;

CREATE VIEW public.public_business_reviews 
WITH (security_invoker = true) AS
SELECT 
  id,
  business_id,
  reviewer_name,
  rating,
  title,
  comment,
  verified,
  helpful_count,
  created_at,
  status
FROM public.business_reviews
WHERE status = 'approved';

-- 2. Verificar e corrigir todas as funções sem search_path
-- Atualizar todas as funções restantes que podem não ter search_path

-- Função generate_business_slug
CREATE OR REPLACE FUNCTION public.generate_business_slug(business_name TEXT, business_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 0;
BEGIN
    -- Gerar slug base a partir do nome
    base_slug := lower(regexp_replace(
        regexp_replace(
            regexp_replace(business_name, '[àáâãäå]', 'a', 'gi'),
            '[èéêë]', 'e', 'gi'
        ),
        '[^a-z0-9]+', '-', 'gi'
    ));
    
    -- Remover hífens do início e fim
    base_slug := trim(both '-' from base_slug);
    
    -- Verificar se o slug já existe
    final_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM public.businesses WHERE slug = final_slug AND id != business_id) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$;

-- Atualizar calculate_business_rating
CREATE OR REPLACE FUNCTION public.calculate_business_rating(business_uuid UUID)
RETURNS TABLE(average_rating NUMERIC, total_reviews INTEGER, rating_distribution JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  FROM public.business_reviews 
  WHERE business_id = business_uuid;
END;
$$;

-- Atualizar update_business_analytics
CREATE OR REPLACE FUNCTION public.update_business_analytics(business_uuid UUID, metric_name TEXT, increment_by INTEGER DEFAULT 1)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update analytics for today
  INSERT INTO public.business_analytics (business_id, date, views_count, clicks_count, contacts_count, reviews_count, search_appearances, map_clicks)
  VALUES (
    business_uuid, 
    CURRENT_DATE,
    CASE WHEN metric_name = 'views' THEN increment_by ELSE 0 END,
    CASE WHEN metric_name = 'clicks' THEN increment_by ELSE 0 END,
    CASE WHEN metric_name = 'contacts' THEN increment_by ELSE 0 END,
    CASE WHEN metric_name = 'reviews' THEN increment_by ELSE 0 END,
    CASE WHEN metric_name = 'search_appearances' THEN increment_by ELSE 0 END,
    CASE WHEN metric_name = 'map_clicks' THEN increment_by ELSE 0 END
  )
  ON CONFLICT (business_id, date) DO UPDATE SET
    views_count = business_analytics.views_count + CASE WHEN metric_name = 'views' THEN increment_by ELSE 0 END,
    clicks_count = business_analytics.clicks_count + CASE WHEN metric_name = 'clicks' THEN increment_by ELSE 0 END,
    contacts_count = business_analytics.contacts_count + CASE WHEN metric_name = 'contacts' THEN increment_by ELSE 0 END,
    reviews_count = business_analytics.reviews_count + CASE WHEN metric_name = 'reviews' THEN increment_by ELSE 0 END,
    search_appearances = business_analytics.search_appearances + CASE WHEN metric_name = 'search_appearances' THEN increment_by ELSE 0 END,
    map_clicks = business_analytics.map_clicks + CASE WHEN metric_name = 'map_clicks' THEN increment_by ELSE 0 END;

  -- Also update aggregated counters in businesses table
  UPDATE public.businesses 
  SET 
    views_count = views_count + CASE WHEN metric_name = 'views' THEN increment_by ELSE 0 END,
    clicks_count = clicks_count + CASE WHEN metric_name = 'clicks' THEN increment_by ELSE 0 END,
    contacts_count = contacts_count + CASE WHEN metric_name = 'contacts' THEN increment_by ELSE 0 END,
    updated_at = now()
  WHERE id = business_uuid;
END;
$$;