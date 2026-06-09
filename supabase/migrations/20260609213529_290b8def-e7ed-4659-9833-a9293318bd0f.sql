
-- 1) Fix sync_socioeconomic_to_impact: use real dates and proper upsert
CREATE OR REPLACE FUNCTION public.sync_socioeconomic_to_impact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_city text;
  v_state text;
  v_region text;
  v_now timestamptz := now();
  v_period_start date;
  v_period_end date;
BEGIN
  SELECT city, state INTO v_city, v_state FROM profiles WHERE id = NEW.user_id;

  v_city := COALESCE(NEW.city, v_city);
  v_state := COALESCE(NEW.state, v_state);
  v_region := COALESCE(v_city || ' - ' || v_state, v_state, 'Não informado');

  v_period_start := date_trunc('month', v_now)::date;
  v_period_end := (date_trunc('month', v_now) + interval '1 month' - interval '1 day')::date;

  INSERT INTO social_impact_metrics (
    metric_name, metric_type, value, unit, region, source,
    demographic, period_start, period_end, notes, project, created_by
  )
  VALUES (
    'perfil_socioeconomico_preenchido',
    'demographic_profile',
    1,
    'perfil',
    v_region,
    'formulario_socioeconomico',
    jsonb_build_object(
      'user_id', NEW.user_id,
      'race_ethnicity', NEW.race_ethnicity,
      'gender_identity', NEW.gender_identity,
      'education_level', NEW.education_level,
      'monthly_income', NEW.monthly_income,
      'employment_status', NEW.employment_status,
      'housing_situation', NEW.housing_situation,
      'has_business', NEW.has_business,
      'business_sector', NEW.business_sector,
      'age_range', CASE
        WHEN NEW.date_of_birth IS NOT NULL THEN
          CASE
            WHEN extract(year from age(v_now, NEW.date_of_birth::date)) < 25 THEN '18-24'
            WHEN extract(year from age(v_now, NEW.date_of_birth::date)) < 35 THEN '25-34'
            WHEN extract(year from age(v_now, NEW.date_of_birth::date)) < 45 THEN '35-44'
            WHEN extract(year from age(v_now, NEW.date_of_birth::date)) < 55 THEN '45-54'
            ELSE '55+'
          END
        ELSE NULL
      END,
      'main_challenges', NEW.main_challenges
    ),
    v_period_start,
    v_period_end,
    'Gerado automaticamente a partir do formulário socioeconômico',
    'MeC Portal',
    NEW.user_id
  )
  ON CONFLICT (metric_type, period_start, ((demographic->>'user_id')))
  WHERE metric_type = 'demographic_profile'
  DO UPDATE SET
    demographic = EXCLUDED.demographic,
    region = EXCLUDED.region,
    period_end = EXCLUDED.period_end,
    updated_at = now();

  RETURN NEW;
END;
$function$;

-- Partial unique index to allow the upsert above
CREATE UNIQUE INDEX IF NOT EXISTS uq_social_impact_demographic_user_month
  ON public.social_impact_metrics (metric_type, period_start, ((demographic->>'user_id')))
  WHERE metric_type = 'demographic_profile';

-- Ensure trigger fires on insert AND update
DROP TRIGGER IF EXISTS trg_sync_socioeconomic_to_impact ON public.user_socioeconomic_data;
CREATE TRIGGER trg_sync_socioeconomic_to_impact
AFTER INSERT OR UPDATE ON public.user_socioeconomic_data
FOR EACH ROW EXECUTE FUNCTION public.sync_socioeconomic_to_impact();

-- 2) Bidirectional sync: conecta_profiles -> profiles
CREATE OR REPLACE FUNCTION public.sync_conecta_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  UPDATE public.profiles SET
    bio = COALESCE(NEW.bio, profiles.bio),
    phone = COALESCE(NEW.phone, profiles.phone),
    linkedin_url = COALESCE(NEW.linkedin_url, profiles.linkedin_url),
    instagram_url = COALESCE(NEW.instagram_url, profiles.instagram_url),
    website_url = COALESCE(NEW.website_url, profiles.website_url),
    updated_at = now()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_conecta_to_profile ON public.conecta_profiles;
CREATE TRIGGER trg_sync_conecta_to_profile
AFTER INSERT OR UPDATE OF bio, phone, linkedin_url, instagram_url, website_url
ON public.conecta_profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_conecta_to_profile();
