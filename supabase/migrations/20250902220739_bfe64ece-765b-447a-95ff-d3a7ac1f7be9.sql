-- Add Phase 5 premium features to the database

-- Add boost system for business visibility
CREATE TABLE IF NOT EXISTS public.business_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  boost_type TEXT NOT NULL CHECK (boost_type IN ('featured_listing', 'top_search', 'premium_badge', 'homepage_spotlight')),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cost_credits INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add credits system for businesses
CREATE TABLE IF NOT EXISTS public.business_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  credits_balance INTEGER NOT NULL DEFAULT 0,
  credits_spent INTEGER NOT NULL DEFAULT 0,
  credits_earned INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add advanced analytics tracking
CREATE TABLE IF NOT EXISTS public.business_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views_count INTEGER NOT NULL DEFAULT 0,
  clicks_count INTEGER NOT NULL DEFAULT 0,
  contacts_count INTEGER NOT NULL DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  search_appearances INTEGER NOT NULL DEFAULT 0,
  map_clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, date)
);

-- Add premium features tracking
CREATE TABLE IF NOT EXISTS public.premium_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  required_plan TEXT NOT NULL,
  credits_cost INTEGER DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_boosts
CREATE POLICY "Business owners can view their boosts" ON public.business_boosts
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Business owners can manage their boosts" ON public.business_boosts
  FOR ALL USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

-- RLS Policies for business_credits
CREATE POLICY "Business owners can view their credits" ON public.business_credits
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Business owners can manage their credits" ON public.business_credits
  FOR ALL USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

-- RLS Policies for business_analytics
CREATE POLICY "Business owners can view their analytics" ON public.business_analytics
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Admins can view all analytics" ON public.business_analytics
  FOR SELECT USING (get_current_user_admin_status());

-- RLS Policies for premium_features
CREATE POLICY "Everyone can view active premium features" ON public.premium_features
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage premium features" ON public.premium_features
  FOR ALL USING (get_current_user_admin_status());

-- Insert default premium features
INSERT INTO public.premium_features (feature_name, display_name, description, required_plan, credits_cost)
VALUES 
  ('featured_listing', 'Listagem em Destaque', 'Apareça no topo dos resultados de busca', 'intermediario', 50),
  ('premium_badge', 'Selo Premium', 'Selo especial no seu perfil', 'intermediario', 0),
  ('analytics_advanced', 'Analytics Avançado', 'Relatórios detalhados de performance', 'intermediario', 0),
  ('homepage_spotlight', 'Destaque na Homepage', 'Apareça na página inicial do site', 'master', 100),
  ('priority_support', 'Suporte Prioritário', 'Atendimento prioritário', 'master', 0),
  ('custom_branding', 'Personalização Avançada', 'Cores e estilos personalizados', 'master', 0);

-- Function to get business boost status
CREATE OR REPLACE FUNCTION public.get_business_boosts(business_uuid UUID)
RETURNS TABLE(
  boost_type TEXT,
  active BOOLEAN,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    bb.boost_type,
    bb.active AND bb.expires_at > now() AS active,
    bb.expires_at
  FROM public.business_boosts bb
  WHERE bb.business_id = business_uuid
    AND bb.active = true;
$$;

-- Function to update business analytics
CREATE OR REPLACE FUNCTION public.update_business_analytics(
  business_uuid UUID,
  metric_name TEXT,
  increment_by INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update analytics for today
  INSERT INTO public.business_analytics (business_id, date, views_count, clicks_count, contacts_count, reviews_count, search_appearances, map_clicks)
  VALUES (
    business_uuid, 
    CURRENT_DATE,
    CASE WHEN metric_name = 'views' THEN increment_by ELSE 0 END,
    CASE WHEN metric_name = 'clicks' THEN increment_by ELSE 0 END,
    CASE WHEN metric_name = 'contacts' THEN increment_by ELSE 0 END,
    CASE WHEN metric_name = 'reviews' THEN increment_by ELSE 0 END,
    CASE WHEN metric_name = 'search_appearances' THEN increment_by ELSE 0 END,
    CASE WHEN metric_name = 'map_clicks' THEN increment_by ELSE 0 END
  )
  ON CONFLICT (business_id, date) DO UPDATE SET
    views_count = business_analytics.views_count + CASE WHEN metric_name = 'views' THEN increment_by ELSE 0 END,
    clicks_count = business_analytics.clicks_count + CASE WHEN metric_name = 'clicks' THEN increment_by ELSE 0 END,
    contacts_count = business_analytics.contacts_count + CASE WHEN metric_name = 'contacts' THEN increment_by ELSE 0 END,
    reviews_count = business_analytics.reviews_count + CASE WHEN metric_name = 'reviews' THEN increment_by ELSE 0 END,
    search_appearances = business_analytics.search_appearances + CASE WHEN metric_name = 'search_appearances' THEN increment_by ELSE 0 END,
    map_clicks = business_analytics.map_clicks + CASE WHEN metric_name = 'map_clicks' THEN increment_by ELSE 0 END;
END;
$$;

-- Function to create business credits account
CREATE OR REPLACE FUNCTION public.create_business_credits_account(business_uuid UUID)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.business_credits (business_id, credits_balance)
  VALUES (business_uuid, 100) -- Start with 100 free credits
  ON CONFLICT DO NOTHING;
END;
$$;

-- Trigger to create credits account when business is created
CREATE OR REPLACE FUNCTION public.handle_new_business_credits()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_business_credits_account(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_business_created_credits
  AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_business_credits();

-- Add updated_at trigger for new tables
CREATE TRIGGER update_business_boosts_updated_at
  BEFORE UPDATE ON public.business_boosts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Update existing businesses table for featured functionality
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS boost_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_boost_credits INTEGER DEFAULT 0;