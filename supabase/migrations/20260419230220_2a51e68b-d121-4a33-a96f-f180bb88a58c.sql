-- Insert 3 new subject categories
INSERT INTO public.academy_categories (name, slug, category_type, display_order, active)
VALUES
  ('Comunidade', 'comunidade', 'subject', 1, true),
  ('Gestão de Negócios', 'gestao-de-negocios', 'subject', 5, true),
  ('Networking', 'networking', 'subject', 8, true);

-- Reorder all subjects alphabetically
UPDATE public.academy_categories SET display_order = 1 WHERE category_type = 'subject' AND slug = 'comunidade';
UPDATE public.academy_categories SET display_order = 2 WHERE category_type = 'subject' AND slug = 'desenvolvimento-pessoal';
UPDATE public.academy_categories SET display_order = 3 WHERE category_type = 'subject' AND slug = 'empreendedorismo';
UPDATE public.academy_categories SET display_order = 4 WHERE category_type = 'subject' AND slug = 'financas';
UPDATE public.academy_categories SET display_order = 5 WHERE category_type = 'subject' AND slug = 'gestao-de-negocios';
UPDATE public.academy_categories SET display_order = 6 WHERE category_type = 'subject' AND slug = 'lideranca';
UPDATE public.academy_categories SET display_order = 7 WHERE category_type = 'subject' AND slug = 'marketing';
UPDATE public.academy_categories SET display_order = 8 WHERE category_type = 'subject' AND slug = 'networking';
UPDATE public.academy_categories SET display_order = 9 WHERE category_type = 'subject' AND slug = 'tecnologia';