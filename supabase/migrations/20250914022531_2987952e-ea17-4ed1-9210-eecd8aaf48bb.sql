-- Fix business review submission issues
-- 1. Check current RLS policies on business_reviews table
-- 2. Add UUID validation function 
-- 3. Create RPC for business review submission with better error handling

-- First, let's add a UUID validation function
CREATE OR REPLACE FUNCTION public.is_valid_uuid(uuid_string text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Try to cast to UUID, return false if it fails
  PERFORM uuid_string::uuid;
  RETURN true;
EXCEPTION WHEN invalid_text_representation THEN
  RETURN false;
END;
$$;

-- Create a safer RPC for business review submission
CREATE OR REPLACE FUNCTION public.submit_business_review_safe(
  p_business_id uuid,
  p_rating integer,
  p_title text DEFAULT NULL,
  p_comment text DEFAULT NULL,
  p_reviewer_name text,
  p_reviewer_email text DEFAULT NULL,
  p_reviewer_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  business_exists boolean := false;
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
  
  -- Check if business exists and is active
  SELECT EXISTS(
    SELECT 1 FROM businesses 
    WHERE id = p_business_id 
    AND subscription_active = true
  ), name INTO business_exists, business_name
  FROM businesses 
  WHERE id = p_business_id;
  
  IF NOT business_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Negócio não encontrado ou inativo'
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
    CASE WHEN trim(p_title) = '' THEN NULL ELSE trim(p_title) END,
    CASE WHEN trim(p_comment) = '' THEN NULL ELSE trim(p_comment) END,
    trim(p_reviewer_name),
    CASE WHEN trim(p_reviewer_email) = '' THEN NULL ELSE trim(p_reviewer_email) END,
    p_reviewer_id,
    CASE WHEN p_reviewer_id IS NOT NULL THEN true ELSE false END
  ) RETURNING id INTO review_id;
  
  -- Update business analytics
  PERFORM update_business_analytics(p_business_id, 'reviews', 1);
  
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
$$;