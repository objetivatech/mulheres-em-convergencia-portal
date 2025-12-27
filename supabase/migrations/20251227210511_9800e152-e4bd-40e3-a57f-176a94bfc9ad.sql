-- Adicionar menus do rodapé se não existirem
INSERT INTO public.navigation_menus (menu_key, menu_name, menu_items, active)
SELECT 'footer_navigation', 'Navegação do Rodapé', 
  '[{"label": "Sobre", "href": "/sobre", "active": true}, {"label": "Diretório", "href": "/diretorio", "active": true}, {"label": "Eventos", "href": "/eventos", "active": true}, {"label": "Comunidades", "href": "/comunidades", "active": true}, {"label": "Convergindo", "href": "/convergindo", "active": true}, {"label": "Contato", "href": "/contato", "active": true}]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM public.navigation_menus WHERE menu_key = 'footer_navigation');

INSERT INTO public.navigation_menus (menu_key, menu_name, menu_items, active)
SELECT 'footer_legal', 'Links Jurídicos do Rodapé', 
  '[{"label": "Termos de Uso", "href": "/termos-de-uso", "active": true}, {"label": "Política de Privacidade", "href": "/politica-de-privacidade", "active": true}, {"label": "Política de Cookies", "href": "/politica-de-cookies", "active": true}]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM public.navigation_menus WHERE menu_key = 'footer_legal');

-- Criar tabela para rastrear landing pages ativas
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  product_id TEXT,
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: leitura pública para LPs ativas
CREATE POLICY "Landing pages ativas são visíveis publicamente" 
ON public.landing_pages 
FOR SELECT 
USING (active = true);

-- Políticas RLS: admins podem gerenciar
CREATE POLICY "Admins podem gerenciar landing pages" 
ON public.landing_pages 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Inserir a LP do Criar e Converter como exemplo
INSERT INTO public.landing_pages (slug, title, description, image_url, product_id, active, featured)
VALUES (
  'criar-converter',
  'Workshop Criar e Converter',
  'Aprenda a criar conteúdo que se conecta e converte em apenas 2 dias de imersão online.',
  NULL,
  'criar-converter',
  true,
  true
) ON CONFLICT (slug) DO NOTHING;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_landing_pages_updated_at
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();