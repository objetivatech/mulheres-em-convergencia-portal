
-- Etapa 3: Trigger to sync profiles → conecta_profiles when avatar/bio/social links change
CREATE OR REPLACE FUNCTION public.sync_profile_to_modules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sync bio and social links to conecta_profiles if exists
  UPDATE conecta_profiles
  SET
    bio = COALESCE(NEW.bio, conecta_profiles.bio),
    phone = COALESCE(NEW.phone, conecta_profiles.phone),
    linkedin_url = COALESCE(NEW.linkedin_url, conecta_profiles.linkedin_url),
    instagram_url = COALESCE(NEW.instagram_url, conecta_profiles.instagram_url),
    website_url = COALESCE(NEW.website_url, conecta_profiles.website_url),
    updated_at = now()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_to_modules ON profiles;
CREATE TRIGGER trg_sync_profile_to_modules
  AFTER UPDATE OF avatar_url, bio, phone, linkedin_url, instagram_url, website_url
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_modules();

-- Etapa 4: Trigger to sync socioeconomic data → social_impact_metrics
CREATE OR REPLACE FUNCTION public.sync_socioeconomic_to_impact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_city text;
  v_state text;
  v_region text;
  v_now timestamp with time zone := now();
  v_period_start text;
  v_period_end text;
BEGIN
  -- Get city/state from profiles as fallback
  SELECT city, state INTO v_city, v_state
  FROM profiles WHERE id = NEW.user_id;

  v_city := COALESCE(NEW.city, v_city);
  v_state := COALESCE(NEW.state, v_state);
  v_region := COALESCE(v_city || ' - ' || v_state, v_state, 'Não informado');

  v_period_start := to_char(date_trunc('month', v_now), 'YYYY-MM-DD');
  v_period_end := to_char((date_trunc('month', v_now) + interval '1 month' - interval '1 day'), 'YYYY-MM-DD');

  -- Upsert demographic profile metric
  INSERT INTO social_impact_metrics (
    metric_name, metric_type, value, unit, region, source,
    demographic, period_start, period_end, notes, project
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
    'MeC Portal'
  )
  ON CONFLICT ON CONSTRAINT social_impact_metrics_pkey DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_socioeconomic_to_impact ON user_socioeconomic_data;
CREATE TRIGGER trg_sync_socioeconomic_to_impact
  AFTER INSERT OR UPDATE
  ON user_socioeconomic_data
  FOR EACH ROW
  EXECUTE FUNCTION sync_socioeconomic_to_impact();
