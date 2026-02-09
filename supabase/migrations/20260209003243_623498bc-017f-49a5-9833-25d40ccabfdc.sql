-- Add 'refunded' status to the ambassador_payouts status options
-- (The status column is TEXT so we just need to handle it in code)

-- Create function to handle payout refund and reverse values
CREATE OR REPLACE FUNCTION public.process_ambassador_payout_refund()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process when status changes to 'refunded'
  IF NEW.status = 'refunded' AND OLD.status != 'refunded' THEN
    -- Reverse the values on the ambassador record
    UPDATE public.ambassadors
    SET
      pending_commission = COALESCE(pending_commission, 0) + NEW.net_amount,
      total_earnings = GREATEST(0, COALESCE(total_earnings, 0) - NEW.net_amount),
      updated_at = now()
    WHERE id = NEW.ambassador_id;
    
    -- Create in-app notification for the ambassador
    INSERT INTO public.ambassador_notifications (
      ambassador_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      NEW.ambassador_id,
      'payment_refunded',
      'Pagamento Estornado',
      'O pagamento referente a ' || NEW.reference_period || ' no valor de R$ ' || 
        ROUND(NEW.net_amount::numeric, 2)::text || ' foi estornado.',
      jsonb_build_object(
        'payout_id', NEW.id,
        'reference_period', NEW.reference_period,
        'net_amount', NEW.net_amount,
        'refunded_at', NEW.updated_at
      )
    );
    
    RAISE LOG 'Ambassador payout refunded: payout_id=%, ambassador_id=%, amount=%', 
      NEW.id, NEW.ambassador_id, NEW.net_amount;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for payout refund
DROP TRIGGER IF EXISTS trigger_process_ambassador_payout_refund ON public.ambassador_payouts;
CREATE TRIGGER trigger_process_ambassador_payout_refund
  AFTER UPDATE ON public.ambassador_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.process_ambassador_payout_refund();