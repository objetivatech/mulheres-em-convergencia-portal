-- Fix business review submission issues with correct parameter defaults
-- 1. Add UUID validation function 
-- 2. Create RPC for business review submission with better error handling

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

-- Create a safer RPC for business review submission with proper parameter defaults
CREATE OR REPLACE FUNCTION public.submit_business_review_safe(
  p_business_id uuid,
  p_rating integer,
  p_reviewer_name text,
  p_title text DEFAULT NULL,
  p_comment text DEFAULT NULL,
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
    CASE WHEN p_title IS NULL OR trim(p_title) = '' THEN NULL ELSE trim(p_title) END,
    CASE WHEN p_comment IS NULL OR trim(p_comment) = '' THEN NULL ELSE trim(p_comment) END,
    trim(p_reviewer_name),
    CASE WHEN p_reviewer_email IS NULL OR trim(p_reviewer_email) = '' THEN NULL ELSE trim(p_reviewer_email) END,
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

-- Create functions to safely upsert user contacts and addresses to avoid 409 conflicts
CREATE OR REPLACE FUNCTION public.upsert_user_contact_safe(
  p_user_id uuid,
  p_contact_type text,
  p_contact_value text,
  p_is_primary boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  contact_id uuid;
BEGIN
  -- If setting as primary, first unset other primary contacts of the same type
  IF p_is_primary THEN
    UPDATE user_contacts 
    SET is_primary = false 
    WHERE user_id = p_user_id 
    AND contact_type = p_contact_type 
    AND is_primary = true;
  END IF;
  
  -- Insert or update contact
  INSERT INTO user_contacts (user_id, contact_type, contact_value, is_primary)
  VALUES (p_user_id, p_contact_type, p_contact_value, p_is_primary)
  ON CONFLICT (user_id, contact_type, contact_value) 
  DO UPDATE SET 
    is_primary = EXCLUDED.is_primary,
    updated_at = now()
  RETURNING id INTO contact_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'contact_id', contact_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_user_address_safe(
  p_user_id uuid,
  p_address_type text,
  p_street text,
  p_city text,
  p_state text,
  p_number text DEFAULT NULL,
  p_complement text DEFAULT NULL,
  p_neighborhood text DEFAULT NULL,
  p_postal_code text DEFAULT NULL,
  p_country text DEFAULT 'Brasil',
  p_is_primary boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  address_id uuid;
BEGIN
  -- If setting as primary, first unset other primary addresses of the same type
  IF p_is_primary THEN
    UPDATE user_addresses 
    SET is_primary = false 
    WHERE user_id = p_user_id 
    AND address_type = p_address_type 
    AND is_primary = true;
  END IF;
  
  -- Insert or update address
  INSERT INTO user_addresses (
    user_id, address_type, street, number, complement, 
    neighborhood, city, state, postal_code, country, is_primary
  )
  VALUES (
    p_user_id, p_address_type, p_street, p_number, p_complement,
    p_neighborhood, p_city, p_state, p_postal_code, p_country, p_is_primary
  )
  ON CONFLICT (user_id, address_type, street, city, state) 
  DO UPDATE SET 
    number = EXCLUDED.number,
    complement = EXCLUDED.complement,
    neighborhood = EXCLUDED.neighborhood,
    postal_code = EXCLUDED.postal_code,
    is_primary = EXCLUDED.is_primary,
    updated_at = now()
  RETURNING id INTO address_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'address_id', address_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;