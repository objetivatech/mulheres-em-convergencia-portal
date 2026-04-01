
-- Junction table for multi-category blog posts
CREATE TABLE public.blog_post_categories (
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.blog_categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (post_id, category_id)
);

-- Ensure only one primary category per post
CREATE UNIQUE INDEX idx_blog_post_categories_primary 
  ON public.blog_post_categories (post_id) 
  WHERE is_primary = true;

-- Enable RLS
ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public can read post categories"
  ON public.blog_post_categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users can manage
CREATE POLICY "Authenticated users can manage post categories"
  ON public.blog_post_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Migrate existing category_id data into junction table
INSERT INTO public.blog_post_categories (post_id, category_id, is_primary)
SELECT id, category_id, true
FROM public.blog_posts
WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;
