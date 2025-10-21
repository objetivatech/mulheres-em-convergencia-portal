-- ============================================
-- SINCRONIZAÇÃO: Roles de Admin e Blog Editor
-- Data: 21/10/2025
-- ============================================

-- 1. Re-sincronizar todos os usuários com is_admin = true
INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT id, 'admin'::app_role, id
FROM public.profiles
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Re-sincronizar todos os usuários com can_edit_blog = true
INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT id, 'blog_editor'::app_role, id
FROM public.profiles
WHERE can_edit_blog = true
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Criar trigger para manter sincronização automática
CREATE OR REPLACE FUNCTION sync_profile_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Se is_admin foi ativado, adicionar role admin
  IF NEW.is_admin = true AND (OLD.is_admin IS NULL OR OLD.is_admin = false) THEN
    INSERT INTO public.user_roles (user_id, role, granted_by)
    VALUES (NEW.id, 'admin'::app_role, NEW.id)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Se is_admin foi desativado, remover role admin
  IF NEW.is_admin = false AND OLD.is_admin = true THEN
    DELETE FROM public.user_roles
    WHERE user_id = NEW.id AND role = 'admin'::app_role;
  END IF;

  -- Se can_edit_blog foi ativado, adicionar role blog_editor
  IF NEW.can_edit_blog = true AND (OLD.can_edit_blog IS NULL OR OLD.can_edit_blog = false) THEN
    INSERT INTO public.user_roles (user_id, role, granted_by)
    VALUES (NEW.id, 'blog_editor'::app_role, NEW.id)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Se can_edit_blog foi desativado, remover role blog_editor
  IF NEW.can_edit_blog = false AND OLD.can_edit_blog = true THEN
    DELETE FROM public.user_roles
    WHERE user_id = NEW.id AND role = 'blog_editor'::app_role;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger na tabela profiles
DROP TRIGGER IF EXISTS sync_profile_roles_trigger ON public.profiles;
CREATE TRIGGER sync_profile_roles_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.is_admin IS DISTINCT FROM NEW.is_admin OR OLD.can_edit_blog IS DISTINCT FROM NEW.can_edit_blog)
  EXECUTE FUNCTION sync_profile_roles();

-- 5. Adicionar comentários
COMMENT ON FUNCTION sync_profile_roles IS 'Mantém sincronização automática entre profiles.is_admin/can_edit_blog e user_roles';
COMMENT ON TRIGGER sync_profile_roles_trigger ON public.profiles IS 'Trigger para sincronizar roles automaticamente';
