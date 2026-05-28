-- supabase/migrations/20260528000001_pages_editor_columns.sql

-- Add editor metadata columns to pages table
ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS is_public   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS page_type   TEXT    NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS seo_title   TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- Mark the three system pages so they can't be deleted from admin UI
UPDATE public.pages SET page_type = 'system' WHERE slug IN ('sobre', 'planos', 'contato');

-- Add a comment explaining the page_type values
COMMENT ON COLUMN public.pages.page_type IS
  'system = core pages (sobre/planos/contato) that cannot be deleted; free = admin-created pages';

COMMENT ON COLUMN public.pages.is_public IS
  'When true the page is rendered at /pagina/:slug. When false it is internal only.';
