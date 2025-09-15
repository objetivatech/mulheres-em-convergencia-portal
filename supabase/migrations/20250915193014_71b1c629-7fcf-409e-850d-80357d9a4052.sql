-- Add author role to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'author';

-- Add function to check if user is author
CREATE OR REPLACE FUNCTION public.is_user_author(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_uuid 
    AND 'author' = ANY(roles)
  );
END;
$function$;

-- Add function to get most used blog tags with counts
CREATE OR REPLACE FUNCTION public.get_popular_blog_tags(limit_count integer DEFAULT 20)
RETURNS TABLE(id uuid, name text, slug text, post_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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