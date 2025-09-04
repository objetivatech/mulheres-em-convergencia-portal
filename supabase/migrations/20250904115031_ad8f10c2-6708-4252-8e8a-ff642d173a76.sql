-- Corrigir problemas de segurança - definir search_path nas funções

-- Atualizar função validate_cpf
CREATE OR REPLACE FUNCTION public.validate_cpf(cpf_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cpf_numbers TEXT;
    digit1 INTEGER;
    digit2 INTEGER;
    sum1 INTEGER := 0;
    sum2 INTEGER := 0;
    i INTEGER;
BEGIN
    -- Se for NULL, é válido por enquanto
    IF cpf_input IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Remove pontos e traços
    cpf_numbers := REGEXP_REPLACE(cpf_input, '[^0-9]', '', 'g');
    
    -- Verifica se tem 11 dígitos
    IF LENGTH(cpf_numbers) != 11 THEN
        RETURN FALSE;
    END IF;
    
    -- Verifica sequências inválidas (todos iguais)
    IF cpf_numbers ~ '^(\d)\1{10}$' THEN
        RETURN FALSE;
    END IF;
    
    -- Calcula primeiro dígito verificador
    FOR i IN 1..9 LOOP
        sum1 := sum1 + (SUBSTRING(cpf_numbers FROM i FOR 1)::INTEGER * (11 - i));
    END LOOP;
    
    digit1 := 11 - (sum1 % 11);
    IF digit1 >= 10 THEN
        digit1 := 0;
    END IF;
    
    -- Calcula segundo dígito verificador
    FOR i IN 1..10 LOOP
        sum2 := sum2 + (SUBSTRING(cpf_numbers FROM i FOR 1)::INTEGER * (12 - i));
    END LOOP;
    
    digit2 := 11 - (sum2 % 11);
    IF digit2 >= 10 THEN
        digit2 := 0;
    END IF;
    
    -- Verifica se os dígitos estão corretos
    RETURN (SUBSTRING(cpf_numbers FROM 10 FOR 1)::INTEGER = digit1 AND 
            SUBSTRING(cpf_numbers FROM 11 FOR 1)::INTEGER = digit2);
END;
$$;

-- Atualizar função format_cpf
CREATE OR REPLACE FUNCTION public.format_cpf(cpf_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cpf_numbers TEXT;
BEGIN
    -- Se for NULL, retorna NULL
    IF cpf_input IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Remove caracteres não numéricos
    cpf_numbers := REGEXP_REPLACE(cpf_input, '[^0-9]', '', 'g');
    
    -- Verifica se tem 11 dígitos
    IF LENGTH(cpf_numbers) != 11 THEN
        RETURN cpf_input; -- Retorna original se inválido
    END IF;
    
    -- Formata com pontos e traço
    RETURN SUBSTRING(cpf_numbers FROM 1 FOR 3) || '.' ||
           SUBSTRING(cpf_numbers FROM 4 FOR 3) || '.' ||
           SUBSTRING(cpf_numbers FROM 7 FOR 3) || '-' ||
           SUBSTRING(cpf_numbers FROM 10 FOR 2);
END;
$$;

-- Atualizar função get_user_by_cpf
CREATE OR REPLACE FUNCTION public.get_user_by_cpf(cpf_input TEXT)
RETURNS TABLE(
    id UUID,
    email TEXT,
    full_name TEXT,
    cpf TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    formatted_cpf TEXT;
BEGIN
    -- Formatar CPF para busca
    formatted_cpf := format_cpf(cpf_input);
    
    RETURN QUERY
    SELECT p.id, p.email, p.full_name, p.cpf, p.created_at
    FROM profiles p
    WHERE p.cpf = formatted_cpf;
END;
$$;

-- Atualizar função upsert_user_by_cpf
CREATE OR REPLACE FUNCTION public.upsert_user_by_cpf(
    cpf_input TEXT,
    user_email TEXT DEFAULT NULL,
    user_full_name TEXT DEFAULT NULL,
    user_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    formatted_cpf TEXT;
    existing_user_id UUID;
    new_user_id UUID;
BEGIN
    -- Validar CPF
    IF NOT validate_cpf(cpf_input) THEN
        RAISE EXCEPTION 'CPF inválido: %', cpf_input;
    END IF;
    
    -- Formatar CPF
    formatted_cpf := format_cpf(cpf_input);
    
    -- Verificar se usuário já existe
    SELECT id INTO existing_user_id
    FROM profiles
    WHERE cpf = formatted_cpf;
    
    IF existing_user_id IS NOT NULL THEN
        -- Atualizar dados existentes se fornecidos
        UPDATE profiles
        SET 
            email = COALESCE(user_email, email),
            full_name = COALESCE(user_full_name, full_name),
            updated_at = now()
        WHERE id = existing_user_id;
        
        -- Adicionar contatos se fornecidos
        IF user_email IS NOT NULL THEN
            INSERT INTO user_contacts (user_id, contact_type, contact_value, is_primary)
            VALUES (existing_user_id, 'email', user_email, true)
            ON CONFLICT DO NOTHING;
        END IF;
        
        IF user_phone IS NOT NULL THEN
            INSERT INTO user_contacts (user_id, contact_type, contact_value, is_primary)
            VALUES (existing_user_id, 'phone', user_phone, true)
            ON CONFLICT DO NOTHING;
        END IF;
        
        RETURN existing_user_id;
    ELSE
        -- Criar novo usuário
        INSERT INTO profiles (cpf, email, full_name)
        VALUES (formatted_cpf, user_email, user_full_name)
        RETURNING id INTO new_user_id;
        
        -- Adicionar contatos
        IF user_email IS NOT NULL THEN
            INSERT INTO user_contacts (user_id, contact_type, contact_value, is_primary)
            VALUES (new_user_id, 'email', user_email, true);
        END IF;
        
        IF user_phone IS NOT NULL THEN
            INSERT INTO user_contacts (user_id, contact_type, contact_value, is_primary)
            VALUES (new_user_id, 'phone', user_phone, true);
        END IF;
        
        RETURN new_user_id;
    END IF;
END;
$$;