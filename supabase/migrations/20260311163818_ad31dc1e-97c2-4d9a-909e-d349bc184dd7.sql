
-- Validation trigger: Ambassador can only be active if user has a business with subscription_active = true
CREATE OR REPLACE FUNCTION public.validate_ambassador_business_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only validate when setting active = true
  IF NEW.active = true THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.businesses
      WHERE owner_id = NEW.user_id
        AND subscription_active = true
    ) THEN
      RAISE EXCEPTION 'Embaixadora requer um negócio com assinatura ativa no diretório';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_validate_ambassador_business ON public.ambassadors;

-- Create trigger on INSERT and UPDATE
CREATE TRIGGER trg_validate_ambassador_business
  BEFORE INSERT OR UPDATE ON public.ambassadors
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ambassador_business_subscription();
