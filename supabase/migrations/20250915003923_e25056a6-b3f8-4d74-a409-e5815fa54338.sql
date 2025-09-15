-- Fix function search path security warnings
-- Update functions that don't have explicit search_path set

CREATE OR REPLACE FUNCTION public.calculate_business_rating(business_uuid uuid)
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
  WHERE business_id = business_uuid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_notification(target_user_id uuid, notification_type text, notification_title text, notification_message text, notification_data jsonb DEFAULT '{}'::jsonb, notification_action_url text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id, type, title, message, data, action_url
  ) VALUES (
    target_user_id, notification_type, notification_title, 
    notification_message, notification_data, notification_action_url
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_business_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  business_owner_id uuid;
  business_name text;
BEGIN
  -- Get business owner and name
  SELECT owner_id, name INTO business_owner_id, business_name
  FROM businesses 
  WHERE id = NEW.business_id;
  
  -- Create notification if owner exists
  IF business_owner_id IS NOT NULL THEN
    PERFORM create_notification(
      business_owner_id,
      'new_review',
      'Nova avaliação recebida',
      format('Seu negócio "%s" recebeu uma nova avaliação de %s estrelas.', 
             business_name, NEW.rating),
      jsonb_build_object(
        'business_id', NEW.business_id,
        'review_id', NEW.id,
        'rating', NEW.rating,
        'reviewer_name', NEW.reviewer_name
      ),
      format('/diretorio/%s', NEW.business_id)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_google_places_api_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN current_setting('app.settings.google_places_api_key', true);
END;
$function$;