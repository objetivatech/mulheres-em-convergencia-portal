-- Criar tabela para logs de webhook (idempotência)
CREATE TABLE IF NOT EXISTS public.webhook_events_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  payment_id TEXT,
  subscription_id TEXT,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  webhook_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_log_event_payment 
ON public.webhook_events_log (event_id, payment_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_log_subscription 
ON public.webhook_events_log (subscription_id);

-- Enable RLS
ALTER TABLE public.webhook_events_log ENABLE ROW LEVEL SECURITY;

-- Policy para permitir inserção por edge functions
CREATE POLICY "Edge functions can insert webhook logs" 
ON public.webhook_events_log 
FOR INSERT 
WITH CHECK (true);

-- Policy para admins visualizarem logs
CREATE POLICY "Admins can view webhook logs" 
ON public.webhook_events_log 
FOR SELECT 
USING (get_current_user_admin_status());