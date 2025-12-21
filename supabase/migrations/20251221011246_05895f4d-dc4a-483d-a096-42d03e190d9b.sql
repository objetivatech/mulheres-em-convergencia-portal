-- =============================================
-- TRIGGER PARA REGISTRAR SIGNUP NO CRM
-- =============================================

-- Função que registra interação de signup quando um usuário é criado
CREATE OR REPLACE FUNCTION public.register_signup_crm_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cpf TEXT;
  v_lead_id UUID;
BEGIN
  -- Obtém o CPF do novo perfil
  v_cpf := NEW.cpf;
  
  -- Busca se existe um lead com esse CPF
  SELECT id INTO v_lead_id
  FROM crm_leads
  WHERE cpf = v_cpf
  LIMIT 1;
  
  -- Registra a interação de signup
  INSERT INTO crm_interactions (
    user_id,
    cpf,
    lead_id,
    interaction_type,
    channel,
    description,
    form_source,
    activity_name,
    activity_online,
    activity_paid
  ) VALUES (
    NEW.id,
    v_cpf,
    v_lead_id,
    'signup',
    'website',
    'Usuário criou conta no sistema',
    'auth',
    'Cadastro',
    true,
    false
  );
  
  -- Se existir um lead, marca como convertido
  IF v_lead_id IS NOT NULL THEN
    UPDATE crm_leads
    SET 
      status = 'converted',
      converted_at = NOW(),
      converted_user_id = NEW.id,
      updated_at = NOW()
    WHERE id = v_lead_id;
    
    -- Registra milestone de conversão
    INSERT INTO crm_conversion_milestones (
      cpf,
      user_id,
      email,
      milestone_type,
      milestone_name,
      milestone_date,
      activities_count,
      days_from_first_contact,
      triggered_by
    )
    SELECT
      v_cpf,
      NEW.id,
      NEW.email,
      'signup',
      'Conversão para Usuário',
      NOW(),
      (SELECT COUNT(*) FROM crm_interactions WHERE cpf = v_cpf),
      EXTRACT(DAY FROM (NOW() - l.created_at))::INTEGER,
      'trigger'
    FROM crm_leads l
    WHERE l.id = v_lead_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Cria o trigger no profiles (após insert)
DROP TRIGGER IF EXISTS on_profile_created_register_crm ON profiles;
CREATE TRIGGER on_profile_created_register_crm
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.register_signup_crm_interaction();

-- =============================================
-- FUNÇÃO PARA INTEGRAR NEWSLETTER COM CRM
-- =============================================

CREATE OR REPLACE FUNCTION public.register_newsletter_crm_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id UUID;
BEGIN
  -- Busca ou cria lead pelo email
  SELECT id INTO v_lead_id
  FROM crm_leads
  WHERE email = NEW.email
  LIMIT 1;
  
  IF v_lead_id IS NULL THEN
    -- Cria novo lead
    INSERT INTO crm_leads (
      full_name,
      email,
      source,
      source_detail,
      status,
      first_activity_type,
      first_activity_date,
      first_activity_online,
      first_activity_paid
    ) VALUES (
      COALESCE(NEW.name, split_part(NEW.email, '@', 1)),
      NEW.email,
      'website',
      'newsletter',
      'new',
      'newsletter_subscription',
      NOW(),
      true,
      false
    )
    RETURNING id INTO v_lead_id;
  END IF;
  
  -- Registra interação
  INSERT INTO crm_interactions (
    lead_id,
    interaction_type,
    channel,
    description,
    form_source,
    activity_name,
    activity_online,
    activity_paid
  ) VALUES (
    v_lead_id,
    'newsletter_subscription',
    'website',
    'Inscrito na newsletter',
    'newsletter',
    'Newsletter',
    true,
    false
  );
  
  RETURN NEW;
END;
$$;

-- Cria o trigger na tabela de newsletter
DROP TRIGGER IF EXISTS on_newsletter_subscription_register_crm ON newsletter_subscribers;
CREATE TRIGGER on_newsletter_subscription_register_crm
  AFTER INSERT ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.register_newsletter_crm_interaction();