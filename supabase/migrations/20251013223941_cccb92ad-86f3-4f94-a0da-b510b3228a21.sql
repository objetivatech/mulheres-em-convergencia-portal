-- ============================================
-- CORREÇÃO: Sistema Unificado de Roles
-- ============================================

-- 1. Dropar função antiga para recriar com nova assinatura
DROP FUNCTION IF EXISTS public.get_profiles_admin_safe(integer, integer);

-- 2. Migrar dados de is_admin para user_roles
INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT id, 'admin'::app_role, id
FROM public.profiles
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Migrar dados de can_edit_blog para user_roles  
INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT id, 'blog_editor'::app_role, id
FROM public.profiles
WHERE can_edit_blog = true
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Criar nova função que retorna roles de user_roles
CREATE OR REPLACE FUNCTION public.get_profiles_admin_safe(
  p_limit INTEGER DEFAULT 500,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  roles app_role[],
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT get_current_user_admin_status() THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    COALESCE(ARRAY_AGG(ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') AS roles,
    p.created_at
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id
  GROUP BY p.id, p.email, p.full_name, p.created_at
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 5. Adicionar comentários
COMMENT ON FUNCTION public.get_profiles_admin_safe IS 'Retorna perfis com roles da tabela user_roles - sistema unificado';
COMMENT ON TABLE public.user_roles IS 'Tabela central de roles. Todas as permissões devem ser gerenciadas aqui';