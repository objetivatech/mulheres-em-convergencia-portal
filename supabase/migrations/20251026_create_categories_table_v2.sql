-- Migração: Criar tabela de categorias (V2 - Corrigida)
-- Data: 26 de outubro de 2025
-- Descrição: Cria tabela categories e adiciona category_id em businesses

-- =============================================================================
-- CRIAR TABELA categories
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(active);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies (DROP antes de criar para evitar conflito)
DROP POLICY IF EXISTS "Everyone can view active categories" ON public.categories;
CREATE POLICY "Everyone can view active categories" ON public.categories
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_categories_updated_at ON public.categories;
CREATE TRIGGER trigger_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- ADICIONAR COLUNA category_id EM businesses
-- =============================================================================

-- Adicionar nova coluna category_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' 
    AND column_name = 'category_id'
  ) THEN
    ALTER TABLE public.businesses 
    ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Criar índice (verificando se já existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_businesses_category'
  ) THEN
    CREATE INDEX idx_businesses_category ON public.businesses(category_id);
  END IF;
END $$;

-- =============================================================================
-- MIGRAR DADOS EXISTENTES
-- =============================================================================

-- Inserir categorias únicas existentes na nova tabela
INSERT INTO public.categories (name, active)
SELECT DISTINCT 
  TRIM(category) as name,
  true as active
FROM public.businesses
WHERE category IS NOT NULL 
  AND TRIM(category) != ''
  AND TRIM(category) NOT IN (SELECT name FROM public.categories)
ON CONFLICT (name) DO NOTHING;

-- Atualizar businesses com category_id baseado no nome da categoria
UPDATE public.businesses b
SET category_id = c.id
FROM public.categories c
WHERE TRIM(b.category) = c.name
  AND b.category IS NOT NULL
  AND TRIM(b.category) != ''
  AND b.category_id IS NULL;

-- =============================================================================
-- COMENTÁRIOS
-- =============================================================================

COMMENT ON TABLE public.categories IS 'Categorias de negócios disponíveis para seleção';
COMMENT ON COLUMN public.categories.active IS 'Se false, categoria não aparece para seleção';
COMMENT ON COLUMN public.businesses.category_id IS 'Categoria do negócio (substitui campo category texto)';

-- NOTA: A coluna 'category' (TEXT) será mantida temporariamente para compatibilidade
-- Pode ser removida em migração futura após validação

