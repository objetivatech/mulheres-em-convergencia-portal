-- Atualizar função handle_new_user para incluir CPF
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Primeiro tenta com upsert para evitar conflitos
  INSERT INTO public.profiles (id, email, full_name, cpf)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'cpf', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    cpf = CASE 
      WHEN profiles.cpf = '' OR profiles.cpf IS NULL 
      THEN COALESCE(EXCLUDED.cpf, profiles.cpf)
      ELSE profiles.cpf
    END,
    updated_at = now();
  
  RETURN NEW;
END;
$$;