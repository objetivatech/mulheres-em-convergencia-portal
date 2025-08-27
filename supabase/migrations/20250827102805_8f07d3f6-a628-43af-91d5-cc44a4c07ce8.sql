-- Verificar e criar tipos apenas se não existem
DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('individual', 'business', 'community');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_type AS ENUM ('newsletter', 'loja', 'comunidade', 'negocio', 'embaixadora');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar campos na tabela profiles se não existem
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_types user_type[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS subscription_types subscription_type[] DEFAULT '{}';

-- Tabela de permissões específicas para usuários
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_name text NOT NULL,
  granted_by uuid REFERENCES profiles(id),
  granted_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  active boolean DEFAULT true
);

-- Habilitar RLS na tabela user_permissions
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_permissions (apenas se não existem)
DO $$ BEGIN
    CREATE POLICY "Users can view their own permissions" ON user_permissions
      FOR SELECT USING (user_id = auth.uid());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can manage all permissions" ON user_permissions
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND is_admin = true
        )
      );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Função para verificar se usuário tem role específico
CREATE OR REPLACE FUNCTION user_has_role(user_uuid uuid, role_name user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_uuid 
    AND role_name = ANY(roles)
  );
END;
$$;

-- Função para verificar permissões específicas
CREATE OR REPLACE FUNCTION user_has_permission(user_uuid uuid, permission_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = user_uuid 
    AND permission_name = $2
    AND active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;

-- Função para adicionar role a um usuário
CREATE OR REPLACE FUNCTION add_user_role(user_uuid uuid, new_role user_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE profiles 
  SET roles = array_append(roles, new_role)
  WHERE id = user_uuid 
  AND NOT (new_role = ANY(roles));
END;
$$;

-- Função para remover role de um usuário
CREATE OR REPLACE FUNCTION remove_user_role(user_uuid uuid, old_role user_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE profiles 
  SET roles = array_remove(roles, old_role)
  WHERE id = user_uuid;
END;
$$;