-- Update main_navigation menu to include Eventos
UPDATE public.navigation_menus 
SET menu_items = '[
  {"label": "Início", "href": "/", "active": true},
  {"label": "Sobre", "href": "/sobre", "active": true},
  {"label": "Diretório", "href": "/diretorio", "active": true},
  {"label": "Eventos", "href": "/eventos", "active": true},
  {"label": "Comunidades", "href": "/comunidades", "active": true},
  {"label": "Convergindo", "href": "/convergindo", "active": true}
]'::jsonb,
updated_at = now()
WHERE menu_key = 'main_navigation';