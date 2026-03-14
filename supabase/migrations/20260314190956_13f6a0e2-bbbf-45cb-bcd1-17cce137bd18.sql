-- =====================================================
-- Fix 1: Rewrite deactivate_expired_businesses to handle NULL renewal_date
-- Also checks subscription_expires_at and excludes complimentary businesses
-- =====================================================
CREATE OR REPLACE FUNCTION public.deactivate_expired_businesses()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  expired_count integer := 0;
  deactivated_business RECORD;
  owner_has_active boolean;
BEGIN
  -- Desativar negócios expirados (NÃO cortesia) com grace period de 5 dias
  FOR deactivated_business IN
    UPDATE businesses 
    SET subscription_active = false,
        updated_at = NOW()
    WHERE subscription_active = true 
      AND is_complimentary = false
      AND (
        -- Caso A: renewal_date existe e está no passado (+ 5 dias grace)
        (subscription_renewal_date IS NOT NULL AND subscription_renewal_date + INTERVAL '5 days' < CURRENT_DATE)
        OR
        -- Caso B: renewal_date é NULL mas expires_at existe e está no passado (+ 5 dias grace)
        (subscription_renewal_date IS NULL AND subscription_expires_at IS NOT NULL AND subscription_expires_at + INTERVAL '5 days' < CURRENT_TIMESTAMP)
      )
    RETURNING id, name, owner_id
  LOOP
    expired_count := expired_count + 1;
    
    -- Atualizar user_subscriptions correspondente para cancelled
    UPDATE user_subscriptions
    SET status = 'cancelled', updated_at = NOW()
    WHERE user_id = deactivated_business.owner_id
      AND status = 'active';
    
    -- Verificar se o owner ainda tem negócios ativos
    SELECT EXISTS(
      SELECT 1 FROM businesses 
      WHERE owner_id = deactivated_business.owner_id 
        AND subscription_active = true
        AND id != deactivated_business.id
    ) INTO owner_has_active;
    
    -- Se não tem mais negócios ativos, remover roles de assinante
    IF NOT owner_has_active AND deactivated_business.owner_id IS NOT NULL THEN
      DELETE FROM user_roles 
      WHERE user_id = deactivated_business.owner_id 
        AND role IN ('business_owner', 'subscriber');
      
      -- Registrar no CRM
      INSERT INTO crm_interactions (user_id, interaction_type, channel, description, form_source, metadata)
      VALUES (
        deactivated_business.owner_id,
        'subscription_expired_auto',
        'system',
        'Assinatura expirada automaticamente. Negócio "' || deactivated_business.name || '" desativado do diretório. Roles removidas.',
        'deactivate_expired_businesses',
        jsonb_build_object(
          'business_id', deactivated_business.id,
          'business_name', deactivated_business.name,
          'roles_removed', ARRAY['business_owner', 'subscriber']
        )
      );
    END IF;
    
    -- Log de atividade
    INSERT INTO user_activity_log (user_id, activity_type, activity_description, metadata)
    VALUES (
      deactivated_business.owner_id,
      'business_deactivated',
      'Negócio "' || deactivated_business.name || '" desativado por expiração de assinatura',
      jsonb_build_object('business_id', deactivated_business.id, 'business_name', deactivated_business.name)
    );
  END LOOP;
  
  RETURN expired_count;
END;
$function$;

-- =====================================================
-- Fix 2: Create trigger to auto-remove roles when subscription_active changes to false
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_business_deactivation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  owner_has_active boolean;
BEGIN
  -- Only run when subscription_active changes from true to false
  IF OLD.subscription_active = true AND NEW.subscription_active = false AND NEW.is_complimentary = false THEN
    -- Check if owner has other active businesses
    SELECT EXISTS(
      SELECT 1 FROM businesses 
      WHERE owner_id = NEW.owner_id 
        AND subscription_active = true
        AND id != NEW.id
    ) INTO owner_has_active;
    
    -- If no more active businesses, remove roles
    IF NOT owner_has_active AND NEW.owner_id IS NOT NULL THEN
      DELETE FROM user_roles 
      WHERE user_id = NEW.owner_id 
        AND role IN ('business_owner', 'subscriber');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_handle_business_deactivation ON businesses;
CREATE TRIGGER trg_handle_business_deactivation
  AFTER UPDATE OF subscription_active ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION handle_business_deactivation();