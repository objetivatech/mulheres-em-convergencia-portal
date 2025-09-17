-- Fix search_path for calculate_business_rating_internal function
DROP FUNCTION IF EXISTS public.calculate_business_rating_internal(uuid);

CREATE OR REPLACE FUNCTION public.calculate_business_rating_internal(business_uuid uuid)
RETURNS TABLE(average_rating numeric, total_reviews integer, rating_distribution jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  WHERE business_id = business_uuid
    AND status = 'approved';
END;
$function$;