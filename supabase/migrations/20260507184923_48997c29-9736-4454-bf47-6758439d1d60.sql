-- Recalcula a quantidade oficial de inscritos confirmados/presentes de um evento
CREATE OR REPLACE FUNCTION public.recalculate_event_current_participants(_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _event_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.events e
  SET current_participants = COALESCE((
    SELECT COUNT(*)::integer
    FROM public.event_registrations r
    WHERE r.event_id = _event_id
      AND r.status IN ('confirmed', 'attended')
  ), 0)
  WHERE e.id = _event_id;
END;
$$;

-- Torna o contador resiliente: sempre recalcula a partir da fonte real, em vez de somar/subtrair incrementalmente
CREATE OR REPLACE FUNCTION public.update_event_participants_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.recalculate_event_current_participants(NEW.event_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.event_id IS DISTINCT FROM NEW.event_id THEN
      PERFORM public.recalculate_event_current_participants(OLD.event_id);
    END IF;
    PERFORM public.recalculate_event_current_participants(NEW.event_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_event_current_participants(OLD.event_id);
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Inscrição automática pelo pipeline, com suporte a negócios criados diretamente no pipeline
CREATE OR REPLACE FUNCTION public.deal_auto_register_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_full_name TEXT;
  v_email TEXT;
  v_phone TEXT;
  v_cpf TEXT;
  v_lead_cost_center UUID;
  v_lead_id UUID;
  v_existing UUID;
BEGIN
  IF NEW.event_id IS NULL OR NEW.auto_register = false THEN
    RETURN NEW;
  END IF;

  v_lead_id := NEW.lead_id;

  IF v_lead_id IS NOT NULL THEN
    SELECT full_name, email, phone, cpf, cost_center_id
      INTO v_full_name, v_email, v_phone, v_cpf, v_lead_cost_center
      FROM public.crm_leads
      WHERE id = v_lead_id;
  END IF;

  -- Fallback para negócios criados diretamente no pipeline: dados salvos no metadata pelo formulário
  v_full_name := COALESCE(NULLIF(v_full_name, ''), NULLIF(NEW.metadata->'event_auto_registration'->>'full_name', ''), NULLIF(NEW.title, ''));
  v_email := COALESCE(NULLIF(v_email, ''), NULLIF(NEW.metadata->'event_auto_registration'->>'email', ''));
  v_phone := COALESCE(NULLIF(v_phone, ''), NULLIF(NEW.metadata->'event_auto_registration'->>'phone', ''));
  v_cpf := COALESCE(NULLIF(v_cpf, ''), NULLIF(regexp_replace(COALESCE(NEW.metadata->'event_auto_registration'->>'cpf', NEW.cpf, ''), '\D', '', 'g'), ''));

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Para inscrever automaticamente no evento, informe um lead/contato com email ou preencha o email do participante no negócio.';
  END IF;

  IF v_lead_id IS NULL THEN
    SELECT id INTO v_lead_id
      FROM public.crm_leads
      WHERE (v_cpf IS NOT NULL AND cpf = v_cpf)
         OR lower(email) = lower(v_email)
      ORDER BY created_at ASC
      LIMIT 1;

    IF v_lead_id IS NULL THEN
      INSERT INTO public.crm_leads (
        full_name, email, phone, cpf, source, source_detail, status,
        first_activity_type, first_activity_date, cost_center_id
      ) VALUES (
        COALESCE(v_full_name, NEW.title, 'Participante'), v_email, v_phone, v_cpf,
        'pipeline', 'Inscrição automática em evento', 'new',
        'event_registration', now(), COALESCE(NEW.cost_center_id, v_lead_cost_center)
      )
      RETURNING id INTO v_lead_id;
    END IF;

    UPDATE public.crm_deals
      SET lead_id = v_lead_id
      WHERE id = NEW.id
        AND lead_id IS NULL;
  END IF;

  SELECT id INTO v_existing
    FROM public.event_registrations
    WHERE event_id = NEW.event_id
      AND lower(email) = lower(v_email)
    LIMIT 1;

  IF v_existing IS NULL THEN
    INSERT INTO public.event_registrations (
      event_id, lead_id, full_name, email, phone, cpf,
      status, paid, payment_amount, batch_id, cost_center_id, metadata
    ) VALUES (
      NEW.event_id, v_lead_id, COALESCE(v_full_name, NEW.title, 'Participante'), v_email, v_phone, v_cpf,
      'confirmed',
      CASE WHEN lower(COALESCE(NEW.stage, '')) IN ('won', 'ganho', 'inscrito', 'participou', 'pago') THEN true ELSE false END,
      NEW.value, NEW.batch_id, COALESCE(NEW.cost_center_id, v_lead_cost_center),
      jsonb_build_object('auto_registered_from_deal', NEW.id)
    );
  ELSE
    UPDATE public.event_registrations
      SET lead_id = COALESCE(lead_id, v_lead_id),
          full_name = COALESCE(NULLIF(full_name, ''), COALESCE(v_full_name, NEW.title, 'Participante')),
          phone = COALESCE(phone, v_phone),
          cpf = COALESCE(cpf, v_cpf),
          status = CASE WHEN status = 'cancelled' THEN 'confirmed' ELSE status END,
          batch_id = COALESCE(NEW.batch_id, batch_id),
          payment_amount = COALESCE(NEW.value, payment_amount),
          paid = CASE WHEN lower(COALESCE(NEW.stage, '')) IN ('won', 'ganho', 'inscrito', 'participou', 'pago') THEN true ELSE paid END,
          metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('auto_registered_from_deal', NEW.id)
      WHERE id = v_existing;
  END IF;

  PERFORM public.recalculate_event_current_participants(NEW.event_id);
  RETURN NEW;
END;
$$;

-- Garante que o trigger atual use a função recalculada
DROP TRIGGER IF EXISTS update_event_participants ON public.event_registrations;
CREATE TRIGGER update_event_participants
AFTER INSERT OR DELETE OR UPDATE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_event_participants_count();

-- Backfill: corrige eventos já existentes que ficaram com contador desatualizado
UPDATE public.events e
SET current_participants = COALESCE(c.confirmed_count, 0)
FROM (
  SELECT event_id, COUNT(*)::integer AS confirmed_count
  FROM public.event_registrations
  WHERE status IN ('confirmed', 'attended')
  GROUP BY event_id
) c
WHERE e.id = c.event_id;

UPDATE public.events e
SET current_participants = 0
WHERE NOT EXISTS (
  SELECT 1
  FROM public.event_registrations r
  WHERE r.event_id = e.id
    AND r.status IN ('confirmed', 'attended')
);