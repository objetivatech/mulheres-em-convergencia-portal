-- Migração: Recriar Sistema de Comunidades/Coletivos (DROP + CREATE)
-- Data: 25 de outubro de 2025
-- Descrição: Remove estrutura anterior e recria do zero

-- =============================================================================
-- LIMPEZA: Remover estrutura anterior
-- =============================================================================

-- Drop políticas RLS
DROP POLICY IF EXISTS "Everyone can view active communities" ON public.communities;
DROP POLICY IF EXISTS "Admins can manage communities" ON public.communities;
DROP POLICY IF EXISTS "Business owners can view their requests" ON public.community_requests;
DROP POLICY IF EXISTS "Business owners can create requests" ON public.community_requests;
DROP POLICY IF EXISTS "Admins can manage all requests" ON public.community_requests;

-- Drop funções
DROP FUNCTION IF EXISTS public.get_active_communities();
DROP FUNCTION IF EXISTS public.get_pending_community_requests();

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_communities_updated_at ON public.communities;
DROP TRIGGER IF EXISTS trigger_community_requests_updated_at ON public.community_requests;

-- Drop tabelas (CASCADE para remover dependências)
DROP TABLE IF EXISTS public.community_requests CASCADE;
DROP TABLE IF EXISTS public.communities CASCADE;

-- Remover coluna community_id de businesses
ALTER TABLE public.businesses DROP COLUMN IF EXISTS community_id;

-- =============================================================================
-- CRIAÇÃO: Estrutura completa do zero
-- =============================================================================

-- TABELA: communities
CREATE TABLE public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_communities_active ON public.communities(active);
CREATE INDEX idx_communities_name ON public.communities(name);

-- Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Trigger para updated_at
CREATE TRIGGER trigger_communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================

-- TABELA: community_requests
CREATE TABLE public.community_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  requested_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX idx_community_requests_business ON public.community_requests(business_id);
CREATE INDEX idx_community_requests_status ON public.community_requests(status);

-- Enable RLS
ALTER TABLE public.community_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Business owners can view their requests" ON public.community_requests
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can create requests" ON public.community_requests
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all requests" ON public.community_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Trigger para updated_at
CREATE TRIGGER trigger_community_requests_updated_at
  BEFORE UPDATE ON public.community_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================

-- ADICIONAR COLUNA community_id NA TABELA businesses
ALTER TABLE public.businesses 
ADD COLUMN community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL;

-- Criar índice
CREATE INDEX idx_businesses_community ON public.businesses(community_id);

-- =============================================================================

-- FUNÇÃO: get_active_communities
CREATE OR REPLACE FUNCTION public.get_active_communities()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id, name, description
  FROM public.communities
  WHERE active = true
  ORDER BY name ASC;
$$;

-- =============================================================================

-- FUNÇÃO: get_pending_community_requests
CREATE OR REPLACE FUNCTION public.get_pending_community_requests()
RETURNS TABLE (
  id UUID,
  business_id UUID,
  business_name TEXT,
  requested_name TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    cr.id,
    cr.business_id,
    b.name as business_name,
    cr.requested_name,
    cr.description,
    cr.created_at
  FROM public.community_requests cr
  JOIN public.businesses b ON b.id = cr.business_id
  WHERE cr.status = 'pending'
  ORDER BY cr.created_at DESC;
$$;

-- =============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =============================================================================

COMMENT ON TABLE public.communities IS 'Comunidades/Coletivos que podem ser vinculados a negócios';
COMMENT ON TABLE public.community_requests IS 'Solicitações de novas comunidades feitas por empresárias';

COMMENT ON COLUMN public.communities.active IS 'Se false, comunidade não aparece para seleção';
COMMENT ON COLUMN public.community_requests.status IS 'pending, approved ou rejected';
COMMENT ON COLUMN public.businesses.community_id IS 'Comunidade à qual o negócio pertence (opcional)';

COMMENT ON FUNCTION public.get_active_communities() IS 'Lista comunidades ativas para dropdowns';
COMMENT ON FUNCTION public.get_pending_community_requests() IS 'Lista solicitações pendentes para admin aprovar/rejeitar';

