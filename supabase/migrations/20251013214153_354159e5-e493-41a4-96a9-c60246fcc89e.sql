-- Fase 3: Analytics Avançado, Templates Personalizados e A/B Testing

-- Tabela para templates de email personalizados
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  journey_stage TEXT NOT NULL CHECK (journey_stage IN ('signup', 'profile_completed', 'plan_selected', 'payment_pending', 'payment_confirmed', 'active')),
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para variantes de A/B testing
CREATE TABLE IF NOT EXISTS public.email_ab_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.email_templates(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL, -- 'A', 'B', 'C', etc.
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  traffic_percentage INTEGER DEFAULT 50 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(template_id, variant_name)
);

-- Tabela para rastreamento de envios de email (analytics)
CREATE TABLE IF NOT EXISTS public.email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.email_templates(id),
  variant_id UUID REFERENCES public.email_ab_variants(id),
  journey_stage TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabela para métricas agregadas de analytics
CREATE TABLE IF NOT EXISTS public.journey_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  journey_stage TEXT NOT NULL,
  users_entered INTEGER DEFAULT 0,
  users_completed INTEGER DEFAULT 0,
  users_abandoned INTEGER DEFAULT 0,
  avg_time_in_stage_hours NUMERIC(10,2),
  conversion_rate NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, journey_stage)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_email_templates_stage ON public.email_templates(journey_stage) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_email_sends_user ON public.email_sends(user_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_email_sends_template ON public.email_sends(template_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_journey_analytics_date ON public.journey_analytics_daily(date, journey_stage);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_ab_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_analytics_daily ENABLE ROW LEVEL SECURITY;

-- RLS Policies para email_templates
CREATE POLICY "Admins can manage email templates"
  ON public.email_templates
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view email templates"
  ON public.email_templates
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para email_ab_variants
CREATE POLICY "Admins can manage AB variants"
  ON public.email_ab_variants
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para email_sends
CREATE POLICY "Admins can view email sends"
  ON public.email_sends
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Edge functions can insert email sends"
  ON public.email_sends
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Edge functions can update email sends"
  ON public.email_sends
  FOR UPDATE
  USING (true);

-- RLS Policies para journey_analytics_daily
CREATE POLICY "Admins can view journey analytics"
  ON public.journey_analytics_daily
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Função para obter analytics avançado
CREATE OR REPLACE FUNCTION public.get_advanced_journey_analytics(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  date DATE,
  journey_stage TEXT,
  users_entered INTEGER,
  users_completed INTEGER,
  users_abandoned INTEGER,
  conversion_rate NUMERIC,
  avg_time_hours NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    jad.date,
    jad.journey_stage::TEXT,
    jad.users_entered,
    jad.users_completed,
    jad.users_abandoned,
    jad.conversion_rate,
    jad.avg_time_in_stage_hours
  FROM public.journey_analytics_daily jad
  WHERE jad.date BETWEEN p_start_date AND p_end_date
  ORDER BY jad.date DESC, 
    CASE jad.journey_stage
      WHEN 'signup' THEN 1
      WHEN 'profile_completed' THEN 2
      WHEN 'plan_selected' THEN 3
      WHEN 'payment_pending' THEN 4
      WHEN 'payment_confirmed' THEN 5
      WHEN 'active' THEN 6
      ELSE 7
    END;
END;
$$;

-- Função para obter métricas de A/B testing
CREATE OR REPLACE FUNCTION public.get_ab_test_metrics(
  p_template_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  variant_id UUID,
  variant_name TEXT,
  template_name TEXT,
  total_sends BIGINT,
  total_opens BIGINT,
  total_clicks BIGINT,
  total_conversions BIGINT,
  open_rate NUMERIC,
  click_rate NUMERIC,
  conversion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    v.id as variant_id,
    v.variant_name::TEXT,
    t.name::TEXT as template_name,
    COUNT(es.id) as total_sends,
    COUNT(es.opened_at) as total_opens,
    COUNT(es.clicked_at) as total_clicks,
    COUNT(es.converted_at) as total_conversions,
    ROUND(CASE 
      WHEN COUNT(es.id) > 0 
      THEN (COUNT(es.opened_at)::NUMERIC / COUNT(es.id)::NUMERIC * 100)
      ELSE 0 
    END, 2) as open_rate,
    ROUND(CASE 
      WHEN COUNT(es.id) > 0 
      THEN (COUNT(es.clicked_at)::NUMERIC / COUNT(es.id)::NUMERIC * 100)
      ELSE 0 
    END, 2) as click_rate,
    ROUND(CASE 
      WHEN COUNT(es.id) > 0 
      THEN (COUNT(es.converted_at)::NUMERIC / COUNT(es.id)::NUMERIC * 100)
      ELSE 0 
    END, 2) as conversion_rate
  FROM public.email_ab_variants v
  INNER JOIN public.email_templates t ON t.id = v.template_id
  LEFT JOIN public.email_sends es ON es.variant_id = v.id 
    AND es.sent_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL
  WHERE (p_template_id IS NULL OR v.template_id = p_template_id)
    AND v.is_active = true
  GROUP BY v.id, v.variant_name, t.name
  ORDER BY t.name, v.variant_name;
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_ab_variants_updated_at
  BEFORE UPDATE ON public.email_ab_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();