-- Adicionar valores faltantes ao enum app_role
DO $$ 
BEGIN
  -- Adicionar 'customer' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'public.app_role'::regtype 
    AND enumlabel = 'customer'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'customer';
  END IF;

  -- Adicionar 'subscriber' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'public.app_role'::regtype 
    AND enumlabel = 'subscriber'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'subscriber';
  END IF;

  -- Adicionar 'community_member' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'public.app_role'::regtype 
    AND enumlabel = 'community_member'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'community_member';
  END IF;
END $$;