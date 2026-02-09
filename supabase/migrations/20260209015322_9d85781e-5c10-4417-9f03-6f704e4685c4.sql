-- Adicionar campos de redes sociais e visibilidade pública ao profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS public_bio TEXT;

-- Adicionar campo para controlar visibilidade pública da embaixadora
ALTER TABLE public.ambassadors
ADD COLUMN IF NOT EXISTS show_on_public_page BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Criar índice para ordenação na página pública
CREATE INDEX IF NOT EXISTS idx_ambassadors_public_display 
ON public.ambassadors(show_on_public_page, display_order) 
WHERE active = true AND show_on_public_page = true;

-- Comentários para documentação
COMMENT ON COLUMN profiles.instagram_url IS 'URL do perfil do Instagram';
COMMENT ON COLUMN profiles.linkedin_url IS 'URL do perfil do LinkedIn';
COMMENT ON COLUMN profiles.website_url IS 'URL do site pessoal ou profissional';
COMMENT ON COLUMN profiles.public_bio IS 'Biografia pública para exibição em páginas públicas';
COMMENT ON COLUMN ambassadors.show_on_public_page IS 'Se a embaixadora deve aparecer na página pública';
COMMENT ON COLUMN ambassadors.display_order IS 'Ordem de exibição na página pública';