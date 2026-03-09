-- Adicionar campo para rastrear 1ª participação de convidado
ALTER TABLE conecta_profiles 
ADD COLUMN IF NOT EXISTS first_event_attended_at timestamptz;

-- Trigger para atualizar automaticamente quando check-in é feito
CREATE OR REPLACE FUNCTION update_guest_first_attendance()
RETURNS TRIGGER AS $$
BEGIN
  -- Só executa se for UPDATE de checked_in_at (de NULL para valor)
  IF NEW.checked_in_at IS NOT NULL AND OLD.checked_in_at IS NULL AND NEW.user_id IS NOT NULL THEN
    -- Atualizar conecta_profile se for convidado e ainda não tem data
    UPDATE conecta_profiles
    SET first_event_attended_at = NEW.checked_in_at
    WHERE id = NEW.user_id
      AND conecta_role = 'convidado'
      AND first_event_attended_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trg_update_guest_attendance ON event_registrations;

-- Criar trigger
CREATE TRIGGER trg_update_guest_attendance
AFTER UPDATE ON event_registrations
FOR EACH ROW
EXECUTE FUNCTION update_guest_first_attendance();

-- Comentário para documentação
COMMENT ON COLUMN conecta_profiles.first_event_attended_at IS 'Marca quando o convidado fez check-in no primeiro evento. Usado para controle de acesso único.';