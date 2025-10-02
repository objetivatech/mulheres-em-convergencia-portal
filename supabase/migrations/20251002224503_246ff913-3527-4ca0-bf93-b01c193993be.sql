-- =============================================
-- MIGRATION: Secure Role Infrastructure & Complimentary Billing Protection
-- =============================================

-- 1. CREATE ROLE ENUM (if not exists)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'admin',
    'blog_editor',
    'business_owner',
    'subscriber',
    'ambassador',
    'author'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. CREATE USER_ROLES TABLE
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. CREATE SECURITY DEFINER FUNCTION TO CHECK ROLES
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  );
$$;

-- 4. MIGRATE EXISTING is_admin AND can_edit_blog TO ROLES
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.profiles
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'blog_editor'::app_role
FROM public.profiles
WHERE can_edit_blog = true
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 6. RLS POLICIES FOR USER_ROLES
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. UPDATE BUSINESSES RLS TO ALLOW ADMIN ACCESS
DROP POLICY IF EXISTS "Business owners can manage their businesses" ON public.businesses;
CREATE POLICY "Business owners can manage their businesses"
ON public.businesses
FOR ALL
TO authenticated
USING (
  owner_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can view all businesses" ON public.businesses;
CREATE POLICY "Admins can view all businesses"
ON public.businesses
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 8. UPDATE get_current_user_admin_status TO USE ROLES
CREATE OR REPLACE FUNCTION public.get_current_user_admin_status()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role);
$$;

-- 9. UPDATE get_current_user_blog_edit_status TO USE ROLES
CREATE OR REPLACE FUNCTION public.get_current_user_blog_edit_status()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'blog_editor'::app_role) 
     OR public.has_role(auth.uid(), 'admin'::app_role);
$$;

-- 10. CREATE WEBHOOK EVENTS LOG TABLE (if not exists)
CREATE TABLE IF NOT EXISTS public.webhook_events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  subscription_id TEXT,
  event_type TEXT NOT NULL,
  webhook_data JSONB,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, payment_id)
);

ALTER TABLE public.webhook_events_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view webhook logs" ON public.webhook_events_log;
CREATE POLICY "Admins can view webhook logs"
ON public.webhook_events_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 11. CREATE FUNCTION TO ADD USER ROLES
CREATE OR REPLACE FUNCTION public.add_user_role_secure(
  target_user_id UUID,
  new_role app_role
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (target_user_id, new_role, auth.uid())
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;

-- 12. CREATE FUNCTION TO REMOVE USER ROLES
CREATE OR REPLACE FUNCTION public.remove_user_role_secure(
  target_user_id UUID,
  old_role app_role
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  IF target_user_id = auth.uid() AND old_role = 'admin'::app_role THEN
    RAISE EXCEPTION 'Cannot remove your own admin privileges';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = old_role;

  RETURN true;
END;
$$;

-- 13. CREATE COMPLIMENTARY BUSINESS AUDIT LOG
CREATE TABLE IF NOT EXISTS public.complimentary_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  previous_value BOOLEAN NOT NULL,
  new_value BOOLEAN NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.complimentary_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view complimentary audit log" ON public.complimentary_audit_log;
CREATE POLICY "Admins can view complimentary audit log"
ON public.complimentary_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 14. CREATE TRIGGER TO LOG COMPLIMENTARY STATUS CHANGES
CREATE OR REPLACE FUNCTION public.log_complimentary_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_complimentary IS DISTINCT FROM NEW.is_complimentary THEN
    INSERT INTO public.complimentary_audit_log (
      business_id,
      admin_id,
      action,
      previous_value,
      new_value
    ) VALUES (
      NEW.id,
      auth.uid(),
      CASE WHEN NEW.is_complimentary THEN 'enabled' ELSE 'disabled' END,
      COALESCE(OLD.is_complimentary, false),
      NEW.is_complimentary
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS track_complimentary_changes ON public.businesses;
CREATE TRIGGER track_complimentary_changes
AFTER UPDATE ON public.businesses
FOR EACH ROW
WHEN (OLD.is_complimentary IS DISTINCT FROM NEW.is_complimentary)
EXECUTE FUNCTION public.log_complimentary_change();

-- 15. UPDATE is_business_active FUNCTION
CREATE OR REPLACE FUNCTION public.is_business_active(business_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT 
        CASE
          WHEN is_complimentary = true THEN true
          WHEN subscription_active = true 
            AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())
          THEN true
          ELSE false
        END
      FROM public.businesses
      WHERE id = business_uuid
    ),
    false
  );
$$;