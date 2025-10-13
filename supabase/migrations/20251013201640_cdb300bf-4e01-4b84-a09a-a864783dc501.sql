-- Criar tabela de rastreamento de jornada do usuário
CREATE TABLE IF NOT EXISTS public.user_journey_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  journey_stage TEXT NOT NULL CHECK (journey_stage IN ('signup', 'profile_completed', 'plan_selected', 'payment_pending', 'payment_confirmed', 'active')),
  stage_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_journey_user_id ON public.user_journey_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_stage ON public.user_journey_tracking(journey_stage);
CREATE INDEX IF NOT EXISTS idx_user_journey_completed ON public.user_journey_tracking(stage_completed);
CREATE INDEX IF NOT EXISTS idx_user_journey_created_at ON public.user_journey_tracking(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_user_journey_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_user_journey_updated_at
  BEFORE UPDATE ON public.user_journey_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_journey_updated_at();

-- RLS Policies
ALTER TABLE public.user_journey_tracking ENABLE ROW LEVEL SECURITY;

-- Admins podem ver tudo
CREATE POLICY "Admins can view all journey tracking"
  ON public.user_journey_tracking
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins podem inserir/atualizar
CREATE POLICY "Admins can manage journey tracking"
  ON public.user_journey_tracking
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Edge functions podem inserir
CREATE POLICY "Edge functions can insert journey tracking"
  ON public.user_journey_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Função para atualizar estágio da jornada
CREATE OR REPLACE FUNCTION public.update_user_journey_stage(
  p_user_id UUID,
  p_new_stage TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  journey_id UUID;
  current_stage_record RECORD;
BEGIN
  -- Validar stage
  IF p_new_stage NOT IN ('signup', 'profile_completed', 'plan_selected', 'payment_pending', 'payment_confirmed', 'active') THEN
    RAISE EXCEPTION 'Invalid journey stage: %', p_new_stage;
  END IF;

  -- Buscar estágio atual
  SELECT * INTO current_stage_record
  FROM public.user_journey_tracking
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se já está no estágio, apenas atualizar metadata
  IF current_stage_record IS NOT NULL AND current_stage_record.journey_stage = p_new_stage THEN
    UPDATE public.user_journey_tracking
    SET 
      metadata = p_metadata,
      updated_at = now()
    WHERE id = current_stage_record.id
    RETURNING id INTO journey_id;
    
    RETURN journey_id;
  END IF;

  -- Marcar estágio anterior como completo
  IF current_stage_record IS NOT NULL THEN
    UPDATE public.user_journey_tracking
    SET 
      stage_completed = true,
      completed_at = now()
    WHERE id = current_stage_record.id;
  END IF;

  -- Inserir novo estágio
  INSERT INTO public.user_journey_tracking (
    user_id,
    journey_stage,
    stage_completed,
    metadata
  ) VALUES (
    p_user_id,
    p_new_stage,
    false,
    p_metadata
  )
  RETURNING id INTO journey_id;

  -- Log da atividade
  PERFORM public.log_user_activity(
    p_user_id,
    'journey_stage_changed',
    format('Mudou para estágio: %s', p_new_stage),
    jsonb_build_object(
      'new_stage', p_new_stage,
      'previous_stage', COALESCE(current_stage_record.journey_stage, 'none')
    )
  );

  RETURN journey_id;
END;
$$;

-- Função para buscar usuários por estágio (admin only)
CREATE OR REPLACE FUNCTION public.get_users_by_journey_stage(
  p_stage TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  journey_stage TEXT,
  stage_completed BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  hours_in_stage NUMERIC,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  RETURN QUERY
  WITH latest_journey AS (
    SELECT DISTINCT ON (ujt.user_id)
      ujt.user_id,
      ujt.journey_stage,
      ujt.stage_completed,
      ujt.created_at,
      ujt.updated_at,
      ujt.metadata,
      EXTRACT(EPOCH FROM (now() - ujt.created_at)) / 3600 AS hours_in_stage
    FROM public.user_journey_tracking ujt
    WHERE p_stage IS NULL OR ujt.journey_stage = p_stage
    ORDER BY ujt.user_id, ujt.created_at DESC
  )
  SELECT 
    lj.user_id,
    p.email,
    p.full_name,
    lj.journey_stage,
    lj.stage_completed,
    lj.created_at,
    lj.updated_at,
    lj.hours_in_stage,
    lj.metadata
  FROM latest_journey lj
  JOIN public.profiles p ON p.id = lj.user_id
  ORDER BY lj.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Função para obter estatísticas do funil
CREATE OR REPLACE FUNCTION public.get_journey_funnel_stats()
RETURNS TABLE(
  stage TEXT,
  user_count BIGINT,
  avg_hours_in_stage NUMERIC,
  completion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  RETURN QUERY
  WITH latest_stages AS (
    SELECT DISTINCT ON (user_id)
      user_id,
      journey_stage,
      stage_completed,
      created_at
    FROM public.user_journey_tracking
    ORDER BY user_id, created_at DESC
  ),
  stage_stats AS (
    SELECT
      journey_stage AS stage,
      COUNT(*) AS user_count,
      AVG(EXTRACT(EPOCH FROM (now() - created_at)) / 3600) AS avg_hours,
      (COUNT(*) FILTER (WHERE stage_completed) * 100.0 / NULLIF(COUNT(*), 0)) AS completion_rate
    FROM latest_stages
    GROUP BY journey_stage
  )
  SELECT 
    stage,
    user_count,
    ROUND(avg_hours, 2) AS avg_hours_in_stage,
    ROUND(completion_rate, 2) AS completion_rate
  FROM stage_stats
  ORDER BY 
    CASE stage
      WHEN 'signup' THEN 1
      WHEN 'profile_completed' THEN 2
      WHEN 'plan_selected' THEN 3
      WHEN 'payment_pending' THEN 4
      WHEN 'payment_confirmed' THEN 5
      WHEN 'active' THEN 6
    END;
END;
$$;

-- Modificar handle_new_user para criar entrada inicial de jornada
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

  -- NOVO: Criar entrada inicial de jornada
  INSERT INTO public.user_journey_tracking (
    user_id,
    journey_stage,
    stage_completed,
    metadata
  ) VALUES (
    NEW.id,
    'signup',
    false,
    jsonb_build_object(
      'signup_method', 'email',
      'has_cpf', formatted_cpf IS NOT NULL,
      'email', NEW.email
    )
  );

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

COMMENT ON TABLE public.user_journey_tracking IS 'Rastreamento da jornada do usuário através dos estágios de conversão';
COMMENT ON FUNCTION public.update_user_journey_stage IS 'Atualiza o estágio da jornada do usuário';
COMMENT ON FUNCTION public.get_users_by_journey_stage IS 'Busca usuários filtrados por estágio da jornada (admin only)';
COMMENT ON FUNCTION public.get_journey_funnel_stats IS 'Retorna estatísticas do funil de conversão (admin only)';
