-- Modificar a função handle_new_user para notificar administradores
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  desired_full_name text;
  desired_cpf_raw text;
  formatted_cpf text;
  cpf_owner uuid;
  supabase_url text;
BEGIN
  desired_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  desired_cpf_raw := NEW.raw_user_meta_data->>'cpf';

  -- Validate and format CPF if provided
  IF desired_cpf_raw IS NOT NULL AND public.validate_cpf(desired_cpf_raw) THEN
    formatted_cpf := public.format_cpf(desired_cpf_raw);
  ELSE
    formatted_cpf := NULL;
  END IF;

  -- Check if there is already a profile with this CPF
  IF formatted_cpf IS NOT NULL THEN
    SELECT id INTO cpf_owner FROM public.profiles WHERE cpf = formatted_cpf;
  END IF;

  -- Insert or update current user's profile
  INSERT INTO public.profiles (id, email, full_name, cpf)
  VALUES (
    NEW.id,
    NEW.email,
    desired_full_name,
    CASE 
      WHEN cpf_owner IS NULL THEN formatted_cpf
      WHEN cpf_owner = NEW.id THEN formatted_cpf
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    cpf = CASE 
      WHEN public.profiles.cpf IS NULL OR public.profiles.cpf = '' THEN COALESCE(EXCLUDED.cpf, public.profiles.cpf)
      ELSE public.profiles.cpf
    END,
    updated_at = now();

  -- Log conflict for later merge flow
  IF cpf_owner IS NOT NULL AND cpf_owner <> NEW.id THEN
    PERFORM public.log_user_activity(
      NEW.id,
      'cpf_conflict_on_signup',
      'CPF já existente em outro perfil. Perfil criado sem CPF; pendente de unificação.',
      jsonb_build_object('cpf', formatted_cpf, 'existing_profile_id', cpf_owner)
    );
  END IF;

  -- Chamar Edge Function para notificar administradores
  -- Usando pg_net extension para fazer chamada HTTP assíncrona
  BEGIN
    supabase_url := current_setting('app.settings.supabase_url', true);
    
    IF supabase_url IS NULL OR supabase_url = '' THEN
      supabase_url := 'https://ngqymbjatenxztrjjdxa.supabase.co';
    END IF;

    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/notify-new-user',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'user_id', NEW.id,
        'email', NEW.email,
        'full_name', desired_full_name,
        'cpf', formatted_cpf,
        'created_at', NEW.created_at
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to notify admins about new user %: %', NEW.id, SQLERRM;
    
    PERFORM public.log_user_activity(
      NEW.id,
      'admin_notification_failed',
      'Falha ao notificar administradores sobre novo cadastro',
      jsonb_build_object('error', SQLERRM)
    );
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function que cria perfil do usuário e notifica administradores via Edge Function';
