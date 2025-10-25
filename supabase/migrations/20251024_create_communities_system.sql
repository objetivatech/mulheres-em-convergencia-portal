-- Migração para Sistema de Comunidades/Coletivos
-- Data: 24 de outubro de 2025
-- Implementa cadastro de comunidades, vínculo com negócios e solicitações

-- =============================================================================
-- TABELA: communities (Comunidades/Coletivos)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_communities_active ON public.communities(active);
CREATE INDEX IF NOT EXISTS idx_communities_name ON public.communities(name);

-- =============================================================================
-- TABELA: community_requests (Solicitações de Novas Comunidades)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.community_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_name TEXT NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_email TEXT NOT NULL,
  requester_name TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_community_requests_status ON public.community_requests(status);
CREATE INDEX IF NOT EXISTS idx_community_requests_requester ON public.community_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_community_requests_business ON public.community_requests(business_id);

-- =============================================================================
-- ALTERAR TABELA: businesses (Adicionar vínculo com comunidade)
-- =============================================================================

-- Adicionar coluna community_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'community_id'
  ) THEN
    ALTER TABLE public.businesses 
    ADD COLUMN community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_businesses_community ON public.businesses(community_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_requests ENABLE ROW LEVEL SECURITY;

-- Políticas para communities
CREATE POLICY "Everyone can view active communities" ON public.communities
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage communities" ON public.communities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Políticas para community_requests
CREATE POLICY "Users can view their own requests" ON public.community_requests
  FOR SELECT USING (requester_id = auth.uid());

CREATE POLICY "Users can create requests" ON public.community_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Admins can view all requests" ON public.community_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update requests" ON public.community_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger para updated_at em communities
DROP TRIGGER IF EXISTS trigger_communities_updated_at ON public.communities;
CREATE TRIGGER trigger_communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- FUNÇÕES AUXILIARES
-- =============================================================================

-- Função para aprovar solicitação de comunidade
CREATE OR REPLACE FUNCTION public.approve_community_request(
  request_id UUID,
  admin_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_record RECORD;
  new_community_id UUID;
BEGIN
  -- Verificar se é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  -- Buscar a solicitação
  SELECT * INTO request_record
  FROM public.community_requests
  WHERE id = request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- Verificar se a comunidade já existe
  SELECT id INTO new_community_id
  FROM public.communities
  WHERE LOWER(name) = LOWER(request_record.community_name);

  -- Se não existe, criar
  IF new_community_id IS NULL THEN
    INSERT INTO public.communities (name, created_by)
    VALUES (request_record.community_name, auth.uid())
    RETURNING id INTO new_community_id;
  END IF;

  -- Atualizar a solicitação
  UPDATE public.community_requests
  SET 
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_notes = admin_notes
  WHERE id = request_id;

  -- Se a solicitação tem business_id, vincular automaticamente
  IF request_record.business_id IS NOT NULL THEN
    UPDATE public.businesses
    SET community_id = new_community_id
    WHERE id = request_record.business_id;
  END IF;

  RETURN new_community_id;
END;
$$;

-- Função para rejeitar solicitação de comunidade
CREATE OR REPLACE FUNCTION public.reject_community_request(
  request_id UUID,
  admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  -- Atualizar a solicitação
  UPDATE public.community_requests
  SET 
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_notes = admin_notes
  WHERE id = request_id;

  RETURN TRUE;
END;
$$;

-- Função para obter estatísticas de comunidades
CREATE OR REPLACE FUNCTION public.get_communities_stats()
RETURNS TABLE(
  total_communities BIGINT,
  active_communities BIGINT,
  pending_requests BIGINT,
  businesses_with_community BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.communities) as total_communities,
    (SELECT COUNT(*) FROM public.communities WHERE active = true) as active_communities,
    (SELECT COUNT(*) FROM public.community_requests WHERE status = 'pending') as pending_requests,
    (SELECT COUNT(*) FROM public.businesses WHERE community_id IS NOT NULL) as businesses_with_community;
$$;

-- =============================================================================
-- DADOS INICIAIS (Exemplos)
-- =============================================================================

-- Inserir algumas comunidades iniciais como exemplo
INSERT INTO public.communities (name, description, active) VALUES
  ('Coletivo Empreendedoras Unidas', 'Coletivo de mulheres empreendedoras da região', true),
  ('Rede de Mulheres Negras', 'Rede de apoio e fortalecimento de mulheres negras empreendedoras', true),
  ('Comunidade Mães Empreendedoras', 'Comunidade de mães que empreendem', true),
  ('Coletivo Artesãs do Vale', 'Coletivo de artesãs e produtoras locais', true)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =============================================================================

COMMENT ON TABLE public.communities IS 'Comunidades e coletivos aos quais as empreendedoras podem estar vinculadas';
COMMENT ON TABLE public.community_requests IS 'Solicitações de cadastro de novas comunidades feitas pelas usuárias';
COMMENT ON COLUMN public.businesses.community_id IS 'Comunidade/coletivo ao qual o negócio está vinculado';
COMMENT ON FUNCTION public.approve_community_request IS 'Função admin: Aprova solicitação e cria comunidade se não existir';
COMMENT ON FUNCTION public.reject_community_request IS 'Função admin: Rejeita solicitação de comunidade';
COMMENT ON FUNCTION public.get_communities_stats IS 'Retorna estatísticas sobre comunidades e solicitações';

