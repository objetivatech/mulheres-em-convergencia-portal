-- Fix: Add UNIQUE constraint on ambassadors.user_id so the trigger's ON CONFLICT works
ALTER TABLE public.ambassadors ADD CONSTRAINT ambassadors_user_id_unique UNIQUE (user_id);