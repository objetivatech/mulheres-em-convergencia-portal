-- Create site_settings table for global site configuration
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  display_name TEXT NOT NULL,
  description TEXT,
  setting_type TEXT NOT NULL DEFAULT 'json', -- json, text, boolean, number
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage site settings" 
ON public.site_settings 
FOR ALL 
USING (get_current_user_admin_status());

CREATE POLICY "Everyone can view public settings" 
ON public.site_settings 
FOR SELECT 
USING (setting_key IN ('site_title', 'site_description', 'contact_info', 'social_links'));

-- Create navigation_menus table for dynamic navigation
CREATE TABLE public.navigation_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_key TEXT NOT NULL UNIQUE,
  menu_name TEXT NOT NULL,
  menu_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage navigation menus" 
ON public.navigation_menus 
FOR ALL 
USING (get_current_user_admin_status());

CREATE POLICY "Everyone can view active menus" 
ON public.navigation_menus 
FOR SELECT 
USING (active = true);

-- Insert default settings
INSERT INTO public.site_settings (setting_key, setting_value, display_name, description, setting_type) VALUES
('site_title', '"Portal Mulheres em Convergência"', 'Título do Site', 'Título principal exibido no cabeçalho', 'text'),
('site_description', '"Conectando mulheres empreendedoras em todo o Brasil"', 'Descrição do Site', 'Descrição para SEO e redes sociais', 'text'),
('contact_info', '{"email": "contato@mulheresemconvergencia.com.br", "phone": "+55 11 99999-9999"}', 'Informações de Contato', 'Email e telefone para contato', 'json'),
('social_links', '{"instagram": "https://instagram.com/mulheresemconvergencia", "facebook": "", "linkedin": ""}', 'Redes Sociais', 'Links para redes sociais', 'json'),
('footer_text', '"© 2024 Mulheres em Convergência. Todos os direitos reservados."', 'Texto do Rodapé', 'Texto de copyright no rodapé', 'text');

-- Insert default navigation menu
INSERT INTO public.navigation_menus (menu_key, menu_name, menu_items) VALUES
('main_navigation', 'Menu Principal', '[
  {"label": "Início", "href": "/", "active": true},
  {"label": "Diretório", "href": "/diretorio", "active": true},
  {"label": "Blog", "href": "/blog", "active": true},
  {"label": "Sobre", "href": "/sobre", "active": true},
  {"label": "Contato", "href": "/contato", "active": true}
]'::jsonb);

-- Create trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_navigation_menus_updated_at
BEFORE UPDATE ON public.navigation_menus
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();