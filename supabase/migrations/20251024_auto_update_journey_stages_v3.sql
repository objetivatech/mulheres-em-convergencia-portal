-- Migração para atualização automática dos estágios da jornada do usuário (Versão Corrigida)
-- Data: 24 de outubro de 2025
-- Esta versão usa os nomes corretos das tabelas: user_subscriptions

-- =============================================================================
-- TRIGGER 1: Atualizar para 'profile_completed' quando perfil for completado
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_profile_completion_and_update_journey()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_complete BOOLEAN;
BEGIN
  -- Verificar se o perfil está completo
  -- Consideramos completo se tiver: full_name, phone, cpf
  is_complete := (
    NEW.full_name IS NOT NULL AND NEW.full_name != '' AND
    NEW.phone IS NOT NULL AND NEW.phone != '' AND
    NEW.cpf IS NOT NULL AND NEW.cpf != ''
  );

  -- Se o perfil está completo, atualizar jornada
  IF is_complete THEN
    PERFORM public.update_user_journey_stage(
      NEW.id,
      'profile_completed',
      jsonb_build_object(
        'completed_at', now(),
        'has_phone', true,
        'has_cpf', true
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger no profiles
DROP TRIGGER IF EXISTS trigger_check_profile_completion ON public.profiles;
CREATE TRIGGER trigger_check_profile_completion
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_completion_and_update_journey();

-- =============================================================================
-- TRIGGER 2: Atualizar para 'active' quando negócio for criado
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_journey_on_business_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quando um negócio é criado, o usuário se torna ativo
  PERFORM public.update_user_journey_stage(
    NEW.user_id,
    'active',
    jsonb_build_object(
      'business_created', true,
      'business_id', NEW.id,
      'business_name', NEW.name,
      'created_at', now()
    )
  );

  RETURN NEW;
END;
$$;

-- Criar trigger no businesses
DROP TRIGGER IF EXISTS trigger_update_journey_on_business ON public.businesses;
CREATE TRIGGER trigger_update_journey_on_business
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_journey_on_business_creation();

-- =============================================================================
-- TRIGGER 3: Atualizar para 'plan_selected' quando assinatura for criada
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_journey_on_subscription_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quando uma assinatura é criada, atualizar para plan_selected
  PERFORM public.update_user_journey_stage(
    NEW.user_id,
    'plan_selected',
    jsonb_build_object(
      'subscription_id', NEW.id,
      'plan_id', NEW.plan_id,
      'status', NEW.status,
      'created_at', now()
    )
  );

  RETURN NEW;
END;
$$;

-- Criar trigger no user_subscriptions (nome correto da tabela)
DROP TRIGGER IF EXISTS trigger_update_journey_on_subscription ON public.user_subscriptions;
CREATE TRIGGER trigger_update_journey_on_subscription
  AFTER INSERT ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_journey_on_subscription_creation();

-- =============================================================================
-- TRIGGER 4: Atualizar quando assinatura se torna ativa
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_journey_on_subscription_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se a assinatura mudou para 'active', atualizar jornada
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    PERFORM public.update_user_journey_stage(
      NEW.user_id,
      'payment_confirmed',
      jsonb_build_object(
        'subscription_id', NEW.id,
        'subscription_status', NEW.status,
        'activated_at', now()
      )
    );
  ELSIF NEW.status = 'pending' AND (OLD.status IS NULL OR OLD.status != 'pending') THEN
    PERFORM public.update_user_journey_stage(
      NEW.user_id,
      'payment_pending',
      jsonb_build_object(
        'subscription_id', NEW.id,
        'subscription_status', NEW.status,
        'pending_at', now()
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger no user_subscriptions para mudanças de status
DROP TRIGGER IF EXISTS trigger_update_journey_on_subscription_status ON public.user_subscriptions;
CREATE TRIGGER trigger_update_journey_on_subscription_status
  AFTER UPDATE OF status ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_journey_on_subscription_status();

-- =============================================================================
-- FUNÇÃO AUXILIAR: Sincronizar jornadas existentes
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sync_existing_user_journeys()
RETURNS TABLE(
  user_id UUID,
  old_stage TEXT,
  new_stage TEXT,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  current_stage TEXT;
  should_be_stage TEXT;
  reason_text TEXT;
BEGIN
  -- Verificar se é admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  -- Iterar sobre todos os usuários com jornada
  FOR user_record IN
    SELECT DISTINCT ON (ujt.user_id)
      ujt.user_id,
      ujt.journey_stage,
      p.full_name,
      p.phone,
      p.cpf,
      (SELECT COUNT(*) FROM public.businesses WHERE user_id = ujt.user_id) as business_count,
      (SELECT COUNT(*) FROM public.user_subscriptions WHERE user_id = ujt.user_id) as subscription_count,
      (SELECT status FROM public.user_subscriptions WHERE user_id = ujt.user_id ORDER BY created_at DESC LIMIT 1) as latest_subscription_status
    FROM public.user_journey_tracking ujt
    JOIN public.profiles p ON p.id = ujt.user_id
    ORDER BY ujt.user_id, ujt.created_at DESC
  LOOP
    current_stage := user_record.journey_stage;
    should_be_stage := current_stage;
    reason_text := 'No change needed';

    -- Determinar qual deveria ser o estágio correto
    IF user_record.business_count > 0 THEN
      should_be_stage := 'active';
      reason_text := format('User has %s business(es)', user_record.business_count);
    ELSIF user_record.latest_subscription_status = 'active' THEN
      should_be_stage := 'payment_confirmed';
      reason_text := 'Subscription is active';
    ELSIF user_record.latest_subscription_status = 'pending' THEN
      should_be_stage := 'payment_pending';
      reason_text := 'Subscription is pending';
    ELSIF user_record.subscription_count > 0 THEN
      should_be_stage := 'plan_selected';
      reason_text := format('User has %s subscription(s)', user_record.subscription_count);
    ELSIF user_record.full_name IS NOT NULL AND user_record.phone IS NOT NULL AND user_record.cpf IS NOT NULL THEN
      should_be_stage := 'profile_completed';
      reason_text := 'Profile is complete';
    ELSE
      should_be_stage := 'signup';
      reason_text := 'Profile incomplete';
    END IF;

    -- Se o estágio deveria ser diferente, atualizar
    IF should_be_stage != current_stage THEN
      PERFORM public.update_user_journey_stage(
        user_record.user_id,
        should_be_stage,
        jsonb_build_object(
          'sync_reason', reason_text,
          'synced_at', now(),
          'previous_stage', current_stage
        )
      );

      -- Retornar informação da atualização
      user_id := user_record.user_id;
      old_stage := current_stage;
      new_stage := should_be_stage;
      reason := reason_text;
      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$$;

-- =============================================================================
-- COMENTÁRIOS
-- =============================================================================

COMMENT ON FUNCTION public.check_profile_completion_and_update_journey() IS 'Trigger function: Atualiza jornada para profile_completed quando perfil é completado';
COMMENT ON FUNCTION public.update_journey_on_business_creation() IS 'Trigger function: Atualiza jornada para active quando negócio é criado';
COMMENT ON FUNCTION public.update_journey_on_subscription_creation() IS 'Trigger function: Atualiza jornada para plan_selected quando assinatura é criada';
COMMENT ON FUNCTION public.update_journey_on_subscription_status() IS 'Trigger function: Atualiza jornada baseado no status da assinatura';
COMMENT ON FUNCTION public.sync_existing_user_journeys() IS 'Função admin: Sincroniza jornadas de usuários existentes com seus dados reais';

