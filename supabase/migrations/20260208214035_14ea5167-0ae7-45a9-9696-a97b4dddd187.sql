-- Função para gerar código de referral único
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar código alfanumérico de 8 caracteres
    new_code := UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 8));
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM ambassadors WHERE referral_code = new_code) INTO code_exists;
    
    -- Se não existe, retornar o código
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Função trigger que cria registro em ambassadors quando role ambassador é atribuído
CREATE OR REPLACE FUNCTION public.create_ambassador_on_role_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas processar se o role for 'ambassador'
  IF NEW.role = 'ambassador' THEN
    -- Inserir registro em ambassadors se não existir
    INSERT INTO ambassadors (user_id, referral_code, active)
    VALUES (NEW.user_id, generate_unique_referral_code(), true)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Função trigger que remove registro em ambassadors quando role ambassador é removido
CREATE OR REPLACE FUNCTION public.deactivate_ambassador_on_role_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas processar se o role for 'ambassador'
  IF OLD.role = 'ambassador' THEN
    -- Desativar embaixadora (não deletar para manter histórico)
    UPDATE ambassadors 
    SET active = false, updated_at = now()
    WHERE user_id = OLD.user_id;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Criar triggers
DROP TRIGGER IF EXISTS trigger_create_ambassador_on_role ON user_roles;
CREATE TRIGGER trigger_create_ambassador_on_role
  AFTER INSERT ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION create_ambassador_on_role_insert();

DROP TRIGGER IF EXISTS trigger_deactivate_ambassador_on_role ON user_roles;
CREATE TRIGGER trigger_deactivate_ambassador_on_role
  AFTER DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION deactivate_ambassador_on_role_delete();

-- Criar registros para embaixadoras existentes que não têm registro
INSERT INTO ambassadors (user_id, referral_code, active)
SELECT ur.user_id, generate_unique_referral_code(), true
FROM user_roles ur
WHERE ur.role = 'ambassador'
AND NOT EXISTS (
  SELECT 1 FROM ambassadors a WHERE a.user_id = ur.user_id
);

-- Função RPC para verificar se usuário atual é embaixadora ativa
CREATE OR REPLACE FUNCTION public.get_current_user_ambassador_status()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM ambassadors
    WHERE user_id = auth.uid()
    AND active = true
  );
$$;

-- Garantir que admin pode gerenciar ambassadors
DROP POLICY IF EXISTS "Admins can manage all ambassadors" ON ambassadors;
CREATE POLICY "Admins can manage all ambassadors"
ON ambassadors FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));