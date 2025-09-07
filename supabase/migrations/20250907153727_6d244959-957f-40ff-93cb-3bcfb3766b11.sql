-- Phase 1: Database fixes for subscription creation issues

-- 1. Backfill profiles for existing users missing them
INSERT INTO public.profiles (id, email, full_name, cpf)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  '' -- Empty CPF to avoid constraint violation
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 2. Create trigger to automatically create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, cpf)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'cpf', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    cpf = CASE 
      WHEN profiles.cpf = '' OR profiles.cpf IS NULL 
      THEN COALESCE(EXCLUDED.cpf, profiles.cpf)
      ELSE profiles.cpf
    END,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Install the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create index for better performance on user_subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id 
ON public.user_subscriptions(user_id);

-- 4. Create index for better performance on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON public.profiles(email);