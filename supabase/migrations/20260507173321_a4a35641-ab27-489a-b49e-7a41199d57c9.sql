
-- ============================================================
-- EVENT SPEAKERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'palestrante',
  bio TEXT,
  photo_url TEXT,
  linkedin_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_speakers_event_id_idx ON public.event_speakers(event_id);

ALTER TABLE public.event_speakers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view speakers of published events"
  ON public.event_speakers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_speakers.event_id AND e.status = 'published'
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins manage speakers"
  ON public.event_speakers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_event_speakers_updated_at
  BEFORE UPDATE ON public.event_speakers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mantém events.instructor_name retro-compatível (primeiro speaker)
CREATE OR REPLACE FUNCTION public.sync_event_primary_speaker()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_first_name TEXT;
BEGIN
  v_event_id := COALESCE(NEW.event_id, OLD.event_id);
  SELECT name INTO v_first_name
    FROM public.event_speakers
    WHERE event_id = v_event_id
    ORDER BY display_order ASC, created_at ASC
    LIMIT 1;
  UPDATE public.events SET instructor_name = v_first_name WHERE id = v_event_id;
  RETURN NULL;
END;
$$;

CREATE TRIGGER event_speakers_sync_primary
  AFTER INSERT OR UPDATE OR DELETE ON public.event_speakers
  FOR EACH ROW EXECUTE FUNCTION public.sync_event_primary_speaker();

-- ============================================================
-- EVENT TICKET BATCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_ticket_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER,
  sold_count INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_ticket_batches_event_id_idx ON public.event_ticket_batches(event_id);

ALTER TABLE public.event_ticket_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active batches of published events"
  ON public.event_ticket_batches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_ticket_batches.event_id AND e.status = 'published'
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins manage batches"
  ON public.event_ticket_batches FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_event_ticket_batches_updated_at
  BEFORE UPDATE ON public.event_ticket_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- REGISTRATIONS: batch_id
-- ============================================================
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.event_ticket_batches(id) ON DELETE SET NULL;

-- Trigger: atualiza sold_count do lote quando paid muda para true
CREATE OR REPLACE FUNCTION public.sync_batch_sold_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Increment when registration becomes paid
  IF NEW.batch_id IS NOT NULL AND NEW.paid = true
     AND (TG_OP = 'INSERT' OR COALESCE(OLD.paid, false) = false) THEN
    UPDATE public.event_ticket_batches
      SET sold_count = sold_count + 1
      WHERE id = NEW.batch_id;
  END IF;
  -- Decrement when paid reverts to false
  IF TG_OP = 'UPDATE' AND OLD.batch_id IS NOT NULL
     AND OLD.paid = true AND NEW.paid = false THEN
    UPDATE public.event_ticket_batches
      SET sold_count = GREATEST(0, sold_count - 1)
      WHERE id = OLD.batch_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS event_registrations_sync_batch_count ON public.event_registrations;
CREATE TRIGGER event_registrations_sync_batch_count
  AFTER INSERT OR UPDATE OF paid, batch_id ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.sync_batch_sold_count();

-- ============================================================
-- CRM_DEALS: event_id + auto_register
-- ============================================================
ALTER TABLE public.crm_deals
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.event_ticket_batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS auto_register BOOLEAN NOT NULL DEFAULT false;

-- Trigger: criar/garantir event_registration quando deal tem event_id + auto_register
CREATE OR REPLACE FUNCTION public.deal_auto_register_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead RECORD;
  v_existing UUID;
BEGIN
  IF NEW.event_id IS NULL OR NEW.auto_register = false THEN
    RETURN NEW;
  END IF;

  -- Find lead info
  IF NEW.lead_id IS NOT NULL THEN
    SELECT full_name, email, phone, cpf, cost_center_id
      INTO v_lead
      FROM public.crm_leads
      WHERE id = NEW.lead_id;
  END IF;

  IF v_lead.email IS NULL THEN
    RETURN NEW; -- nothing to do without contact info
  END IF;

  -- Check if a registration already exists for this event+email
  SELECT id INTO v_existing
    FROM public.event_registrations
    WHERE event_id = NEW.event_id
      AND lower(email) = lower(v_lead.email)
    LIMIT 1;

  IF v_existing IS NULL THEN
    INSERT INTO public.event_registrations (
      event_id, lead_id, full_name, email, phone, cpf,
      status, paid, payment_amount, batch_id, cost_center_id, metadata
    ) VALUES (
      NEW.event_id, NEW.lead_id, v_lead.full_name, v_lead.email, v_lead.phone, v_lead.cpf,
      'confirmed',
      CASE WHEN NEW.stage IN ('won', 'inscrito', 'participou', 'pago') THEN true ELSE false END,
      NEW.value, NEW.batch_id, COALESCE(NEW.cost_center_id, v_lead.cost_center_id),
      jsonb_build_object('auto_registered_from_deal', NEW.id)
    );
  ELSE
    -- Update existing registration with batch/payment info
    UPDATE public.event_registrations
      SET batch_id = COALESCE(NEW.batch_id, batch_id),
          payment_amount = COALESCE(NEW.value, payment_amount),
          paid = CASE WHEN NEW.stage IN ('won', 'inscrito', 'participou', 'pago') THEN true ELSE paid END
      WHERE id = v_existing;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crm_deals_auto_register_event ON public.crm_deals;
CREATE TRIGGER crm_deals_auto_register_event
  AFTER INSERT OR UPDATE OF event_id, auto_register, stage ON public.crm_deals
  FOR EACH ROW EXECUTE FUNCTION public.deal_auto_register_event();
