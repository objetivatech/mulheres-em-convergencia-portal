-- Update the publish_scheduled_posts function to check for 'scheduled' status
CREATE OR REPLACE FUNCTION public.publish_scheduled_posts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  published_count integer := 0;
BEGIN
  -- Publicar posts que estão agendados para agora ou antes
  -- Verifica tanto status 'draft' com scheduled_for quanto status 'scheduled'
  UPDATE public.blog_posts 
  SET 
    status = 'published',
    published_at = COALESCE(scheduled_for, now()),
    scheduled_for = NULL,
    updated_at = now()
  WHERE 
    (status = 'scheduled' OR (status = 'draft' AND scheduled_for IS NOT NULL))
    AND scheduled_for IS NOT NULL 
    AND scheduled_for <= now();
  
  GET DIAGNOSTICS published_count = ROW_COUNT;
  
  RETURN published_count;
END;
$$;