-- Sistema de renovação de 31 dias para perfis de negócios
-- Adiciona campos para controlar a renovação de 31 dias

-- Atualizar tabela businesses para incluir controle de renovação
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS subscription_renewal_date DATE,
ADD COLUMN IF NOT EXISTS last_payment_date DATE,
ADD COLUMN IF NOT EXISTS grace_period_end DATE;

-- Criar função para renovar assinatura de negócios por 31 dias
CREATE OR REPLACE FUNCTION public.renew_business_subscription(business_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  renewal_date DATE;
  grace_end DATE;
BEGIN
  -- Calcular nova data de renovação (31 dias a partir de hoje)
  renewal_date := CURRENT_DATE + INTERVAL '31 days';
  grace_end := CURRENT_DATE + INTERVAL '31 days';
  
  -- Atualizar o negócio com nova data de renovação
  UPDATE businesses 
  SET 
    subscription_renewal_date = renewal_date,
    grace_period_end = grace_end,
    last_payment_date = CURRENT_DATE,
    subscription_active = true,
    subscription_expires_at = renewal_date + INTERVAL '23:59:59'
  WHERE id = business_uuid;
  
  -- Verificar se a atualização foi bem-sucedida
  IF FOUND THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- Criar função para verificar e desativar negócios expirados
CREATE OR REPLACE FUNCTION public.deactivate_expired_businesses()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  expired_count integer := 0;
BEGIN
  -- Desativar negócios onde o período de renovação expirou
  UPDATE businesses 
  SET subscription_active = false
  WHERE subscription_active = true 
    AND subscription_renewal_date IS NOT NULL
    AND subscription_renewal_date < CURRENT_DATE;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN expired_count;
END;
$$;

-- Criar função para processar pagamento e renovar automaticamente
CREATE OR REPLACE FUNCTION public.process_subscription_payment(
  p_user_id uuid,
  p_external_payment_id text,
  p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  subscription_record record;
  business_record record;
  renewal_count integer := 0;
BEGIN
  -- Buscar assinatura ativa do usuário
  SELECT * INTO subscription_record
  FROM user_subscriptions 
  WHERE user_id = p_user_id 
    AND status IN ('active', 'pending')
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nenhuma assinatura encontrada para o usuário'
    );
  END IF;
  
  -- Ativar assinatura se estava pendente
  IF subscription_record.status = 'pending' THEN
    UPDATE user_subscriptions 
    SET status = 'active'
    WHERE id = subscription_record.id;
  END IF;
  
  -- Renovar todos os negócios do usuário por 31 dias
  FOR business_record IN 
    SELECT id FROM businesses WHERE owner_id = p_user_id
  LOOP
    IF renew_business_subscription(business_record.id) THEN
      renewal_count := renewal_count + 1;
    END IF;
  END LOOP;
  
  -- Log da atividade
  PERFORM log_user_activity(
    p_user_id,
    'subscription_payment_processed',
    format('Pagamento processado e %s negócios renovados por 31 dias', renewal_count),
    jsonb_build_object(
      'external_payment_id', p_external_payment_id,
      'amount', p_amount,
      'businesses_renewed', renewal_count,
      'renewal_date', CURRENT_DATE + INTERVAL '31 days'
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'businesses_renewed', renewal_count,
    'renewal_date', CURRENT_DATE + INTERVAL '31 days',
    'subscription_id', subscription_record.id
  );
END;
$$;