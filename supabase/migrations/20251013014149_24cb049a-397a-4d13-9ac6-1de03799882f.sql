-- ====================================
-- FASE 1: Popular user_roles e Corrigir Lógica de Negócio (CORRIGIDO V2)
-- ====================================

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status_expires 
ON user_subscriptions(user_id, status, expires_at);

CREATE INDEX IF NOT EXISTS idx_businesses_owner_complimentary 
ON businesses(owner_id, is_complimentary, subscription_active);

-- Popular user_roles com dados existentes (usando NULL::uuid como granted_by)
INSERT INTO user_roles (user_id, role, granted_by)
SELECT 
  id, 
  'admin'::app_role, 
  NULL::uuid
FROM profiles 
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role, granted_by)
SELECT 
  id, 
  'blog_editor'::app_role, 
  NULL::uuid
FROM profiles 
WHERE can_edit_blog = true
ON CONFLICT (user_id, role) DO NOTHING;

-- Adicionar role business_owner para donos de negócios ativos
INSERT INTO user_roles (user_id, role, granted_by)
SELECT DISTINCT
  owner_id,
  'business_owner'::app_role,
  NULL::uuid
FROM businesses
WHERE owner_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Criar função para calcular status correto de negócio
CREATE OR REPLACE FUNCTION is_business_active(business_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  business_record RECORD;
  user_subscription RECORD;
BEGIN
  -- Buscar dados do negócio
  SELECT * INTO business_record
  FROM businesses
  WHERE id = business_uuid;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Se é cortesia, está sempre ativo
  IF business_record.is_complimentary THEN
    RETURN true;
  END IF;
  
  -- Buscar assinatura ativa ou cancelada (mas ainda válida)
  SELECT * INTO user_subscription
  FROM user_subscriptions
  WHERE user_id = business_record.owner_id
    AND status IN ('active', 'cancelled')
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Se tem assinatura válida, está ativo
  RETURN user_subscription IS NOT NULL;
END;
$$;

-- Atualizar todos os negócios com status correto
UPDATE businesses
SET subscription_active = is_business_active(id);

-- ====================================
-- FASE 7: Garantir CPF Único
-- ====================================

-- Adicionar unique constraint no CPF (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_cpf_unique'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_cpf_unique UNIQUE (cpf);
  END IF;
END $$;

-- Criar índice no CPF
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON profiles(cpf) WHERE cpf IS NOT NULL;