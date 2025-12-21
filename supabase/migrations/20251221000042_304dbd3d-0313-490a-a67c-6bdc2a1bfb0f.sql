-- MIGRAÇÃO 1: ADICIONAR NOVOS VALORES AO ENUM app_role
-- Estes valores precisam ser commitados antes de usar nas policies
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'donor';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sponsor';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'mentor';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'volunteer';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'partner';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'project_client';