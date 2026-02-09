-- Create function to update ambassador stats when payout is paid
CREATE OR REPLACE FUNCTION public.process_ambassador_payout_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process when status changes to 'paid'
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    -- Update ambassador: add to total_earnings, subtract from pending_commission
    UPDATE public.ambassadors
    SET
      total_earnings = COALESCE(total_earnings, 0) + NEW.net_amount,
      pending_commission = GREATEST(0, COALESCE(pending_commission, 0) - NEW.net_amount),
      updated_at = now()
    WHERE id = NEW.ambassador_id;
    
    RAISE LOG 'Ambassador payout paid: payout_id=%, ambassador_id=%, amount=%, total_earnings updated', 
      NEW.id, NEW.ambassador_id, NEW.net_amount;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for payout paid (runs BEFORE the refund trigger)
DROP TRIGGER IF EXISTS trigger_process_ambassador_payout_paid ON public.ambassador_payouts;
CREATE TRIGGER trigger_process_ambassador_payout_paid
  AFTER UPDATE ON public.ambassador_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.process_ambassador_payout_paid();

-- Also handle the case when a payout is created directly with 'paid' status (edge case)
-- And ensure proper tracking when payouts are created
CREATE OR REPLACE FUNCTION public.track_ambassador_payout_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If payout is created directly as 'paid', update earnings immediately
  IF NEW.status = 'paid' THEN
    UPDATE public.ambassadors
    SET
      total_earnings = COALESCE(total_earnings, 0) + NEW.net_amount,
      pending_commission = GREATEST(0, COALESCE(pending_commission, 0) - NEW.net_amount),
      updated_at = now()
    WHERE id = NEW.ambassador_id;
    
    RAISE LOG 'Ambassador payout created as paid: payout_id=%, ambassador_id=%, amount=%', 
      NEW.id, NEW.ambassador_id, NEW.net_amount;
  END IF;
  
  -- Create in-app notification for the ambassador
  IF NEW.status = 'pending' THEN
    INSERT INTO public.ambassador_notifications (
      ambassador_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      NEW.ambassador_id,
      'payment_registered',
      'Pagamento Registrado',
      'Um pagamento de R$ ' || ROUND(NEW.net_amount::numeric, 2)::text || 
        ' referente a ' || NEW.reference_period || ' foi registrado e está pendente.',
      jsonb_build_object(
        'payout_id', NEW.id,
        'reference_period', NEW.reference_period,
        'net_amount', NEW.net_amount
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_track_ambassador_payout_created ON public.ambassador_payouts;
CREATE TRIGGER trigger_track_ambassador_payout_created
  AFTER INSERT ON public.ambassador_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.track_ambassador_payout_created();

-- Create notification when payout is marked as paid
CREATE OR REPLACE FUNCTION public.notify_ambassador_payout_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create notification when payment is confirmed
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    INSERT INTO public.ambassador_notifications (
      ambassador_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      NEW.ambassador_id,
      'payment_confirmed',
      'Pagamento Confirmado! 🎉',
      'Seu pagamento de R$ ' || ROUND(NEW.net_amount::numeric, 2)::text || 
        ' referente a ' || NEW.reference_period || ' foi confirmado.',
      jsonb_build_object(
        'payout_id', NEW.id,
        'reference_period', NEW.reference_period,
        'net_amount', NEW.net_amount,
        'paid_at', NEW.paid_at,
        'payment_method', NEW.payment_method
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_ambassador_payout_paid ON public.ambassador_payouts;
CREATE TRIGGER trigger_notify_ambassador_payout_paid
  AFTER UPDATE ON public.ambassador_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ambassador_payout_paid();