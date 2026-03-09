
-- Atualizar trigger para só marcar first_event_attended_at em eventos ONLINE
CREATE OR REPLACE FUNCTION update_guest_first_attendance()
RETURNS TRIGGER AS $$
DECLARE
  v_format text;
BEGIN
  -- Só executa se for UPDATE de checked_in_at (de NULL para valor)
  IF NEW.checked_in_at IS NOT NULL AND OLD.checked_in_at IS NULL AND NEW.user_id IS NOT NULL THEN
    -- Buscar formato do evento
    SELECT format INTO v_format FROM events WHERE id = NEW.event_id;
    
    -- Só bloqueia se o evento for ONLINE
    IF v_format = 'online' THEN
      UPDATE conecta_profiles
      SET first_event_attended_at = NEW.checked_in_at
      WHERE id = NEW.user_id
        AND conecta_role = 'convidado'
        AND first_event_attended_at IS NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_guest_first_attendance() IS 'Marca primeiro check-in de convidado APENAS em eventos online. Eventos presenciais não bloqueiam.';
