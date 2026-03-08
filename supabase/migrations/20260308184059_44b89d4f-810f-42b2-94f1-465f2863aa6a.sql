
-- ============================================
-- Etapa 1: Atribuição automática de community_member
-- Etapa 6: Validação de consistência de roles
-- + RPC get_user_roles para o frontend
-- ============================================

-- 1. Função para atribuir community_member automaticamente a novos usuários
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'community_member'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger: após inserir um profile (que é criado via trigger on auth.users)
DROP TRIGGER IF EXISTS trigger_assign_default_role ON public.profiles;
CREATE TRIGGER trigger_assign_default_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_role();

-- 2. Função para sincronizar subscriber role quando newsletter_subscribed muda
CREATE OR REPLACE FUNCTION public.sync_newsletter_subscriber_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.newsletter_subscribed = true AND (OLD.newsletter_subscribed IS DISTINCT FROM true) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'subscriber'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  IF NEW.newsletter_subscribed = false AND OLD.newsletter_subscribed = true THEN
    DELETE FROM public.user_roles
    WHERE user_id = NEW.id AND role = 'subscriber'::app_role;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_newsletter_subscriber ON public.profiles;
CREATE TRIGGER trigger_sync_newsletter_subscriber
  AFTER UPDATE OF newsletter_subscribed ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_newsletter_subscriber_role();

-- 3. Validação de consistência: garantir community_member quando roles dependentes existem
CREATE OR REPLACE FUNCTION public.validate_role_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dependent_roles app_role[] := ARRAY['business_owner', 'ambassador', 'student', 'blog_editor', 'admin']::app_role[];
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Se inseriu uma role dependente, garantir que community_member existe
    IF NEW.role = ANY(dependent_roles) THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, 'community_member'::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Não permitir remover community_member se existem roles dependentes
    IF OLD.role = 'community_member'::app_role THEN
      IF EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = OLD.user_id
        AND role = ANY(dependent_roles)
      ) THEN
        RAISE EXCEPTION 'Cannot remove community_member role while dependent roles exist';
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_validate_role_consistency ON public.user_roles;
CREATE TRIGGER trigger_validate_role_consistency
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_consistency();

-- 4. RPC para buscar todas as roles de um usuário (para o frontend)
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(role::text),
    ARRAY[]::text[]
  )
  FROM public.user_roles
  WHERE user_id = _user_id;
$$;

-- 5. Atribuir community_member a todos os usuários existentes que ainda não têm
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'community_member'::app_role
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.id AND ur.role = 'community_member'::app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Atribuir subscriber a quem já tem newsletter_subscribed = true
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'subscriber'::app_role
FROM public.profiles p
WHERE p.newsletter_subscribed = true
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.id AND ur.role = 'subscriber'::app_role
)
ON CONFLICT (user_id, role) DO NOTHING;
