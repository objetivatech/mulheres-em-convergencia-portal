-- Restrict validation to actual transitions to active=true (avoids blocking unrelated updates)
CREATE OR REPLACE FUNCTION public.validate_ambassador_business_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.active = true AND (TG_OP = 'INSERT' OR COALESCE(OLD.active, false) = false) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.businesses
      WHERE owner_id = NEW.user_id AND subscription_active = true
    ) THEN
      RAISE EXCEPTION 'Embaixadora requer um negócio com assinatura ativa no diretório';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Sync profile -> ambassadors.public_* (non-destructive)
CREATE OR REPLACE FUNCTION public.sync_profile_to_ambassador()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  UPDATE public.ambassadors a SET
    public_name          = COALESCE(a.public_name,          NEW.full_name),
    public_photo_url     = COALESCE(a.public_photo_url,     NEW.avatar_url),
    public_bio           = COALESCE(a.public_bio,           NEW.public_bio, NEW.bio),
    public_city          = COALESCE(a.public_city,          NEW.city),
    public_state         = COALESCE(a.public_state,         NEW.state),
    public_instagram_url = COALESCE(a.public_instagram_url, NEW.instagram_url),
    public_linkedin_url  = COALESCE(a.public_linkedin_url,  NEW.linkedin_url),
    public_website_url   = COALESCE(a.public_website_url,   NEW.website_url),
    updated_at = now()
  WHERE a.user_id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_to_ambassador ON public.profiles;
CREATE TRIGGER trg_sync_profile_to_ambassador
AFTER INSERT OR UPDATE OF full_name, avatar_url, bio, public_bio, city, state, instagram_url, linkedin_url, website_url
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_ambassador();

-- Backfill from profile on new ambassador insert
CREATE OR REPLACE FUNCTION public.backfill_ambassador_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  p RECORD;
BEGIN
  SELECT full_name, avatar_url, bio, public_bio, city, state,
         instagram_url, linkedin_url, website_url
    INTO p
  FROM public.profiles WHERE id = NEW.user_id;

  IF FOUND THEN
    NEW.public_name          := COALESCE(NEW.public_name,          p.full_name);
    NEW.public_photo_url     := COALESCE(NEW.public_photo_url,     p.avatar_url);
    NEW.public_bio           := COALESCE(NEW.public_bio,           p.public_bio, p.bio);
    NEW.public_city          := COALESCE(NEW.public_city,          p.city);
    NEW.public_state         := COALESCE(NEW.public_state,         p.state);
    NEW.public_instagram_url := COALESCE(NEW.public_instagram_url, p.instagram_url);
    NEW.public_linkedin_url  := COALESCE(NEW.public_linkedin_url,  p.linkedin_url);
    NEW.public_website_url   := COALESCE(NEW.public_website_url,   p.website_url);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_backfill_ambassador_from_profile ON public.ambassadors;
CREATE TRIGGER trg_backfill_ambassador_from_profile
BEFORE INSERT ON public.ambassadors
FOR EACH ROW
EXECUTE FUNCTION public.backfill_ambassador_from_profile();

-- One-time backfill
UPDATE public.ambassadors a SET
  public_name          = COALESCE(a.public_name,          p.full_name),
  public_photo_url     = COALESCE(a.public_photo_url,     p.avatar_url),
  public_bio           = COALESCE(a.public_bio,           p.public_bio, p.bio),
  public_city          = COALESCE(a.public_city,          p.city),
  public_state         = COALESCE(a.public_state,         p.state),
  public_instagram_url = COALESCE(a.public_instagram_url, p.instagram_url),
  public_linkedin_url  = COALESCE(a.public_linkedin_url,  p.linkedin_url),
  public_website_url   = COALESCE(a.public_website_url,   p.website_url),
  updated_at = now()
FROM public.profiles p
WHERE p.id = a.user_id
  AND (
    a.public_name IS NULL OR a.public_photo_url IS NULL OR a.public_bio IS NULL
    OR a.public_city IS NULL OR a.public_state IS NULL
    OR a.public_instagram_url IS NULL OR a.public_linkedin_url IS NULL OR a.public_website_url IS NULL
  );