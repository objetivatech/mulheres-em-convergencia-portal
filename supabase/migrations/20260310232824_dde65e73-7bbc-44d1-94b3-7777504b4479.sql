
-- Trigger: Award 10 points to CONECTA+ members on event check-in via QR code
CREATE OR REPLACE FUNCTION public.trg_event_checkin_conecta_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_is_conecta boolean;
BEGIN
  -- Only fire when checked_in_at changes from NULL to a value
  IF OLD.checked_in_at IS NULL AND NEW.checked_in_at IS NOT NULL AND NEW.user_id IS NOT NULL THEN
    v_user_id := NEW.user_id;
    
    -- Check if user is in conecta_profiles
    SELECT EXISTS(
      SELECT 1 FROM public.conecta_profiles WHERE id = v_user_id AND is_active = true
    ) INTO v_is_conecta;
    
    IF v_is_conecta THEN
      -- Award 10 points for event attendance via check-in
      INSERT INTO public.conecta_points_history (user_id, points, reason, reference_type, reference_id)
      VALUES (v_user_id, 10, 'Presença confirmada em evento presencial', 'event_checkin', NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop if exists and create trigger
DROP TRIGGER IF EXISTS trg_event_checkin_conecta_points ON public.event_registrations;
CREATE TRIGGER trg_event_checkin_conecta_points
  AFTER UPDATE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_event_checkin_conecta_points();
