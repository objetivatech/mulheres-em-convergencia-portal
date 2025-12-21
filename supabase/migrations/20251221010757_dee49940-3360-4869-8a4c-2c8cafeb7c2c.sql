-- =============================================
-- FUNÇÕES RPC PARA MÉTRICAS DO CRM
-- =============================================

-- 1. Calcular CAC (Custo de Aquisição de Cliente)
CREATE OR REPLACE FUNCTION public.calculate_cac(
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_customers INTEGER;
  v_marketing_spend DECIMAL;
BEGIN
  -- Conta novos leads convertidos no período
  SELECT COUNT(*) INTO v_new_customers
  FROM crm_leads
  WHERE status = 'converted'
    AND converted_at BETWEEN p_start_date AND p_end_date;
  
  -- Por enquanto, assume custo de marketing fixo por mês
  -- Em produção, isso viria de uma tabela de despesas
  v_marketing_spend := 5000.00;
  
  IF v_new_customers = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(v_marketing_spend / v_new_customers, 2);
END;
$$;

-- 2. Calcular LTV (Lifetime Value)
CREATE OR REPLACE FUNCTION public.calculate_ltv()
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg_value DECIMAL;
BEGIN
  -- Calcula o valor médio gerado por contato (doações + eventos pagos)
  SELECT COALESCE(AVG(total_value), 0) INTO v_avg_value
  FROM (
    SELECT 
      cpf,
      COALESCE(SUM(d.amount), 0) + COALESCE(SUM(er.payment_amount), 0) AS total_value
    FROM (
      SELECT DISTINCT cpf FROM crm_leads WHERE cpf IS NOT NULL
      UNION
      SELECT DISTINCT cpf FROM profiles WHERE cpf IS NOT NULL
    ) contacts
    LEFT JOIN donations d ON d.cpf = contacts.cpf AND d.status = 'confirmed'
    LEFT JOIN event_registrations er ON er.cpf = contacts.cpf AND er.paid = true
    GROUP BY contacts.cpf
    HAVING COALESCE(SUM(d.amount), 0) + COALESCE(SUM(er.payment_amount), 0) > 0
  ) subq;
  
  RETURN COALESCE(ROUND(v_avg_value, 2), 0);
END;
$$;

-- 3. Calcular Churn Rate
CREATE OR REPLACE FUNCTION public.calculate_churn_rate(
  p_period_months INTEGER DEFAULT 3
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_start INTEGER;
  v_lost INTEGER;
BEGIN
  -- Total de leads ativos no início do período
  SELECT COUNT(*) INTO v_total_start
  FROM crm_leads
  WHERE created_at < (CURRENT_DATE - (p_period_months || ' months')::INTERVAL)
    AND status NOT IN ('lost', 'converted');
  
  -- Leads que foram perdidos durante o período
  SELECT COUNT(*) INTO v_lost
  FROM crm_leads
  WHERE status = 'lost'
    AND updated_at >= (CURRENT_DATE - (p_period_months || ' months')::INTERVAL);
  
  IF v_total_start = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((v_lost::DECIMAL / v_total_start) * 100, 2);
END;
$$;

-- 4. Estatísticas do Funil de Vendas
CREATE OR REPLACE FUNCTION public.get_funnel_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'lead', (SELECT COUNT(*) FROM crm_deals WHERE stage = 'lead'),
    'qualified', (SELECT COUNT(*) FROM crm_deals WHERE stage = 'qualified'),
    'proposal', (SELECT COUNT(*) FROM crm_deals WHERE stage = 'proposal'),
    'negotiation', (SELECT COUNT(*) FROM crm_deals WHERE stage = 'negotiation'),
    'won', (SELECT COUNT(*) FROM crm_deals WHERE stage = 'won'),
    'lost', (SELECT COUNT(*) FROM crm_deals WHERE stage = 'lost'),
    'total_value_active', (
      SELECT COALESCE(SUM(value), 0) 
      FROM crm_deals 
      WHERE stage NOT IN ('won', 'lost')
    ),
    'total_value_won', (
      SELECT COALESCE(SUM(value), 0) 
      FROM crm_deals 
      WHERE stage = 'won'
    ),
    'avg_days_to_close', (
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (closed_at - created_at)) / 86400), 0)::INTEGER
      FROM crm_deals 
      WHERE closed_at IS NOT NULL
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 5. Jornada completa por CPF
CREATE OR REPLACE FUNCTION public.get_journey_by_cpf(p_cpf TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_contact_info JSON;
  v_interactions JSON;
  v_milestones JSON;
  v_events JSON;
  v_donations JSON;
  v_summary JSON;
BEGIN
  -- Info do contato
  SELECT json_build_object(
    'cpf', COALESCE(l.cpf, p.cpf),
    'name', COALESCE(p.full_name, l.full_name),
    'email', COALESCE(p.email, l.email),
    'phone', COALESCE(p.phone, l.phone),
    'is_user', p.id IS NOT NULL,
    'is_lead', l.id IS NOT NULL,
    'lead_status', l.status,
    'created_at', LEAST(l.created_at, p.created_at)
  ) INTO v_contact_info
  FROM (SELECT p_cpf AS cpf) input
  LEFT JOIN crm_leads l ON l.cpf = input.cpf
  LEFT JOIN profiles p ON p.cpf = input.cpf;
  
  -- Interações
  SELECT json_agg(
    json_build_object(
      'id', id,
      'type', interaction_type,
      'channel', channel,
      'description', description,
      'activity_name', activity_name,
      'activity_paid', activity_paid,
      'activity_online', activity_online,
      'created_at', created_at
    ) ORDER BY created_at
  ) INTO v_interactions
  FROM crm_interactions
  WHERE cpf = p_cpf;
  
  -- Marcos de conversão
  SELECT json_agg(
    json_build_object(
      'type', milestone_type,
      'name', milestone_name,
      'date', milestone_date,
      'activities_count', activities_count,
      'days_from_first_contact', days_from_first_contact,
      'total_value', total_value
    ) ORDER BY milestone_date
  ) INTO v_milestones
  FROM crm_conversion_milestones
  WHERE cpf = p_cpf;
  
  -- Eventos
  SELECT json_agg(
    json_build_object(
      'id', er.id,
      'event_title', e.title,
      'event_type', e.type,
      'event_format', e.format,
      'event_date', e.date_start,
      'status', er.status,
      'paid', er.paid,
      'checked_in', er.checked_in_at IS NOT NULL,
      'created_at', er.created_at
    ) ORDER BY e.date_start
  ) INTO v_events
  FROM event_registrations er
  JOIN events e ON e.id = er.event_id
  WHERE er.cpf = p_cpf;
  
  -- Doações
  SELECT json_agg(
    json_build_object(
      'id', id,
      'amount', amount,
      'type', type,
      'campaign', campaign,
      'status', status,
      'created_at', created_at
    ) ORDER BY created_at
  ) INTO v_donations
  FROM donations
  WHERE cpf = p_cpf;
  
  -- Resumo
  SELECT json_build_object(
    'total_interactions', (SELECT COUNT(*) FROM crm_interactions WHERE cpf = p_cpf),
    'total_events', (SELECT COUNT(*) FROM event_registrations WHERE cpf = p_cpf),
    'events_attended', (SELECT COUNT(*) FROM event_registrations WHERE cpf = p_cpf AND checked_in_at IS NOT NULL),
    'total_donations', (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE cpf = p_cpf AND status = 'confirmed'),
    'first_contact', (SELECT MIN(created_at) FROM crm_interactions WHERE cpf = p_cpf),
    'last_activity', (SELECT MAX(created_at) FROM crm_interactions WHERE cpf = p_cpf),
    'days_as_contact', (
      SELECT EXTRACT(DAY FROM (CURRENT_TIMESTAMP - MIN(created_at)))::INTEGER 
      FROM crm_interactions WHERE cpf = p_cpf
    )
  ) INTO v_summary;
  
  -- Resultado final
  SELECT json_build_object(
    'contact', v_contact_info,
    'summary', v_summary,
    'interactions', COALESCE(v_interactions, '[]'::JSON),
    'milestones', COALESCE(v_milestones, '[]'::JSON),
    'events', COALESCE(v_events, '[]'::JSON),
    'donations', COALESCE(v_donations, '[]'::JSON)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 6. Stats gerais do CRM
CREATE OR REPLACE FUNCTION public.get_crm_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'leads', json_build_object(
      'total', (SELECT COUNT(*) FROM crm_leads),
      'new', (SELECT COUNT(*) FROM crm_leads WHERE status = 'new'),
      'contacted', (SELECT COUNT(*) FROM crm_leads WHERE status = 'contacted'),
      'qualified', (SELECT COUNT(*) FROM crm_leads WHERE status = 'qualified'),
      'converted', (SELECT COUNT(*) FROM crm_leads WHERE status = 'converted'),
      'lost', (SELECT COUNT(*) FROM crm_leads WHERE status = 'lost'),
      'this_month', (SELECT COUNT(*) FROM crm_leads WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))
    ),
    'deals', json_build_object(
      'total', (SELECT COUNT(*) FROM crm_deals),
      'active', (SELECT COUNT(*) FROM crm_deals WHERE stage NOT IN ('won', 'lost')),
      'won', (SELECT COUNT(*) FROM crm_deals WHERE stage = 'won'),
      'lost', (SELECT COUNT(*) FROM crm_deals WHERE stage = 'lost'),
      'total_value', (SELECT COALESCE(SUM(value), 0) FROM crm_deals WHERE stage NOT IN ('won', 'lost')),
      'won_value', (SELECT COALESCE(SUM(value), 0) FROM crm_deals WHERE stage = 'won')
    ),
    'interactions', json_build_object(
      'total', (SELECT COUNT(*) FROM crm_interactions),
      'this_month', (SELECT COUNT(*) FROM crm_interactions WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)),
      'by_type', (
        SELECT json_object_agg(interaction_type, cnt)
        FROM (
          SELECT interaction_type, COUNT(*) as cnt
          FROM crm_interactions
          GROUP BY interaction_type
        ) sub
      )
    ),
    'events', json_build_object(
      'total', (SELECT COUNT(*) FROM events),
      'upcoming', (SELECT COUNT(*) FROM events WHERE date_start > CURRENT_TIMESTAMP AND status = 'published'),
      'registrations', (SELECT COUNT(*) FROM event_registrations),
      'attendance_rate', (
        SELECT ROUND(
          (COUNT(*) FILTER (WHERE checked_in_at IS NOT NULL)::DECIMAL / 
           NULLIF(COUNT(*) FILTER (WHERE status = 'confirmed'), 0)) * 100, 2
        )
        FROM event_registrations
      )
    ),
    'donations', json_build_object(
      'total_amount', (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE status = 'confirmed'),
      'count', (SELECT COUNT(*) FROM donations WHERE status = 'confirmed'),
      'unique_donors', (SELECT COUNT(DISTINCT cpf) FROM donations WHERE status = 'confirmed'),
      'this_month', (
        SELECT COALESCE(SUM(amount), 0) 
        FROM donations 
        WHERE status = 'confirmed' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
      )
    ),
    'conversion_rate', (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE status = 'converted')::DECIMAL / 
         NULLIF(COUNT(*), 0)) * 100, 2
      )
      FROM crm_leads
    ),
    'cac', public.calculate_cac(),
    'ltv', public.calculate_ltv(),
    'churn_rate', public.calculate_churn_rate(3)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Permissões para as funções
GRANT EXECUTE ON FUNCTION public.calculate_cac TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_ltv TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_churn_rate TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_funnel_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_journey_by_cpf TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_crm_stats TO authenticated;