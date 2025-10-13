-- Fix security issues: RLS policies and function search paths

-- 1. Add explicit deny-all policy for profiles table (prevent public access)
CREATE POLICY "Deny all public access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- 2. Ensure authenticated users can only see their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 3. Ensure authenticated users can only update their own profile  
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 4. Allow users to insert their own profile (for signup)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 5. Add search_path to remaining functions without it
CREATE OR REPLACE FUNCTION public.validate_cpf(cpf_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cpf_numbers TEXT;
    sum1 INTEGER := 0;
    sum2 INTEGER := 0;
    digit1 INTEGER;
    digit2 INTEGER;
    i INTEGER;
BEGIN
    IF cpf_input IS NULL THEN
        RETURN false;
    END IF;
    
    cpf_numbers := REGEXP_REPLACE(cpf_input, '[^0-9]', '', 'g');
    
    IF LENGTH(cpf_numbers) != 11 THEN
        RETURN false;
    END IF;
    
    IF cpf_numbers ~ '^(.)\1{10}$' THEN
        RETURN false;
    END IF;
    
    FOR i IN 1..9 LOOP
        sum1 := sum1 + CAST(SUBSTRING(cpf_numbers FROM i FOR 1) AS INTEGER) * (11 - i);
    END LOOP;
    
    digit1 := 11 - (sum1 % 11);
    IF digit1 >= 10 THEN
        digit1 := 0;
    END IF;
    
    IF CAST(SUBSTRING(cpf_numbers FROM 10 FOR 1) AS INTEGER) != digit1 THEN
        RETURN false;
    END IF;
    
    FOR i IN 1..10 LOOP
        sum2 := sum2 + CAST(SUBSTRING(cpf_numbers FROM i FOR 1) AS INTEGER) * (12 - i);
    END LOOP;
    
    digit2 := 11 - (sum2 % 11);
    IF digit2 >= 10 THEN
        digit2 := 0;
    END IF;
    
    IF CAST(SUBSTRING(cpf_numbers FROM 11 FOR 1) AS INTEGER) != digit2 THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_has_business(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.businesses 
    WHERE owner_id = user_uuid
  );
$$;

-- 6. Add comment to profiles table about sensitive data
COMMENT ON TABLE public.profiles IS 'Contains sensitive PII including CPF (Brazilian Tax ID), email, phone. Access must be audited and restricted.';
COMMENT ON COLUMN public.profiles.cpf IS 'SENSITIVE: Brazilian Tax ID. All access logged in cpf_access_log table.';
COMMENT ON COLUMN public.profiles.email IS 'SENSITIVE: Personal email address. Protected by RLS policies.';
COMMENT ON COLUMN public.profiles.phone IS 'SENSITIVE: Personal phone number. Protected by RLS policies.';