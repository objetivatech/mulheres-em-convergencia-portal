-- Add moderation system for business reviews
ALTER TABLE public.business_reviews ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Update existing reviews to be approved (backward compatibility)
UPDATE public.business_reviews SET status = 'approved' WHERE status = 'pending';

-- Create index for better performance on status filtering
CREATE INDEX IF NOT EXISTS idx_business_reviews_status ON public.business_reviews(status);
CREATE INDEX IF NOT EXISTS idx_business_reviews_business_status ON public.business_reviews(business_id, status);

-- Update function to return only approved reviews by default
CREATE OR REPLACE FUNCTION public.get_public_business_reviews(business_uuid uuid, limit_count integer DEFAULT 20, offset_count integer DEFAULT 0)
RETURNS TABLE(id uuid, business_id uuid, reviewer_name text, rating integer, title text, comment text, verified boolean, helpful_count integer, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    br.id,
    br.business_id,
    br.reviewer_name,
    br.rating,
    br.title,
    br.comment,
    br.verified,
    br.helpful_count,
    br.created_at
  FROM public.business_reviews br
  WHERE br.business_id = business_uuid
    AND br.status = 'approved'
  ORDER BY br.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
$function$;

-- Update safe business reviews function to also filter by status
CREATE OR REPLACE FUNCTION public.get_safe_business_reviews(p_business_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS TABLE(id uuid, business_id uuid, reviewer_name text, rating integer, title text, comment text, verified boolean, helpful_count integer, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    br.id,
    br.business_id,
    br.reviewer_name,
    br.rating,
    br.title,
    br.comment,
    br.verified,
    br.helpful_count,
    br.created_at
  FROM business_reviews br
  WHERE br.business_id = p_business_id
    AND br.status = 'approved'
  ORDER BY br.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$function$;

-- Update rating calculation to only consider approved reviews
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
  WHERE business_id = business_uuid
    AND status = 'approved';
END;
$function$;

-- Function for business owners to get pending reviews for moderation
CREATE OR REPLACE FUNCTION public.get_pending_business_reviews(business_uuid uuid)
RETURNS TABLE(id uuid, business_id uuid, reviewer_name text, rating integer, title text, comment text, verified boolean, created_at timestamp with time zone, reviewer_email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    br.id,
    br.business_id,
    br.reviewer_name,
    br.rating,
    br.title,
    br.comment,
    br.verified,
    br.created_at,
    br.reviewer_email
  FROM business_reviews br
  WHERE br.business_id = business_uuid
    AND br.status = 'pending'
    AND business_uuid IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  ORDER BY br.created_at DESC;
$function$;

-- Function to moderate reviews (approve/reject)
CREATE OR REPLACE FUNCTION public.moderate_business_review(review_uuid uuid, new_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  business_owner_id uuid;
  review_exists boolean := false;
BEGIN
  -- Validate status
  IF new_status NOT IN ('approved', 'rejected') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Status deve ser "approved" ou "rejected"'
    );
  END IF;
  
  -- Check if review exists and user is the business owner
  SELECT b.owner_id INTO business_owner_id
  FROM business_reviews br
  JOIN businesses b ON br.business_id = b.id
  WHERE br.id = review_uuid
    AND b.owner_id = auth.uid();
  
  IF business_owner_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Avaliação não encontrada ou sem permissão'
    );
  END IF;
  
  -- Update review status
  UPDATE business_reviews 
  SET status = new_status,
      updated_at = now()
  WHERE id = review_uuid;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', CASE 
      WHEN new_status = 'approved' THEN 'Avaliação aprovada com sucesso'
      ELSE 'Avaliação rejeitada com sucesso'
    END
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Erro interno do servidor'
  );
END;
$function$;

-- Update notification trigger to only trigger for approved reviews
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
  -- Only create notification when review is approved or when new review is submitted for moderation
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending') OR 
     (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'approved') THEN
    
    -- Get business owner and name
    SELECT owner_id, name INTO business_owner_id, business_name
    FROM businesses 
    WHERE id = NEW.business_id;
    
    -- Create notification if owner exists
    IF business_owner_id IS NOT NULL THEN
      IF NEW.status = 'pending' THEN
        -- Notification for new review pending moderation
        PERFORM create_notification(
          business_owner_id,
          'review_pending',
          'Nova avaliação para moderar',
          format('Seu negócio "%s" recebeu uma nova avaliação de %s estrelas aguardando moderação.', 
                 business_name, NEW.rating),
          jsonb_build_object(
            'business_id', NEW.business_id,
            'review_id', NEW.id,
            'rating', NEW.rating,
            'reviewer_name', NEW.reviewer_name
          ),
          format('/dashboard-empresa?tab=avaliacoes')
        );
      ELSIF NEW.status = 'approved' THEN
        -- Notification for approved review
        PERFORM create_notification(
          business_owner_id,
          'review_approved',
          'Avaliação aprovada e publicada',
          format('A avaliação de %s estrelas para "%s" foi aprovada e está agora pública.', 
                 NEW.rating, business_name),
          jsonb_build_object(
            'business_id', NEW.business_id,
            'review_id', NEW.id,
            'rating', NEW.rating,
            'reviewer_name', NEW.reviewer_name
          ),
          format('/diretorio/%s', NEW.business_id)
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;