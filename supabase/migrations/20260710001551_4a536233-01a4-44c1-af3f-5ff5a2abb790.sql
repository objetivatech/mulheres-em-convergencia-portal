
-- ============================================================
-- FASE 1 + 3 + 4: Reconciliação de assinaturas × negócios
-- ============================================================

-- Fase 3: Refatorar process_subscription_payment
CREATE OR REPLACE FUNCTION public.process_subscription_payment(
  p_user_id uuid,
  p_external_payment_id text,
  p_amount numeric,
  p_subscription_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  subscription_record record;
  business_record record;
  renewal_count integer := 0;
  has_complimentary boolean;
BEGIN
  -- Se o usuário tem negócio cortesia, não processar como assinatura normal
  SELECT EXISTS(
    SELECT 1 FROM businesses WHERE owner_id = p_user_id AND is_complimentary = true
  ) INTO has_complimentary;

  IF has_complimentary THEN
    RETURN jsonb_build_object('success', true, 'skipped', 'complimentary_user');
  END IF;

  -- Preferir a assinatura explicitamente informada (pela linha que o webhook casou)
  IF p_subscription_id IS NOT NULL THEN
    SELECT * INTO subscription_record
    FROM user_subscriptions
    WHERE id = p_subscription_id
    LIMIT 1;
  END IF;

  -- Fallback: qualquer assinatura active/pending mais recente
  IF NOT FOUND OR subscription_record IS NULL THEN
    SELECT * INTO subscription_record
    FROM user_subscriptions
    WHERE user_id = p_user_id
      AND status IN ('active', 'pending')
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- Último fallback: qualquer assinatura mais recente (mesmo cancelled/expired)
  -- pois recebemos PAGAMENTO real do Asaas
  IF NOT FOUND OR subscription_record IS NULL THEN
    SELECT * INTO subscription_record
    FROM user_subscriptions
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- Ativar a assinatura escolhida se ainda não estiver ativa
  IF subscription_record.id IS NOT NULL AND subscription_record.status != 'active' THEN
    UPDATE user_subscriptions
    SET status = 'active', updated_at = now()
    WHERE id = subscription_record.id;
  END IF;

  -- Marcar outras assinaturas ativas/pending do mesmo usuário como 'superseded'
  IF subscription_record.id IS NOT NULL THEN
    UPDATE user_subscriptions
    SET status = 'superseded', updated_at = now()
    WHERE user_id = p_user_id
      AND id != subscription_record.id
      AND status IN ('active', 'pending');
  END IF;

  -- Renovar TODOS os negócios do usuário (não-cortesia) por 31 dias
  FOR business_record IN
    SELECT id FROM businesses WHERE owner_id = p_user_id AND COALESCE(is_complimentary, false) = false
  LOOP
    IF renew_business_subscription(business_record.id) THEN
      renewal_count := renewal_count + 1;
    END IF;
  END LOOP;

  -- Alertar em log se nenhum negócio foi renovado
  IF renewal_count = 0 THEN
    RAISE WARNING 'process_subscription_payment: usuário % recebeu pagamento % mas nenhum negócio foi renovado', p_user_id, p_external_payment_id;
    INSERT INTO crm_interactions (user_id, interaction_type, channel, description, form_source, metadata)
    VALUES (
      p_user_id,
      'payment_no_business_renewed',
      'system',
      'Pagamento recebido mas nenhum negócio foi renovado. Verificar consistência de dados.',
      'process_subscription_payment',
      jsonb_build_object(
        'external_payment_id', p_external_payment_id,
        'amount', p_amount,
        'subscription_id', subscription_record.id
      )
    );
  END IF;

  -- Log
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

-- ============================================================
-- FASE 4: Reconciliador de consistência
-- ============================================================
CREATE OR REPLACE FUNCTION public.reconcile_subscription_business_consistency()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fixed_active_biz_off integer := 0;
  fixed_duplicates integer := 0;
  fixed_recent_payment integer := 0;
  r record;
BEGIN
  -- Caso A: assinatura ACTIVE mas negócio INACTIVE (não cortesia)
  FOR r IN
    SELECT DISTINCT b.id AS business_id, b.owner_id
    FROM businesses b
    JOIN user_subscriptions us ON us.user_id = b.owner_id
    WHERE us.status = 'active'
      AND b.subscription_active = false
      AND COALESCE(b.is_complimentary, false) = false
  LOOP
    IF renew_business_subscription(r.business_id) THEN
      fixed_active_biz_off := fixed_active_biz_off + 1;
      -- Garantir roles
      INSERT INTO user_roles (user_id, role)
      VALUES (r.owner_id, 'business_owner')
      ON CONFLICT (user_id, role) DO NOTHING;
      INSERT INTO user_roles (user_id, role)
      VALUES (r.owner_id, 'subscriber')
      ON CONFLICT (user_id, role) DO NOTHING;

      INSERT INTO crm_interactions (user_id, interaction_type, channel, description, form_source, metadata)
      VALUES (
        r.owner_id,
        'auto_reconciliation',
        'system',
        'Reconciliação automática: negócio reativado (assinatura ativa mas negócio inativo).',
        'reconcile_subscription_business_consistency',
        jsonb_build_object('business_id', r.business_id)
      );
    END IF;
  END LOOP;

  -- Caso B: múltiplas assinaturas ACTIVE por usuário — manter só a mais recente
  FOR r IN
    SELECT user_id, array_agg(id ORDER BY created_at DESC) AS ids
    FROM user_subscriptions
    WHERE status = 'active'
    GROUP BY user_id
    HAVING count(*) > 1
  LOOP
    UPDATE user_subscriptions
    SET status = 'superseded', updated_at = now()
    WHERE id = ANY(r.ids[2:]);
    fixed_duplicates := fixed_duplicates + array_length(r.ids, 1) - 1;

    INSERT INTO crm_interactions (user_id, interaction_type, channel, description, form_source, metadata)
    VALUES (
      r.user_id,
      'auto_reconciliation',
      'system',
      format('Reconciliação: %s assinaturas duplicadas marcadas como superseded.', array_length(r.ids, 1) - 1),
      'reconcile_subscription_business_consistency',
      jsonb_build_object('kept_subscription_id', r.ids[1], 'superseded_ids', r.ids[2:])
    );
  END LOOP;

  -- Caso C: pagamento CRM recente confirmado (últimos 7 dias) + negócio inativo
  FOR r IN
    SELECT DISTINCT b.id AS business_id, b.owner_id
    FROM businesses b
    JOIN crm_interactions ci ON ci.user_id = b.owner_id
    WHERE ci.interaction_type IN ('subscription_payment_confirmed', 'payment_received')
      AND ci.created_at > now() - INTERVAL '7 days'
      AND b.subscription_active = false
      AND COALESCE(b.is_complimentary, false) = false
  LOOP
    IF renew_business_subscription(r.business_id) THEN
      fixed_recent_payment := fixed_recent_payment + 1;
      INSERT INTO user_roles (user_id, role) VALUES (r.owner_id, 'business_owner')
        ON CONFLICT (user_id, role) DO NOTHING;
      INSERT INTO user_roles (user_id, role) VALUES (r.owner_id, 'subscriber')
        ON CONFLICT (user_id, role) DO NOTHING;

      INSERT INTO crm_interactions (user_id, interaction_type, channel, description, form_source, metadata)
      VALUES (
        r.owner_id,
        'auto_reconciliation',
        'system',
        'Reconciliação: negócio reativado após pagamento recente confirmado.',
        'reconcile_subscription_business_consistency',
        jsonb_build_object('business_id', r.business_id)
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'fixed_active_business_off', fixed_active_biz_off,
    'fixed_duplicates', fixed_duplicates,
    'fixed_recent_payment', fixed_recent_payment
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reconcile_subscription_business_consistency() TO service_role;
GRANT EXECUTE ON FUNCTION public.process_subscription_payment(uuid, text, numeric, uuid) TO service_role, authenticated;

-- ============================================================
-- FASE 5: View única de status
-- ============================================================
CREATE OR REPLACE VIEW public.v_subscriber_status
WITH (security_invoker=on) AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.email,
  p.cpf,
  b.id AS business_id,
  b.name AS business_name,
  b.subscription_active AS business_active,
  b.subscription_renewal_date,
  b.subscription_expires_at,
  b.is_complimentary,
  us.id AS subscription_id,
  us.status AS subscription_status,
  us.external_subscription_id,
  us.billing_cycle,
  us.expires_at AS subscription_expires,
  CASE
    WHEN b.is_complimentary THEN 'complimentary'
    WHEN us.status = 'active' AND b.subscription_active = true THEN 'healthy'
    WHEN us.status = 'active' AND b.subscription_active = false THEN 'inconsistent_active_off'
    WHEN us.status IN ('cancelled','expired') AND b.subscription_active = true
         AND b.subscription_renewal_date + INTERVAL '5 days' > CURRENT_DATE THEN 'grace_period'
    WHEN us.status IN ('cancelled','expired') AND b.subscription_active = false THEN 'inactive'
    ELSE 'unknown'
  END AS health_status
FROM profiles p
LEFT JOIN businesses b ON b.owner_id = p.id
LEFT JOIN LATERAL (
  SELECT * FROM user_subscriptions us2
  WHERE us2.user_id = p.id
  ORDER BY CASE WHEN us2.status = 'active' THEN 0 ELSE 1 END, us2.created_at DESC
  LIMIT 1
) us ON true
WHERE b.id IS NOT NULL OR us.id IS NOT NULL;

GRANT SELECT ON public.v_subscriber_status TO authenticated, service_role;

-- ============================================================
-- FASE 1: Correção imediata Luciana e Paola
-- ============================================================
DO $$
DECLARE
  luciana_id uuid;
  paola_id uuid;
  biz_id uuid;
BEGIN
  SELECT id INTO luciana_id FROM profiles WHERE full_name ILIKE '%Luciana Bettoni%' LIMIT 1;
  SELECT id INTO paola_id FROM profiles WHERE full_name ILIKE '%Paola Dias%' LIMIT 1;

  -- Luciana: marcar antigas como superseded, ativar a mais recente
  IF luciana_id IS NOT NULL THEN
    UPDATE user_subscriptions
    SET status = 'superseded', updated_at = now()
    WHERE user_id = luciana_id
      AND id NOT IN (
        SELECT id FROM user_subscriptions WHERE user_id = luciana_id ORDER BY created_at DESC LIMIT 1
      );

    UPDATE user_subscriptions
    SET status = 'active', updated_at = now()
    WHERE user_id = luciana_id
      AND id IN (SELECT id FROM user_subscriptions WHERE user_id = luciana_id ORDER BY created_at DESC LIMIT 1);

    FOR biz_id IN SELECT id FROM businesses WHERE owner_id = luciana_id AND COALESCE(is_complimentary, false) = false
    LOOP
      PERFORM renew_business_subscription(biz_id);
    END LOOP;

    INSERT INTO user_roles (user_id, role) VALUES (luciana_id, 'business_owner') ON CONFLICT DO NOTHING;
    INSERT INTO user_roles (user_id, role) VALUES (luciana_id, 'subscriber') ON CONFLICT DO NOTHING;
  END IF;

  -- Paola: renovar business
  IF paola_id IS NOT NULL THEN
    FOR biz_id IN SELECT id FROM businesses WHERE owner_id = paola_id AND COALESCE(is_complimentary, false) = false
    LOOP
      PERFORM renew_business_subscription(biz_id);
    END LOOP;
    INSERT INTO user_roles (user_id, role) VALUES (paola_id, 'business_owner') ON CONFLICT DO NOTHING;
    INSERT INTO user_roles (user_id, role) VALUES (paola_id, 'subscriber') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Rodar reconciliador uma vez para pegar outros casos
SELECT public.reconcile_subscription_business_consistency();
