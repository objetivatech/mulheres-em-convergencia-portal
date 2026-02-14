
-- 2. Academy Categories
CREATE TABLE public.academy_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  category_type TEXT NOT NULL CHECK (category_type IN ('material_type', 'subject')),
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.academy_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read academy categories" ON public.academy_categories
  FOR SELECT USING (active = true);

CREATE POLICY "Admins manage academy categories" ON public.academy_categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 3. Academy Courses
CREATE TABLE public.academy_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  long_description TEXT,
  thumbnail_url TEXT,
  material_type_id UUID REFERENCES public.academy_categories(id),
  subject_id UUID REFERENCES public.academy_categories(id),
  instructor_name TEXT,
  instructor_bio TEXT,
  instructor_avatar_url TEXT,
  is_standalone_lesson BOOLEAN DEFAULT false,
  is_free BOOLEAN DEFAULT false,
  allowed_roles TEXT[] DEFAULT '{}',
  show_on_landing BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  total_duration_minutes INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published courses" ON public.academy_courses
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins manage courses" ON public.academy_courses
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 4. Academy Lessons
CREATE TABLE public.academy_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('youtube', 'pdf', 'image')),
  content_url TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read lessons of published courses" ON public.academy_lessons
  FOR SELECT USING (
    active = true AND EXISTS (
      SELECT 1 FROM public.academy_courses c WHERE c.id = course_id AND c.status = 'published'
    )
  );

CREATE POLICY "Admins manage lessons" ON public.academy_lessons
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 5. Academy Enrollments
CREATE TABLE public.academy_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  source TEXT DEFAULT 'organic',
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own enrollments" ON public.academy_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own enrollments" ON public.academy_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own enrollments" ON public.academy_enrollments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins manage enrollments" ON public.academy_enrollments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 6. Academy Progress
CREATE TABLE public.academy_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.academy_lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.academy_courses(id),
  completed BOOLEAN DEFAULT false,
  progress_pct INTEGER DEFAULT 0,
  last_position INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own progress" ON public.academy_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users upsert own progress" ON public.academy_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own progress" ON public.academy_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins read all progress" ON public.academy_progress
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 7. Academy Subscriptions
CREATE TABLE public.academy_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  asaas_subscription_id TEXT,
  asaas_customer_id TEXT,
  billing_cycle TEXT DEFAULT 'monthly',
  price DECIMAL(10,2) DEFAULT 29.90,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.academy_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own academy sub" ON public.academy_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins manage academy subs" ON public.academy_subscriptions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Service role insert for webhook
CREATE POLICY "Service insert academy subs" ON public.academy_subscriptions
  FOR INSERT WITH CHECK (true);

-- 8. Insert initial categories
INSERT INTO public.academy_categories (name, slug, category_type, icon, display_order) VALUES
  ('Curso', 'curso', 'material_type', 'BookOpen', 1),
  ('Workshop', 'workshop', 'material_type', 'Wrench', 2),
  ('Masterclass', 'masterclass', 'material_type', 'GraduationCap', 3),
  ('Palestra', 'palestra', 'material_type', 'Mic', 4),
  ('Material de Apoio', 'material-de-apoio', 'material_type', 'FileText', 5),
  ('Marketing', 'marketing', 'subject', 'Megaphone', 1),
  ('Empreendedorismo', 'empreendedorismo', 'subject', 'Rocket', 2),
  ('Finanças', 'financas', 'subject', 'DollarSign', 3),
  ('Liderança', 'lideranca', 'subject', 'Users', 4),
  ('Desenvolvimento Pessoal', 'desenvolvimento-pessoal', 'subject', 'Heart', 5),
  ('Tecnologia', 'tecnologia', 'subject', 'Laptop', 6);

-- 9. Updated_at triggers
CREATE TRIGGER update_academy_courses_updated_at
  BEFORE UPDATE ON public.academy_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academy_lessons_updated_at
  BEFORE UPDATE ON public.academy_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academy_subscriptions_updated_at
  BEFORE UPDATE ON public.academy_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academy_progress_updated_at
  BEFORE UPDATE ON public.academy_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Security definer function to check academy access
CREATE OR REPLACE FUNCTION public.has_academy_access(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.has_role(_user_id, 'admin') THEN 'full'
    WHEN public.has_role(_user_id, 'business_owner') THEN 'full'
    WHEN public.has_role(_user_id, 'ambassador') THEN 'full'
    WHEN EXISTS (
      SELECT 1 FROM public.academy_subscriptions
      WHERE user_id = _user_id AND status = 'active'
    ) THEN 'subscriber'
    WHEN public.has_role(_user_id, 'student') THEN 'free'
    ELSE 'none'
  END
$$;

-- 11. Function to enroll as free student
CREATE OR REPLACE FUNCTION public.enroll_as_free_student(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add student role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
