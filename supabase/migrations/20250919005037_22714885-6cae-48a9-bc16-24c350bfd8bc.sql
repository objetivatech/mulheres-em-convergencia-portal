-- Inserir páginas estáticas no Page Builder
INSERT INTO public.pages (title, slug, status, content, author_id) VALUES
('Página Inicial', 'home', 'draft', '{"content": [], "root": {}}', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('Sobre Nós', 'sobre', 'draft', '{"content": [], "root": {}}', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('Planos e Preços', 'planos', 'draft', '{"content": [], "root": {}}', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('Contato', 'contato', 'draft', '{"content": [], "root": {}}', (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1))
ON CONFLICT (slug) DO NOTHING;