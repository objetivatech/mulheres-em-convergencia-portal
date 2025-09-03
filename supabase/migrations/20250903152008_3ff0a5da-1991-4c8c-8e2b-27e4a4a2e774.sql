-- FASE 2: Reestruturação do sistema baseado em CPF

-- Primeiro, vamos alterar a tabela profiles para tornar CPF obrigatório e único
ALTER TABLE public.profiles 
  ALTER COLUMN cpf SET NOT NULL,
  ADD CONSTRAINT profiles_cpf_unique UNIQUE (cpf),
  ADD CONSTRAINT profiles_cpf_format CHECK (cpf ~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$');

-- Criar tabela para múltiplos contatos do usuário
CREATE TABLE public.user_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('email', 'phone', 'whatsapp')),
  contact_value TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_user_contacts_user_id ON public.user_contacts(user_id);
CREATE INDEX idx_user_contacts_type ON public.user_contacts(contact_type);
CREATE INDEX idx_user_contacts_value ON public.user_contacts(contact_value);

-- Garantir que apenas um contato por tipo seja primário por usuário
CREATE UNIQUE INDEX idx_user_contacts_primary ON public.user_contacts(user_id, contact_type) WHERE is_primary = true;

-- Criar tabela para múltiplos endereços do usuário
CREATE TABLE public.user_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL CHECK (address_type IN ('residential', 'commercial', 'billing', 'shipping')),
  street TEXT NOT NULL,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'Brasil',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para a tabela de endereços
CREATE INDEX idx_user_addresses_user_id ON public.user_addresses(user_id);
CREATE INDEX idx_user_addresses_type ON public.user_addresses(address_type);
CREATE INDEX idx_user_addresses_city_state ON public.user_addresses(city, state);

-- Garantir que apenas um endereço por tipo seja primário por usuário
CREATE UNIQUE INDEX idx_user_addresses_primary ON public.user_addresses(user_id, address_type) WHERE is_primary = true;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.user_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Políticas para user_contacts
CREATE POLICY "Users can view their own contacts" 
ON public.user_contacts 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own contacts" 
ON public.user_contacts 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own contacts" 
ON public.user_contacts 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own contacts" 
ON public.user_contacts 
FOR DELETE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all contacts" 
ON public.user_contacts 
FOR ALL 
USING (get_current_user_admin_status());

-- Políticas para user_addresses
CREATE POLICY "Users can view their own addresses" 
ON public.user_addresses 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own addresses" 
ON public.user_addresses 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own addresses" 
ON public.user_addresses 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own addresses" 
ON public.user_addresses 
FOR DELETE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all addresses" 
ON public.user_addresses 
FOR ALL 
USING (get_current_user_admin_status());

-- Função para validar CPF brasileiro
CREATE OR REPLACE FUNCTION public.validate_cpf(cpf_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    cpf_numbers TEXT;
    digit1 INTEGER;
    digit2 INTEGER;
    sum1 INTEGER := 0;
    sum2 INTEGER := 0;
    i INTEGER;
BEGIN
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

-- Função para formatar CPF
CREATE OR REPLACE FUNCTION public.format_cpf(cpf_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    cpf_numbers TEXT;
BEGIN
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

-- Função para buscar usuário por CPF
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
AS $$
DECLARE
    formatted_cpf TEXT;
BEGIN
    -- Formatar CPF para busca
    formatted_cpf := format_cpf(cpf_input);
    
    RETURN QUERY
    SELECT p.id, p.email, p.full_name, p.cpf, p.created_at
    FROM public.profiles p
    WHERE p.cpf = formatted_cpf;
END;
$$;

-- Função para criar ou atualizar usuário baseado em CPF
CREATE OR REPLACE FUNCTION public.upsert_user_by_cpf(
    cpf_input TEXT,
    user_email TEXT DEFAULT NULL,
    user_full_name TEXT DEFAULT NULL,
    user_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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
    FROM public.profiles
    WHERE cpf = formatted_cpf;
    
    IF existing_user_id IS NOT NULL THEN
        -- Atualizar dados existentes se fornecidos
        UPDATE public.profiles
        SET 
            email = COALESCE(user_email, email),
            full_name = COALESCE(user_full_name, full_name),
            updated_at = now()
        WHERE id = existing_user_id;
        
        -- Adicionar contatos se fornecidos
        IF user_email IS NOT NULL THEN
            INSERT INTO public.user_contacts (user_id, contact_type, contact_value, is_primary)
            VALUES (existing_user_id, 'email', user_email, true)
            ON CONFLICT DO NOTHING;
        END IF;
        
        IF user_phone IS NOT NULL THEN
            INSERT INTO public.user_contacts (user_id, contact_type, contact_value, is_primary)
            VALUES (existing_user_id, 'phone', user_phone, true)
            ON CONFLICT DO NOTHING;
        END IF;
        
        RETURN existing_user_id;
    ELSE
        -- Criar novo usuário
        INSERT INTO public.profiles (cpf, email, full_name)
        VALUES (formatted_cpf, user_email, user_full_name)
        RETURNING id INTO new_user_id;
        
        -- Adicionar contatos
        IF user_email IS NOT NULL THEN
            INSERT INTO public.user_contacts (user_id, contact_type, contact_value, is_primary)
            VALUES (new_user_id, 'email', user_email, true);
        END IF;
        
        IF user_phone IS NOT NULL THEN
            INSERT INTO public.user_contacts (user_id, contact_type, contact_value, is_primary)
            VALUES (new_user_id, 'phone', user_phone, true);
        END IF;
        
        RETURN new_user_id;
    END IF;
END;
$$;

-- Triggers para updated_at
CREATE TRIGGER update_user_contacts_updated_at
    BEFORE UPDATE ON public.user_contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_addresses_updated_at
    BEFORE UPDATE ON public.user_addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();