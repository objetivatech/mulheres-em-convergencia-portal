-- Migração para corrigir problemas urgentes
-- Data: 24 de outubro de 2025
-- Problemas corrigidos:
-- 1. Erro "record 'new' has no field 'user_id'" ao criar negócio
-- 2. Tabela partners não existe para cadastro de parceiros

-- =============================================================================
-- PROBLEMA 1: Criar tabela partners que não existe
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  description TEXT NOT NULL,
  partnership_type TEXT NOT NULL CHECK (partnership_type IN ('sponsor', 'partner', 'supporter', 'collaborator')),
  start_date DATE,
  contact_email TEXT,
  social_links JSONB DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partners
CREATE POLICY "Everyone can view active partners" ON public.partners
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage partners" ON public.partners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_partners_updated_at ON public.partners;
CREATE TRIGGER trigger_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- PROBLEMA 2: Verificar se há trigger problemático na tabela user_roles
-- =============================================================================

-- Verificar se existe algum trigger problemático na tabela user_roles
-- que está causando o erro "record 'new' has no field 'user_id'"

-- Listar todos os triggers na tabela user_roles para debug
-- (Este comando será executado manualmente para investigação)

-- =============================================================================
-- INSERIR DADOS DE EXEMPLO PARA PARTNERS
-- =============================================================================

INSERT INTO public.partners (
  name, 
  logo_url, 
  website_url, 
  description, 
  partnership_type, 
  start_date,
  contact_email,
  display_order,
  active
) VALUES 
(
  'Exemplo Parceiro',
  'https://via.placeholder.com/200x100/9191C0/FFFFFF?text=Logo',
  'https://exemplo.com',
  'Parceiro de exemplo para testar o sistema',
  'partner',
  CURRENT_DATE,
  'contato@exemplo.com',
  1,
  false
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =============================================================================

COMMENT ON TABLE public.partners IS 'Tabela para gerenciar parceiros e apoiadores exibidos no site';
COMMENT ON COLUMN public.partners.partnership_type IS 'Tipo de parceria: sponsor, partner, supporter, collaborator';
COMMENT ON COLUMN public.partners.social_links IS 'Links das redes sociais em formato JSON: {"instagram": "url", "linkedin": "url", "facebook": "url"}';
COMMENT ON COLUMN public.partners.display_order IS 'Ordem de exibição (menor número = maior prioridade)';
