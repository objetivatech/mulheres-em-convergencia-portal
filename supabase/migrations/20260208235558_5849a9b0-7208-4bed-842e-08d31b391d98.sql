-- Tabela de notificações para embaixadoras
CREATE TABLE public.ambassador_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambassador_id UUID NOT NULL REFERENCES public.ambassadors(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'payment_registered', 'payment_confirmed', 'commission_earned', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_ambassador_notifications_ambassador_id ON public.ambassador_notifications(ambassador_id);
CREATE INDEX idx_ambassador_notifications_read ON public.ambassador_notifications(ambassador_id, read);
CREATE INDEX idx_ambassador_notifications_created_at ON public.ambassador_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.ambassador_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Ambassadors can view their own notifications"
  ON public.ambassador_notifications
  FOR SELECT
  USING (ambassador_id IN (
    SELECT id FROM ambassadors WHERE user_id = auth.uid()
  ));

CREATE POLICY "Ambassadors can update their own notifications"
  ON public.ambassador_notifications
  FOR UPDATE
  USING (ambassador_id IN (
    SELECT id FROM ambassadors WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all notifications"
  ON public.ambassador_notifications
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Função para criar notificação de pagamento
CREATE OR REPLACE FUNCTION public.notify_ambassador_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um pagamento é marcado como pago
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    INSERT INTO public.ambassador_notifications (
      ambassador_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      NEW.ambassador_id,
      'payment_confirmed',
      'Pagamento Confirmado! 💰',
      'Seu pagamento de R$ ' || REPLACE(TO_CHAR(NEW.net_amount, 'FM999G999D00'), '.', ',') || ' referente ao período ' || NEW.reference_period || ' foi confirmado.',
      jsonb_build_object(
        'payout_id', NEW.id,
        'amount', NEW.net_amount,
        'reference_period', NEW.reference_period,
        'payment_method', NEW.payment_method,
        'paid_at', NEW.paid_at
      )
    );
  END IF;
  
  -- Quando um pagamento é registrado/agendado
  IF NEW.status = 'pending' AND OLD IS NULL THEN
    INSERT INTO public.ambassador_notifications (
      ambassador_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      NEW.ambassador_id,
      'payment_registered',
      'Novo Pagamento Registrado 📋',
      'Um pagamento de R$ ' || REPLACE(TO_CHAR(NEW.net_amount, 'FM999G999D00'), '.', ',') || ' foi registrado para o período ' || NEW.reference_period || '.',
      jsonb_build_object(
        'payout_id', NEW.id,
        'amount', NEW.net_amount,
        'reference_period', NEW.reference_period,
        'scheduled_date', NEW.scheduled_date
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para notificações automáticas
CREATE TRIGGER trigger_notify_ambassador_payment
  AFTER INSERT OR UPDATE ON public.ambassador_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ambassador_payment();