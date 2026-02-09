-- Drop the trigger that uses pg_net (which is not available)
DROP TRIGGER IF EXISTS trigger_send_ambassador_payout_email ON public.ambassador_payouts;

-- Drop the function that uses net schema
DROP FUNCTION IF EXISTS public.send_ambassador_payout_email();