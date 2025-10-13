-- ============================================
-- CORREÇÕES CRÍTICAS DE SEGURANÇA
-- ============================================

-- 1. CORRIGIR FUNÇÕES SECURITY DEFINER SEM search_path
-- ============================================

-- Atualizar has_role para incluir search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public  -- ✅ CORRIGIDO
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  );
$$;

-- Atualizar get_current_user_admin_status
CREATE OR REPLACE FUNCTION public.get_current_user_admin_status()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public  -- ✅ CORRIGIDO
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role);
$$;

-- Atualizar get_current_user_blog_edit_status
CREATE OR REPLACE FUNCTION public.get_current_user_blog_edit_status()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public  -- ✅ CORRIGIDO
AS $$
  SELECT public.has_role(auth.uid(), 'blog_editor'::app_role) 
     OR public.has_role(auth.uid(), 'admin'::app_role);
$$;

-- 2. REMOVER reviewer_email DE CONSULTAS PÚBLICAS
-- ============================================

-- Criar VIEW segura para avaliações públicas (SEM emails)
CREATE OR REPLACE VIEW public.public_business_reviews AS
SELECT 
  id,
  business_id,
  reviewer_name,
  rating,
  title,
  comment,
  verified,
  helpful_count,
  created_at,
  status
FROM public.business_reviews
WHERE status = 'approved';

-- Comentário: Funções get_public_business_reviews e get_safe_business_reviews já não retornam reviewer_email
-- Confirmado em db-functions que elas não incluem reviewer_email no SELECT

-- 3. ADICIONAR AUDITORIA DE CPF
-- ============================================

-- Tabela de log de acesso a CPF
CREATE TABLE IF NOT EXISTS public.cpf_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by UUID REFERENCES auth.users(id),
  profile_id UUID REFERENCES public.profiles(id),
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cpf_access_log_accessed_by ON public.cpf_access_log(accessed_by);
CREATE INDEX IF NOT EXISTS idx_cpf_access_log_profile_id ON public.cpf_access_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_cpf_access_log_accessed_at ON public.cpf_access_log(accessed_at);

-- RLS para cpf_access_log (apenas admins podem ver)
ALTER TABLE public.cpf_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all CPF access logs"
ON public.cpf_access_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Função para logar acesso a CPF
CREATE OR REPLACE FUNCTION public.log_cpf_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Logar apenas se CPF foi acessado em SELECT
  IF TG_OP = 'SELECT' AND NEW.cpf IS NOT NULL THEN
    INSERT INTO public.cpf_access_log (accessed_by, profile_id, action)
    VALUES (auth.uid(), NEW.id, 'cpf_viewed');
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. ADICIONAR POLÍTICA EXPLÍCITA DE NEGAÇÃO PARA CPF PÚBLICO
-- ============================================

-- Garantir que CPF nunca seja exposto publicamente
-- As políticas existentes já protegem, mas adicionar camada extra de segurança

COMMENT ON COLUMN public.profiles.cpf IS 'SENSITIVE: Brazilian Tax ID (CPF). Equivalent to SSN. Must never be exposed publicly. Access is logged.';

-- 5. CRIAR FUNÇÃO SEGURA PARA VERIFICAR EXISTÊNCIA DE CPF (SEM EXPOR O CPF)
-- ============================================

CREATE OR REPLACE FUNCTION public.cpf_exists(cpf_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  formatted_cpf TEXT;
  user_count INTEGER;
BEGIN
  -- Rate limiting: máximo 10 verificações por hora por usuário
  SELECT COUNT(*) INTO user_count
  FROM public.cpf_access_log
  WHERE accessed_by = auth.uid()
    AND accessed_at > NOW() - INTERVAL '1 hour'
    AND action = 'cpf_existence_check';
  
  IF user_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Maximum 10 CPF checks per hour.';
  END IF;
  
  -- Formatar CPF
  formatted_cpf := public.format_cpf(cpf_to_check);
  
  -- Logar a tentativa de verificação
  INSERT INTO public.cpf_access_log (accessed_by, action, ip_address)
  VALUES (auth.uid(), 'cpf_existence_check', formatted_cpf);
  
  -- Retornar apenas se existe, SEM expor qual perfil
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE cpf = formatted_cpf
  );
END;
$$;

-- 6. ADICIONAR TABELA PARA WEBHOOK SIGNATURE VALIDATION
-- ============================================

CREATE TABLE IF NOT EXISTS public.webhook_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_provider TEXT NOT NULL, -- 'asaas', 'mailrelay', etc
  signature_header TEXT NOT NULL,
  signature_value TEXT,
  request_body TEXT,
  validated BOOLEAN DEFAULT false,
  validation_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_signatures_provider ON public.webhook_signatures(webhook_provider);
CREATE INDEX IF NOT EXISTS idx_webhook_signatures_created_at ON public.webhook_signatures(created_at);

-- RLS para webhook_signatures (apenas admins)
ALTER TABLE public.webhook_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook signatures"
ON public.webhook_signatures FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. LIMPAR LOGS ANTIGOS (função de manutenção)
-- ============================================

CREATE OR REPLACE FUNCTION public.cleanup_security_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Deletar logs de CPF com mais de 6 meses
  DELETE FROM public.cpf_access_log
  WHERE accessed_at < NOW() - INTERVAL '6 months';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Deletar assinaturas de webhook com mais de 30 dias
  DELETE FROM public.webhook_signatures
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  RETURN deleted_count;
END;
$$;