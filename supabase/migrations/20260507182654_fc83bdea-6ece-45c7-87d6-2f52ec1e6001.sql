CREATE OR REPLACE FUNCTION public.deal_auto_register_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_email TEXT;
  v_phone TEXT;
  v_cpf TEXT;
  v_lead_cost_center UUID;
  v_existing UUID;
BEGIN
  IF NEW.event_id IS NULL OR NEW.auto_register = false THEN
    RETURN NEW;
  END IF;

  IF NEW.lead_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT full_name, email, phone, cpf, cost_center_id
    INTO v_full_name, v_email, v_phone, v_cpf, v_lead_cost_center
    FROM public.crm_leads
    WHERE id = NEW.lead_id;

  IF v_email IS NULL THEN
    RETURN NEW;
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
      NEW.event_id, NEW.lead_id, v_full_name, v_email, v_phone, v_cpf,
      'confirmed',
      CASE WHEN NEW.stage IN ('won', 'inscrito', 'participou', 'pago') THEN true ELSE false END,
      NEW.value, NEW.batch_id, COALESCE(NEW.cost_center_id, v_lead_cost_center),
      jsonb_build_object('auto_registered_from_deal', NEW.id)
    );
  ELSE
    UPDATE public.event_registrations
      SET batch_id = COALESCE(NEW.batch_id, batch_id),
          payment_amount = COALESCE(NEW.value, payment_amount),
          paid = CASE WHEN NEW.stage IN ('won', 'inscrito', 'participou', 'pago') THEN true ELSE paid END
      WHERE id = v_existing;
  END IF;

  RETURN NEW;
END;
$$;