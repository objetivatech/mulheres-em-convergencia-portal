-- =============================================
-- FASE 1: Módulo de Embaixadoras - Estrutura de Banco de Dados
-- =============================================

-- 1. Criar tabela ambassador_payouts (primeiro, pois será referenciada)
CREATE TABLE public.ambassador_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES public.ambassadors(id) ON DELETE CASCADE,
  reference_period TEXT NOT NULL, -- 'YYYY-MM' format
  total_sales INTEGER NOT NULL DEFAULT 0,
  gross_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, paid, failed
  payment_method TEXT, -- pix, bank_transfer
  payment_details JSONB,
  scheduled_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Criar tabela ambassador_referral_clicks
CREATE TABLE public.ambassador_referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID REFERENCES public.ambassadors(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  visitor_ip TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Criar tabela ambassador_referrals
CREATE TABLE public.ambassador_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES public.ambassadors(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  plan_name TEXT NOT NULL,
  sale_amount NUMERIC(10,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  commission_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, paid, cancelled
  payment_confirmed_at TIMESTAMPTZ,
  payout_id UUID REFERENCES public.ambassador_payouts(id) ON DELETE SET NULL,
  payout_eligible_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Adicionar colunas na tabela ambassadors
ALTER TABLE public.ambassadors 
ADD COLUMN IF NOT EXISTS pix_key TEXT,
ADD COLUMN IF NOT EXISTS bank_data JSONB,
ADD COLUMN IF NOT EXISTS payment_preference TEXT DEFAULT 'pix',
ADD COLUMN IF NOT EXISTS minimum_payout NUMERIC(10,2) DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS pending_commission NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_payout_date DATE;

-- 5. Adicionar colunas na tabela user_subscriptions para rastreamento
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS ambassador_id UUID REFERENCES public.ambassadors(id) ON DELETE SET NULL;

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ambassador_referrals_ambassador_id ON public.ambassador_referrals(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_referrals_status ON public.ambassador_referrals(status);
CREATE INDEX IF NOT EXISTS idx_ambassador_referrals_payout_eligible_date ON public.ambassador_referrals(payout_eligible_date);
CREATE INDEX IF NOT EXISTS idx_ambassador_payouts_ambassador_id ON public.ambassador_payouts(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_payouts_status ON public.ambassador_payouts(status);
CREATE INDEX IF NOT EXISTS idx_ambassador_payouts_scheduled_date ON public.ambassador_payouts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_ambassador_referral_clicks_ambassador_id ON public.ambassador_referral_clicks(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_referral_clicks_referral_code ON public.ambassador_referral_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_ambassador_id ON public.user_subscriptions(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_referral_code ON public.user_subscriptions(referral_code);

-- 7. Habilitar RLS em todas as novas tabelas
ALTER TABLE public.ambassador_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_referrals ENABLE ROW LEVEL SECURITY;

-- 8. Políticas RLS para ambassador_payouts
CREATE POLICY "Ambassadors can view their own payouts"
ON public.ambassador_payouts
FOR SELECT
USING (ambassador_id IN (
  SELECT id FROM public.ambassadors WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage all payouts"
ON public.ambassador_payouts
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 9. Políticas RLS para ambassador_referral_clicks
CREATE POLICY "Ambassadors can view their own clicks"
ON public.ambassador_referral_clicks
FOR SELECT
USING (ambassador_id IN (
  SELECT id FROM public.ambassadors WHERE user_id = auth.uid()
));

CREATE POLICY "Anyone can insert clicks via RPC"
ON public.ambassador_referral_clicks
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage all clicks"
ON public.ambassador_referral_clicks
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 10. Políticas RLS para ambassador_referrals
CREATE POLICY "Ambassadors can view their own referrals"
ON public.ambassador_referrals
FOR SELECT
USING (ambassador_id IN (
  SELECT id FROM public.ambassadors WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage all referrals"
ON public.ambassador_referrals
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 11. Função para atualizar totais da embaixadora
CREATE OR REPLACE FUNCTION public.update_ambassador_totals(
  p_ambassador_id UUID,
  p_sale_amount NUMERIC,
  p_commission_amount NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ambassadors
  SET 
    total_sales = COALESCE(total_sales, 0) + 1,
    total_earnings = COALESCE(total_earnings, 0) + p_commission_amount,
    pending_commission = COALESCE(pending_commission, 0) + p_commission_amount,
    updated_at = now()
  WHERE id = p_ambassador_id;
END;
$$;

-- 12. Função melhorada para rastrear cliques com mais dados
CREATE OR REPLACE FUNCTION public.track_referral_click_extended(
  p_referral_code TEXT,
  p_visitor_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_utm_source TEXT DEFAULT NULL,
  p_utm_medium TEXT DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ambassador_id UUID;
  v_click_id UUID;
BEGIN
  -- Buscar embaixadora pelo código
  SELECT id INTO v_ambassador_id
  FROM public.ambassadors
  WHERE referral_code = p_referral_code AND active = true;
  
  IF v_ambassador_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Registrar clique
  INSERT INTO public.ambassador_referral_clicks (
    ambassador_id,
    referral_code,
    visitor_ip,
    user_agent,
    utm_source,
    utm_medium,
    utm_campaign
  ) VALUES (
    v_ambassador_id,
    p_referral_code,
    p_visitor_ip,
    p_user_agent,
    p_utm_source,
    p_utm_medium,
    p_utm_campaign
  ) RETURNING id INTO v_click_id;
  
  -- Atualizar contador de cliques da embaixadora
  UPDATE public.ambassadors
  SET link_clicks = COALESCE(link_clicks, 0) + 1,
      updated_at = now()
  WHERE id = v_ambassador_id;
  
  RETURN v_click_id;
END;
$$;

-- 13. Função para calcular data de elegibilidade de pagamento
CREATE OR REPLACE FUNCTION public.calculate_payout_eligible_date(p_payment_date TIMESTAMPTZ)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_cutoff_day INTEGER := 20;
  v_payout_day INTEGER := 10;
  v_payment_date DATE := p_payment_date::DATE;
BEGIN
  -- Vendas até dia 20 = pago dia 10 do mês seguinte
  -- Vendas após dia 20 = pago dia 10 de dois meses depois
  IF EXTRACT(DAY FROM v_payment_date) <= v_cutoff_day THEN
    RETURN (DATE_TRUNC('month', v_payment_date) + INTERVAL '1 month' + (v_payout_day - 1) * INTERVAL '1 day')::DATE;
  ELSE
    RETURN (DATE_TRUNC('month', v_payment_date) + INTERVAL '2 months' + (v_payout_day - 1) * INTERVAL '1 day')::DATE;
  END IF;
END;
$$;

-- 14. Função para criar registro de referral (será chamada pelo webhook)
CREATE OR REPLACE FUNCTION public.create_ambassador_referral(
  p_ambassador_id UUID,
  p_referred_user_id UUID,
  p_subscription_id UUID,
  p_plan_name TEXT,
  p_sale_amount NUMERIC,
  p_commission_rate NUMERIC DEFAULT 15.00
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission_amount NUMERIC;
  v_eligible_date DATE;
  v_referral_id UUID;
BEGIN
  -- Calcular comissão
  v_commission_amount := p_sale_amount * (p_commission_rate / 100);
  
  -- Calcular data de elegibilidade
  v_eligible_date := public.calculate_payout_eligible_date(now());
  
  -- Criar registro de referral
  INSERT INTO public.ambassador_referrals (
    ambassador_id,
    referred_user_id,
    subscription_id,
    plan_name,
    sale_amount,
    commission_rate,
    commission_amount,
    status,
    payment_confirmed_at,
    payout_eligible_date
  ) VALUES (
    p_ambassador_id,
    p_referred_user_id,
    p_subscription_id,
    p_plan_name,
    p_sale_amount,
    p_commission_rate,
    v_commission_amount,
    'confirmed',
    now(),
    v_eligible_date
  ) RETURNING id INTO v_referral_id;
  
  -- Atualizar totais da embaixadora
  PERFORM public.update_ambassador_totals(p_ambassador_id, p_sale_amount, v_commission_amount);
  
  RETURN v_referral_id;
END;
$$;

-- 15. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_ambassador_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ambassador_referrals_updated_at
  BEFORE UPDATE ON public.ambassador_referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ambassador_tables_updated_at();

CREATE TRIGGER update_ambassador_payouts_updated_at
  BEFORE UPDATE ON public.ambassador_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ambassador_tables_updated_at();