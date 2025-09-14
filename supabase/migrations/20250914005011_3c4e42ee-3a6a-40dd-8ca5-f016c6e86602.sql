-- FASE 2: URLs SEO para Negócios
-- Adicionar campo slug único na tabela businesses
ALTER TABLE public.businesses ADD COLUMN slug text;

-- Criar índice único no campo slug
CREATE UNIQUE INDEX idx_businesses_slug ON public.businesses(slug);

-- Função para gerar slug único automaticamente
CREATE OR REPLACE FUNCTION public.generate_business_slug(business_name text, business_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 0;
BEGIN
    -- Gerar slug base a partir do nome
    base_slug := lower(regexp_replace(
        regexp_replace(
            regexp_replace(business_name, '[àáâãäå]', 'a', 'gi'),
            '[èéêë]', 'e', 'gi'
        ),
        '[^a-z0-9]+', '-', 'gi'
    ));
    
    -- Remover hífens do início e fim
    base_slug := trim(both '-' from base_slug);
    
    -- Verificar se o slug já existe
    final_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM public.businesses WHERE slug = final_slug AND id != business_id) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$;

-- Gerar slugs para empresas existentes
UPDATE public.businesses 
SET slug = public.generate_business_slug(name, id)
WHERE slug IS NULL;

-- Tornar campo slug obrigatório após popular dados existentes
ALTER TABLE public.businesses ALTER COLUMN slug SET NOT NULL;

-- FASE 4: Sistema de agendamento de posts
-- Adicionar campo scheduled_for na tabela blog_posts
ALTER TABLE public.blog_posts ADD COLUMN scheduled_for timestamp with time zone;

-- Atualizar trigger para definir published_at quando status muda para published
CREATE OR REPLACE FUNCTION public.update_blog_post_published_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Se o status mudou para 'published' e não havia published_at
  IF NEW.status = 'published' AND (OLD.status != 'published' OR OLD.published_at IS NULL) THEN
    NEW.published_at = COALESCE(NEW.scheduled_for, now());
  -- Se o status mudou de 'published' para outro
  ELSIF OLD.status = 'published' AND NEW.status != 'published' THEN
    NEW.published_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para blog_posts
DROP TRIGGER IF EXISTS trigger_update_blog_post_published_at ON public.blog_posts;
CREATE TRIGGER trigger_update_blog_post_published_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_blog_post_published_at();

-- Função para publicar posts agendados automaticamente
CREATE OR REPLACE FUNCTION public.publish_scheduled_posts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  published_count integer := 0;
BEGIN
  -- Publicar posts que estão agendados para agora ou antes
  UPDATE public.blog_posts 
  SET 
    status = 'published',
    published_at = scheduled_for,
    updated_at = now()
  WHERE 
    status = 'draft' 
    AND scheduled_for IS NOT NULL 
    AND scheduled_for <= now();
  
  GET DIAGNOSTICS published_count = ROW_COUNT;
  
  RETURN published_count;
END;
$$;