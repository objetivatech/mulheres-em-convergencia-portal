-- Atualizar valores dos planos de assinatura
UPDATE subscription_plans SET 
  price_monthly = 39.90,
  price_yearly = ROUND(39.90 * 12 * 0.8, 2), -- 20% desconto anual
  updated_at = now()
WHERE name = 'iniciante';

UPDATE subscription_plans SET 
  price_monthly = 74.90,
  price_yearly = ROUND(74.90 * 12 * 0.8, 2), -- 20% desconto anual
  updated_at = now()
WHERE name = 'intermediario';

UPDATE subscription_plans SET 
  name = 'impulso',
  display_name = 'Plano Impulso',
  price_monthly = 139.90,
  price_yearly = ROUND(139.90 * 12 * 0.8, 2), -- 20% desconto anual
  updated_at = now()
WHERE name = 'master';

-- Adicionar coluna para preço semestral nos planos
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS price_6monthly NUMERIC DEFAULT 0;

-- Calcular preços semestrais com 15% de desconto
UPDATE subscription_plans SET 
  price_6monthly = ROUND(price_monthly * 6 * 0.85, 2),
  updated_at = now();

-- Atualizar user_subscriptions para suportar billing_cycle semestral
-- Verificar se já existe o tipo '6-monthly'
DO $$
BEGIN
  -- Atualizar apenas se '6-monthly' não existir
  IF NOT EXISTS (SELECT 1 FROM user_subscriptions WHERE billing_cycle = '6-monthly') THEN
    -- Este será adicionado via código, apenas garantindo que a tabela suporta
    NULL;
  END IF;
END $$;

-- Corrigir função is_valid_uuid que está causando erros nas avaliações
CREATE OR REPLACE FUNCTION public.is_valid_uuid(uuid_string text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Return false for null or empty strings
  IF uuid_string IS NULL OR uuid_string = '' THEN
    RETURN false;
  END IF;
  
  -- Try to cast to UUID, return false if it fails
  PERFORM uuid_string::uuid;
  RETURN true;
EXCEPTION 
  WHEN invalid_text_representation THEN
    RETURN false;
  WHEN OTHERS THEN
    RETURN false;
END;
$function$;