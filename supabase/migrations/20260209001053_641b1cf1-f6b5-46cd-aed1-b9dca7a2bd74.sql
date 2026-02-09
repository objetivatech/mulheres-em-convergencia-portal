-- Trigger function to send email when payout status changes to 'paid'
CREATE OR REPLACE FUNCTION public.send_ambassador_payout_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  edge_function_url TEXT;
BEGIN
  -- Only send email when status changes to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
    -- Construct edge function URL
    edge_function_url := 'https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/send-ambassador-payout-email';
    
    -- Call the edge function asynchronously via pg_net
    PERFORM net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'payout_id', NEW.id::text,
        'action', 'paid'
      )
    );
    
    RAISE LOG 'Ambassador payout email trigger fired for payout_id: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE LOG 'Error in send_ambassador_payout_email trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on ambassador_payouts table
DROP TRIGGER IF EXISTS trigger_send_ambassador_payout_email ON public.ambassador_payouts;

CREATE TRIGGER trigger_send_ambassador_payout_email
  AFTER INSERT OR UPDATE OF status ON public.ambassador_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.send_ambassador_payout_email();

-- Add comment for documentation
COMMENT ON FUNCTION public.send_ambassador_payout_email() IS 'Sends email notification to ambassador when payout status changes to paid';