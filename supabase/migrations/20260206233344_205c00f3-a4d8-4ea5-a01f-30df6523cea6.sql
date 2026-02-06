-- ===========================================
-- FASE 1: Upgrade do Perfil de Negócios
-- ===========================================

-- 1.1 Tabela de Facilidades/Amenidades do Negócio
CREATE TABLE public.business_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT, -- nome do ícone (lucide-react)
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, name)
);

-- 1.2 Tabela de Categorias do Cardápio/Catálogo
CREATE TABLE public.business_menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.3 Tabela de Itens do Cardápio/Catálogo
CREATE TABLE public.business_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.business_menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  image_url TEXT,
  is_highlighted BOOLEAN DEFAULT false,
  highlight_label TEXT, -- "Novo", "Mais vendido", "Promoção", etc.
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- Índices para Performance
-- ===========================================

CREATE INDEX idx_business_amenities_business_id ON public.business_amenities(business_id);
CREATE INDEX idx_business_menu_categories_business_id ON public.business_menu_categories(business_id);
CREATE INDEX idx_business_menu_items_business_id ON public.business_menu_items(business_id);
CREATE INDEX idx_business_menu_items_category_id ON public.business_menu_items(category_id);

-- ===========================================
-- Habilitar RLS
-- ===========================================

ALTER TABLE public.business_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_menu_items ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- Políticas RLS para business_amenities
-- ===========================================

-- Leitura pública (qualquer pessoa pode ver facilidades de negócios ativos)
CREATE POLICY "Everyone can view active amenities"
ON public.business_amenities
FOR SELECT
USING (active = true);

-- Donos podem gerenciar suas próprias facilidades
CREATE POLICY "Business owners can manage their amenities"
ON public.business_amenities
FOR ALL
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  )
);

-- Admins podem gerenciar todas as facilidades
CREATE POLICY "Admins can manage all amenities"
ON public.business_amenities
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ===========================================
-- Políticas RLS para business_menu_categories
-- ===========================================

-- Leitura pública
CREATE POLICY "Everyone can view active menu categories"
ON public.business_menu_categories
FOR SELECT
USING (active = true);

-- Donos podem gerenciar suas próprias categorias
CREATE POLICY "Business owners can manage their menu categories"
ON public.business_menu_categories
FOR ALL
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  )
);

-- Admins podem gerenciar todas as categorias
CREATE POLICY "Admins can manage all menu categories"
ON public.business_menu_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ===========================================
-- Políticas RLS para business_menu_items
-- ===========================================

-- Leitura pública
CREATE POLICY "Everyone can view active menu items"
ON public.business_menu_items
FOR SELECT
USING (active = true);

-- Donos podem gerenciar seus próprios itens
CREATE POLICY "Business owners can manage their menu items"
ON public.business_menu_items
FOR ALL
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  )
);

-- Admins podem gerenciar todos os itens
CREATE POLICY "Admins can manage all menu items"
ON public.business_menu_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ===========================================
-- Trigger para atualizar updated_at
-- ===========================================

CREATE TRIGGER update_business_menu_items_updated_at
BEFORE UPDATE ON public.business_menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();