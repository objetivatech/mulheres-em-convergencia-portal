-- Fix search_path security warning for the functions just created
CREATE OR REPLACE FUNCTION public.is_user_author(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_uuid 
    AND 'author' = ANY(roles)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_popular_blog_tags(limit_count integer DEFAULT 20)
RETURNS TABLE(id uuid, name text, slug text, post_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    bt.id,
    bt.name,
    bt.slug,
    COUNT(bpt.post_id) as post_count
  FROM blog_tags bt
  LEFT JOIN blog_post_tags bpt ON bt.id = bpt.tag_id
  LEFT JOIN blog_posts bp ON bpt.post_id = bp.id
  WHERE bp.status = 'published' OR bp.status IS NULL
  GROUP BY bt.id, bt.name, bt.slug
  HAVING COUNT(bpt.post_id) > 0
  ORDER BY post_count DESC, bt.name ASC
  LIMIT limit_count;
$function$;