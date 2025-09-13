-- Fix handle_new_user to avoid unique CPF constraint violations by safely handling existing CPF
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  desired_full_name text;
  desired_cpf_raw text;
  formatted_cpf text;
  cpf_owner uuid;
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

  -- Insert or update current user's profile; if CPF belongs to another profile, avoid setting CPF to prevent unique violation
  INSERT INTO public.profiles (id, email, full_name, cpf)
  VALUES (
    NEW.id,
    NEW.email,
    desired_full_name,
    CASE 
      WHEN cpf_owner IS NULL THEN formatted_cpf
      WHEN cpf_owner = NEW.id THEN formatted_cpf
      ELSE NULL -- defer merge; do not block signup
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

  -- Log conflict for later merge flow (non-destructive)
  IF cpf_owner IS NOT NULL AND cpf_owner <> NEW.id THEN
    PERFORM public.log_user_activity(
      NEW.id,
      'cpf_conflict_on_signup',
      'CPF já existente em outro perfil. Perfil criado sem CPF; pendente de unificação.',
      jsonb_build_object('cpf', formatted_cpf, 'existing_profile_id', cpf_owner)
    );
  END IF;

  RETURN NEW;
END;
$function$;