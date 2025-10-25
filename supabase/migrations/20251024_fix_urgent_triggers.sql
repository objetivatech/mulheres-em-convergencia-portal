-- Correção urgente para triggers problemáticos
-- Data: 24 de outubro de 2025
-- Corrige erro: "record 'new' has no field 'user_id'"

-- =============================================================================
-- PROBLEMA: Trigger usa NEW.user_id mas tabela businesses usa owner_id
-- =============================================================================

-- Recriar função corrigida para negócios
CREATE OR REPLACE FUNCTION public.update_journey_on_business_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quando um negócio é criado, o usuário se torna ativo
  -- CORREÇÃO: usar NEW.owner_id em vez de NEW.user_id
  PERFORM public.update_user_journey_stage(
    NEW.owner_id,
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

-- Recriar trigger no businesses
DROP TRIGGER IF EXISTS trigger_update_journey_on_business ON public.businesses;
CREATE TRIGGER trigger_update_journey_on_business
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_journey_on_business_creation();

-- =============================================================================
-- VERIFICAR SE OUTROS TRIGGERS ESTÃO CORRETOS
-- =============================================================================

-- Função para profiles está correta (usa NEW.id)
-- Função para user_subscriptions está correta (usa NEW.user_id)

-- =============================================================================
-- COMENTÁRIOS
-- =============================================================================

COMMENT ON FUNCTION public.update_journey_on_business_creation() IS 'CORRIGIDO: Trigger function que atualiza jornada para active quando negócio é criado (usa owner_id)';
