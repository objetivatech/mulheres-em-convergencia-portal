
-- 1. Create blog_authors table
CREATE TABLE public.blog_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  photo_url text,
  bio text,
  instagram_url text,
  linkedin_url text,
  website_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;

-- Public can read authors
CREATE POLICY "Anyone can view blog authors"
ON public.blog_authors FOR SELECT
USING (true);

-- Only admins can manage authors
CREATE POLICY "Admins can manage blog authors"
ON public.blog_authors FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_blog_authors_updated_at
BEFORE UPDATE ON public.blog_authors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add author_profile_id to blog_posts
ALTER TABLE public.blog_posts
ADD COLUMN author_profile_id uuid REFERENCES public.blog_authors(id) ON DELETE SET NULL;

-- 3. Create comment_status enum
DO $$ BEGIN
  CREATE TYPE public.comment_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4. Create blog_comments table
CREATE TABLE public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text NOT NULL,
  content text NOT NULL,
  status public.comment_status NOT NULL DEFAULT 'pending',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_id uuid REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved comments
CREATE POLICY "Anyone can view approved comments"
ON public.blog_comments FOR SELECT
USING (status = 'approved');

-- Admins can view all comments
CREATE POLICY "Admins can view all comments"
ON public.blog_comments FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert comments (pending)
CREATE POLICY "Anyone can submit comments"
ON public.blog_comments FOR INSERT
WITH CHECK (status = 'pending');

-- Admins can update comments (moderation)
CREATE POLICY "Admins can moderate comments"
ON public.blog_comments FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete comments
CREATE POLICY "Admins can delete comments"
ON public.blog_comments FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Update blog_posts RLS - drop old permissive policies and create granular ones
-- First drop existing policies that might conflict
DROP POLICY IF EXISTS "Authors can manage their posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Blog editors can manage posts" ON public.blog_posts;

-- Everyone can read published posts
-- (keep existing policy if it exists)
DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.blog_posts;
CREATE POLICY "Published posts are viewable by everyone"
ON public.blog_posts FOR SELECT
USING (status = 'published');

-- Admins can view all posts
DROP POLICY IF EXISTS "Admins can view all posts" ON public.blog_posts;
CREATE POLICY "Admins can view all posts"
ON public.blog_posts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Blog editors can view their own posts
CREATE POLICY "Blog editors can view their own posts"
ON public.blog_posts FOR SELECT
TO authenticated
USING (
  author_id = auth.uid() 
  AND public.has_role(auth.uid(), 'blog_editor')
);

-- Admins can insert posts
DROP POLICY IF EXISTS "Admins can manage all posts" ON public.blog_posts;
CREATE POLICY "Admins can insert posts"
ON public.blog_posts FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Blog editors can insert their own posts
CREATE POLICY "Blog editors can insert posts"
ON public.blog_posts FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND public.has_role(auth.uid(), 'blog_editor')
);

-- Admins can update any post
CREATE POLICY "Admins can update any post"
ON public.blog_posts FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Blog editors can update their own posts
CREATE POLICY "Blog editors can update their own posts"
ON public.blog_posts FOR UPDATE
TO authenticated
USING (
  author_id = auth.uid()
  AND public.has_role(auth.uid(), 'blog_editor')
)
WITH CHECK (
  author_id = auth.uid()
  AND public.has_role(auth.uid(), 'blog_editor')
);

-- Only admins can delete posts
CREATE POLICY "Only admins can delete posts"
ON public.blog_posts FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Create index for blog_comments
CREATE INDEX idx_blog_comments_post_id ON public.blog_comments(post_id);
CREATE INDEX idx_blog_comments_status ON public.blog_comments(status);
CREATE INDEX idx_blog_authors_user_id ON public.blog_authors(user_id);
CREATE INDEX idx_blog_posts_author_profile_id ON public.blog_posts(author_profile_id);
