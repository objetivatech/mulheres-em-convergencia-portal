ALTER TABLE public.textos_site DROP CONSTRAINT textos_site_tipo_check;
ALTER TABLE public.textos_site ADD CONSTRAINT textos_site_tipo_check CHECK (tipo = ANY (ARRAY['texto','rico','imagem','link']));