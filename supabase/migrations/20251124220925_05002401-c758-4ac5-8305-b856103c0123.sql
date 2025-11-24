-- Migração: Funções para Sistema de Comunidades (v2 - com DROP)
-- Data: 2025-01-26
-- Descrição: Criar funções para aprovação de solicitações de comunidades e detalhes de comunidades

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.approve_community_request(uuid, text);
DROP FUNCTION IF EXISTS public.reject_community_request(uuid, text);

-- Função para obter detalhes de uma comunidade com negócios vinculados
CREATE OR REPLACE FUNCTION public.get_community_details(community_uuid uuid)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  active boolean,
  created_at timestamp with time zone,
  total_businesses bigint,
  categories_represented text[],
  total_views bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.active,
    c.created_at,
    COUNT(DISTINCT b.id) as total_businesses,
    ARRAY_AGG(DISTINCT b.category::text) FILTER (WHERE b.category IS NOT NULL) as categories_represented,
    COALESCE(SUM(b.views_count), 0) as total_views
  FROM communities c
  LEFT JOIN businesses b ON b.community_id = c.id AND b.subscription_active = true
  WHERE c.id = community_uuid
  GROUP BY c.id, c.name, c.description, c.active, c.created_at;
END;
$$;

-- Função para aprovar solicitação de comunidade (cria comunidade e vincula negócio)
CREATE OR REPLACE FUNCTION public.approve_community_request(
  request_id uuid,
  admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_record RECORD;
  new_community_id uuid;
BEGIN
  -- Verificar se é admin
  IF NOT get_current_user_admin_status() THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  -- Buscar solicitação
  SELECT * INTO request_record
  FROM community_requests
  WHERE id = request_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Solicitação não encontrada ou já processada'
    );
  END IF;

  -- Verificar se comunidade já existe com este nome
  SELECT id INTO new_community_id
  FROM communities
  WHERE LOWER(name) = LOWER(request_record.requested_name);

  -- Se não existe, criar nova comunidade
  IF new_community_id IS NULL THEN
    INSERT INTO communities (name, description, active)
    VALUES (
      request_record.requested_name,
      request_record.description,
      true
    )
    RETURNING id INTO new_community_id;
  END IF;

  -- Vincular negócio à comunidade
  UPDATE businesses
  SET community_id = new_community_id,
      updated_at = now()
  WHERE id = request_record.business_id;

  -- Atualizar solicitação como aprovada
  UPDATE community_requests
  SET status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      admin_notes = admin_notes,
      updated_at = now()
  WHERE id = request_id;

  -- Log da atividade
  PERFORM log_user_activity(
    auth.uid(),
    'community_request_approved',
    format('Solicitação de comunidade aprovada: %s', request_record.requested_name),
    jsonb_build_object(
      'request_id', request_id,
      'community_id', new_community_id,
      'business_id', request_record.business_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'community_id', new_community_id,
    'community_name', request_record.requested_name
  );
END;
$$;

-- Função para rejeitar solicitação de comunidade
CREATE OR REPLACE FUNCTION public.reject_community_request(
  request_id uuid,
  admin_notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT get_current_user_admin_status() THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  -- Atualizar solicitação como rejeitada
  UPDATE community_requests
  SET status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      admin_notes = admin_notes,
      updated_at = now()
  WHERE id = request_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Solicitação não encontrada ou já processada'
    );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;