-- Add unique index to prevent business_analytics conflicts
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_analytics_business_date 
ON public.business_analytics(business_id, date);

-- Performance optimization indexes for RLS policies
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id 
ON public.businesses(owner_id);

CREATE INDEX IF NOT EXISTS idx_business_messages_business_id 
ON public.business_messages(business_id);

CREATE INDEX IF NOT EXISTS idx_business_reviews_business_id 
ON public.business_reviews(business_id);

CREATE INDEX IF NOT EXISTS idx_business_reviews_reviewer_id 
ON public.business_reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id 
ON public.user_addresses(user_id);

CREATE INDEX IF NOT EXISTS idx_user_contacts_user_id 
ON public.user_contacts(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id 
ON public.user_activity_log(user_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id 
ON public.user_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_customer_id 
ON public.transactions(customer_id);

-- Improve submit_business_review_safe function to handle conflicts better
CREATE OR REPLACE FUNCTION public.submit_business_review_safe(
  p_business_id uuid,
  p_rating integer,
  p_reviewer_name text,
  p_title text DEFAULT NULL,
  p_comment text DEFAULT NULL,
  p_reviewer_email text DEFAULT NULL,
  p_reviewer_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  business_exists boolean := false;
  business_active boolean := false;
  review_id uuid;
  business_name text;
BEGIN
  -- Validate business_id is valid UUID
  IF NOT is_valid_uuid(p_business_id::text) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ID do negócio inválido'
    );
  END IF;
  
  -- Validate rating range
  IF p_rating < 1 OR p_rating > 5 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'A avaliação deve ser entre 1 e 5 estrelas'
    );
  END IF;
  
  -- Validate required fields
  IF p_reviewer_name IS NULL OR trim(p_reviewer_name) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nome do avaliador é obrigatório'
    );
  END IF;
  
  -- Check if business exists and is active (separate queries for clarity)
  SELECT EXISTS(SELECT 1 FROM businesses WHERE id = p_business_id) INTO business_exists;
  
  IF NOT business_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Negócio não encontrado'
    );
  END IF;
  
  SELECT subscription_active, name 
  INTO business_active, business_name
  FROM businesses 
  WHERE id = p_business_id;
  
  IF NOT business_active THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Negócio não está ativo'
    );
  END IF;
  
  -- Insert the review
  INSERT INTO business_reviews (
    business_id,
    rating,
    title,
    comment,
    reviewer_name,
    reviewer_email,
    reviewer_id,
    verified
  ) VALUES (
    p_business_id,
    p_rating,
    CASE WHEN p_title IS NULL OR trim(p_title) = '' THEN NULL ELSE trim(p_title) END,
    CASE WHEN p_comment IS NULL OR trim(p_comment) = '' THEN NULL ELSE trim(p_comment) END,
    trim(p_reviewer_name),
    CASE WHEN p_reviewer_email IS NULL OR trim(p_reviewer_email) = '' THEN NULL ELSE trim(p_reviewer_email) END,
    p_reviewer_id,
    CASE WHEN p_reviewer_id IS NOT NULL THEN true ELSE false END
  ) RETURNING id INTO review_id;
  
  -- Update business analytics with proper conflict handling
  BEGIN
    INSERT INTO business_analytics (business_id, date, reviews_count)
    VALUES (p_business_id, CURRENT_DATE, 1)
    ON CONFLICT (business_id, date) 
    DO UPDATE SET reviews_count = business_analytics.reviews_count + 1;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the review submission
    RAISE LOG 'Analytics update failed for business % on %: %', p_business_id, CURRENT_DATE, SQLERRM;
  END;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Avaliação enviada com sucesso!',
    'review_id', review_id,
    'business_name', business_name
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Erro interno do servidor. Tente novamente.',
    'details', SQLERRM
  );
END;
$function$;