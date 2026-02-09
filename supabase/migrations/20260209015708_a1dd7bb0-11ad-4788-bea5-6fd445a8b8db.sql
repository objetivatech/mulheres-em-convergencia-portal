-- Adicionar campos de exibição pública diretamente na tabela ambassadors
-- Esses campos são gerenciados exclusivamente pelo admin
ALTER TABLE public.ambassadors
ADD COLUMN IF NOT EXISTS public_name TEXT,
ADD COLUMN IF NOT EXISTS public_photo_url TEXT,
ADD COLUMN IF NOT EXISTS public_bio TEXT,
ADD COLUMN IF NOT EXISTS public_city TEXT,
ADD COLUMN IF NOT EXISTS public_state TEXT,
ADD COLUMN IF NOT EXISTS public_instagram_url TEXT,
ADD COLUMN IF NOT EXISTS public_linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS public_website_url TEXT;

-- Comentários para documentação
COMMENT ON COLUMN ambassadors.public_name IS 'Nome para exibição na página pública (gerenciado pelo admin)';
COMMENT ON COLUMN ambassadors.public_photo_url IS 'URL da foto para página pública (gerenciado pelo admin)';
COMMENT ON COLUMN ambassadors.public_bio IS 'Biografia para página pública (gerenciado pelo admin)';
COMMENT ON COLUMN ambassadors.public_city IS 'Cidade para exibição (gerenciado pelo admin)';
COMMENT ON COLUMN ambassadors.public_state IS 'Estado para exibição (gerenciado pelo admin)';
COMMENT ON COLUMN ambassadors.public_instagram_url IS 'URL do Instagram (gerenciado pelo admin)';
COMMENT ON COLUMN ambassadors.public_linkedin_url IS 'URL do LinkedIn (gerenciado pelo admin)';
COMMENT ON COLUMN ambassadors.public_website_url IS 'URL do site (gerenciado pelo admin)';