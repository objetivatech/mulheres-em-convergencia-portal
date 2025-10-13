-- Corrigir funções RPC com erro de ambiguidade de coluna

-- Recriar função get_journey_funnel_stats
DROP FUNCTION IF EXISTS public.get_journey_funnel_stats();

CREATE OR REPLACE FUNCTION public.get_journey_funnel_stats()
RETURNS TABLE (
  stage text,
  user_count bigint,
  avg_hours_in_stage numeric,
  completion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH stage_stats AS (
    SELECT 
      ujt.journey_stage,
      COUNT(DISTINCT ujt.user_id) as users_in_stage,
      AVG(EXTRACT(EPOCH FROM (COALESCE(ujt.completed_at, now()) - ujt.created_at)) / 3600) as avg_hours,
      COUNT(DISTINCT CASE WHEN ujt.stage_completed THEN ujt.user_id END) as completed_users
    FROM public.user_journey_tracking ujt
    WHERE ujt.journey_stage IN ('signup', 'profile_completed', 'plan_selected', 'payment_pending', 'payment_confirmed', 'active')
    GROUP BY ujt.journey_stage
  )
  SELECT 
    ss.journey_stage::text as stage,
    ss.users_in_stage as user_count,
    ROUND(COALESCE(ss.avg_hours, 0)::numeric, 2) as avg_hours_in_stage,
    ROUND(CASE 
      WHEN ss.users_in_stage > 0 
      THEN (ss.completed_users::numeric / ss.users_in_stage::numeric * 100)
      ELSE 0 
    END, 2) as completion_rate
  FROM stage_stats ss
  ORDER BY 
    CASE ss.journey_stage
      WHEN 'signup' THEN 1
      WHEN 'profile_completed' THEN 2
      WHEN 'plan_selected' THEN 3
      WHEN 'payment_pending' THEN 4
      WHEN 'payment_confirmed' THEN 5
      WHEN 'active' THEN 6
      ELSE 7
    END;
END;
$$;

-- Recriar função get_users_by_journey_stage
DROP FUNCTION IF EXISTS public.get_users_by_journey_stage(text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_users_by_journey_stage(
  p_stage text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  journey_stage text,
  stage_completed boolean,
  created_at timestamp with time zone,
  hours_in_stage numeric,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se usuário é admin
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  RETURN QUERY
  WITH latest_journey AS (
    SELECT DISTINCT ON (ujt.user_id)
      ujt.user_id,
      ujt.journey_stage,
      ujt.stage_completed,
      ujt.created_at,
      ujt.metadata,
      EXTRACT(EPOCH FROM (now() - ujt.created_at)) / 3600 as hours_in_stage
    FROM public.user_journey_tracking ujt
    WHERE p_stage IS NULL OR ujt.journey_stage = p_stage
    ORDER BY ujt.user_id, ujt.created_at DESC
  )
  SELECT 
    lj.user_id,
    p.email,
    p.full_name,
    lj.journey_stage::text,
    lj.stage_completed,
    lj.created_at,
    ROUND(lj.hours_in_stage::numeric, 2) as hours_in_stage,
    lj.metadata
  FROM latest_journey lj
  INNER JOIN public.profiles p ON p.id = lj.user_id
  ORDER BY lj.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;