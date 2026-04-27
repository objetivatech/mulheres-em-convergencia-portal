-- Tabela para solicitações de troca de email com verificação
CREATE TABLE IF NOT EXISTS public.email_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_email TEXT NOT NULL,
  new_email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_change_requests_token ON public.email_change_requests(token);
CREATE INDEX IF NOT EXISTS idx_email_change_requests_user_status ON public.email_change_requests(user_id, status);

-- Garante apenas uma solicitação pendente por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_change_one_pending_per_user
  ON public.email_change_requests(user_id)
  WHERE status = 'pending';

ALTER TABLE public.email_change_requests ENABLE ROW LEVEL SECURITY;

-- A usuária pode ver suas próprias solicitações
CREATE POLICY "Users view own email change requests"
  ON public.email_change_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Inserção e confirmação ocorrem apenas via edge function (service role)
-- Não criamos política de INSERT/UPDATE/DELETE para usuários comuns

-- Trigger updated_at
CREATE TRIGGER update_email_change_requests_updated_at
  BEFORE UPDATE ON public.email_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();