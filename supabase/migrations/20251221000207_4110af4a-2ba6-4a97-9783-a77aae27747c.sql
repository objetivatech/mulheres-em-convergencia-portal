-- =============================================
-- FASE 1 - PARTE 2: TABELAS DO CRM
-- =============================================

-- 1. TABELA: CENTROS DE CUSTO
-- =============================================
CREATE TABLE IF NOT EXISTS public.cost_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('empresa', 'associacao', 'projeto')),
    cnpj TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cost centers" ON public.cost_centers
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view active cost centers" ON public.cost_centers
    FOR SELECT USING (active = true AND auth.uid() IS NOT NULL);

-- Inserir centros de custo iniciais
INSERT INTO public.cost_centers (name, description, type, active) VALUES
    ('Escola de Negócios Mulheres em Convergência LTDA', 'Empresa principal - cursos e serviços', 'empresa', true),
    ('Associação Convergência Feminina', 'Associação - ações sociais e comunidade', 'associacao', true)
ON CONFLICT DO NOTHING;

-- 2. TABELA: CRM LEADS (antes de virarem usuários)
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf TEXT,
    email TEXT,
    full_name TEXT NOT NULL,
    phone TEXT,
    source TEXT NOT NULL,
    source_detail TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    first_activity_date TIMESTAMPTZ,
    first_activity_type TEXT,
    first_activity_paid BOOLEAN DEFAULT false,
    first_activity_online BOOLEAN DEFAULT true,
    cost_center_id UUID REFERENCES public.cost_centers(id),
    assigned_to UUID REFERENCES auth.users(id),
    converted_user_id UUID REFERENCES auth.users(id),
    converted_at TIMESTAMPTZ,
    score INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_lead_email UNIQUE (email),
    CONSTRAINT unique_lead_cpf UNIQUE (cpf)
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_cpf ON public.crm_leads(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_leads_email ON public.crm_leads(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON public.crm_leads(source);
CREATE INDEX IF NOT EXISTS idx_crm_leads_cost_center ON public.crm_leads(cost_center_id);

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all leads" ON public.crm_leads
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Assigned users can view their leads" ON public.crm_leads
    FOR SELECT USING (assigned_to = auth.uid());

-- 3. TABELA: CRM INTERACTIONS (todas as interações)
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cpf TEXT,
    interaction_type TEXT NOT NULL,
    channel TEXT,
    description TEXT,
    activity_name TEXT,
    activity_paid BOOLEAN DEFAULT false,
    activity_online BOOLEAN DEFAULT true,
    cost_center_id UUID REFERENCES public.cost_centers(id),
    form_source TEXT,
    performed_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_interactions_lead ON public.crm_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_user ON public.crm_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_cpf ON public.crm_interactions(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_interactions_type ON public.crm_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_created ON public.crm_interactions(created_at DESC);

ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all interactions" ON public.crm_interactions
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own interactions" ON public.crm_interactions
    FOR SELECT USING (user_id = auth.uid());

-- 4. TABELA: CRM DEALS (pipeline de vendas)
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cpf TEXT,
    title TEXT NOT NULL,
    description TEXT,
    value NUMERIC(12,2) DEFAULT 0,
    stage TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'contacted', 'proposal', 'negotiation', 'won', 'lost')),
    cost_center_id UUID REFERENCES public.cost_centers(id),
    product_type TEXT,
    product_id UUID,
    expected_close_date DATE,
    closed_at TIMESTAMPTZ,
    won BOOLEAN,
    lost_reason TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_deals_lead ON public.crm_deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_user ON public.crm_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_cpf ON public.crm_deals(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON public.crm_deals(stage);
CREATE INDEX IF NOT EXISTS idx_crm_deals_cost_center ON public.crm_deals(cost_center_id);

ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all deals" ON public.crm_deals
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Assigned users can manage their deals" ON public.crm_deals
    FOR ALL USING (assigned_to = auth.uid());

-- 5. TABELA: CRM TAGS (tags para segmentação)
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366f1',
    category TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tags" ON public.crm_tags
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view tags" ON public.crm_tags
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 6. TABELA: CRM ENTITY TAGS (associação de tags)
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_entity_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    tag_id UUID REFERENCES public.crm_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (entity_type, entity_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_entity_tags_entity ON public.crm_entity_tags(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_entity_tags_tag ON public.crm_entity_tags(tag_id);

ALTER TABLE public.crm_entity_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage entity tags" ON public.crm_entity_tags
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 7. TABELA: EVENTS (eventos)
-- =============================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('curso', 'workshop', 'palestra', 'encontro', 'mentoria', 'webinar', 'conferencia', 'outro')),
    format TEXT NOT NULL CHECK (format IN ('online', 'presencial', 'hibrido')),
    location TEXT,
    location_url TEXT,
    date_start TIMESTAMPTZ NOT NULL,
    date_end TIMESTAMPTZ,
    registration_deadline TIMESTAMPTZ,
    price NUMERIC(10,2) DEFAULT 0,
    free BOOLEAN DEFAULT false,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    image_url TEXT,
    cost_center_id UUID REFERENCES public.cost_centers(id),
    instructor_id UUID REFERENCES auth.users(id),
    instructor_name TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    requires_approval BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date_start);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);
CREATE INDEX IF NOT EXISTS idx_events_cost_center ON public.events(cost_center_id);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published events" ON public.events
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage all events" ON public.events
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can manage their events" ON public.events
    FOR ALL USING (instructor_id = auth.uid() OR created_by = auth.uid());

-- 8. TABELA: EVENT REGISTRATIONS (inscrições em eventos)
-- =============================================
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
    cpf TEXT,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'attended', 'no_show')),
    paid BOOLEAN DEFAULT false,
    payment_id UUID,
    payment_amount NUMERIC(10,2),
    checked_in_at TIMESTAMPTZ,
    cost_center_id UUID REFERENCES public.cost_centers(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (event_id, email)
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_cpf ON public.event_registrations(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON public.event_registrations(status);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own registrations" ON public.event_registrations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Anyone can register for events" ON public.event_registrations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own registrations" ON public.event_registrations
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all registrations" ON public.event_registrations
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 9. TABELA: DONATIONS (doações)
-- =============================================
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cpf TEXT,
    email TEXT NOT NULL,
    donor_name TEXT NOT NULL,
    phone TEXT,
    amount NUMERIC(12,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('unica', 'recorrente')),
    frequency TEXT CHECK (frequency IN ('mensal', 'trimestral', 'semestral', 'anual')),
    campaign TEXT,
    project TEXT,
    cost_center_id UUID REFERENCES public.cost_centers(id),
    payment_id TEXT,
    payment_method TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded', 'cancelled')),
    receipt_sent BOOLEAN DEFAULT false,
    receipt_sent_at TIMESTAMPTZ,
    anonymous BOOLEAN DEFAULT false,
    message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_donations_donor ON public.donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_cpf ON public.donations(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_campaign ON public.donations(campaign);
CREATE INDEX IF NOT EXISTS idx_donations_cost_center ON public.donations(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_donations_created ON public.donations(created_at DESC);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own donations" ON public.donations
    FOR SELECT USING (donor_id = auth.uid());

CREATE POLICY "Anyone can create donations" ON public.donations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all donations" ON public.donations
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 10. TABELA: SPONSORS (patrocinadores)
-- =============================================
CREATE TABLE IF NOT EXISTS public.sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    cnpj TEXT,
    trading_name TEXT,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    sponsorship_type TEXT NOT NULL CHECK (sponsorship_type IN ('platinum', 'gold', 'silver', 'bronze', 'apoiador', 'parceiro', 'custom')),
    sponsorship_name TEXT,
    value NUMERIC(12,2) DEFAULT 0,
    value_type TEXT CHECK (value_type IN ('unico', 'mensal', 'anual', 'por_evento')),
    benefits TEXT[],
    start_date DATE,
    end_date DATE,
    cost_center_id UUID REFERENCES public.cost_centers(id),
    logo_url TEXT,
    website_url TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sponsors_status ON public.sponsors(status);
CREATE INDEX IF NOT EXISTS idx_sponsors_type ON public.sponsors(sponsorship_type);
CREATE INDEX IF NOT EXISTS idx_sponsors_cost_center ON public.sponsors(cost_center_id);

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sponsors" ON public.sponsors
    FOR SELECT USING (status = 'active');

CREATE POLICY "Sponsors can view their own data" ON public.sponsors
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all sponsors" ON public.sponsors
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 11. TABELA: SOCIAL IMPACT METRICS (métricas de impacto social)
-- =============================================
CREATE TABLE IF NOT EXISTS public.social_impact_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    value NUMERIC(12,2) NOT NULL,
    unit TEXT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    cost_center_id UUID REFERENCES public.cost_centers(id),
    project TEXT,
    region TEXT,
    demographic JSONB DEFAULT '{}'::jsonb,
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    source TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_impact_type ON public.social_impact_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_social_impact_period ON public.social_impact_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_social_impact_cost_center ON public.social_impact_metrics(cost_center_id);

ALTER TABLE public.social_impact_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified metrics" ON public.social_impact_metrics
    FOR SELECT USING (verified = true);

CREATE POLICY "Admins can manage all metrics" ON public.social_impact_metrics
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 12. TABELA: CRM CONVERSION MILESTONES (marcos de conversão por CPF)
-- =============================================
CREATE TABLE IF NOT EXISTS public.crm_conversion_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    milestone_type TEXT NOT NULL,
    milestone_name TEXT NOT NULL,
    milestone_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    activities_count INTEGER DEFAULT 0,
    total_value NUMERIC(12,2) DEFAULT 0,
    days_from_first_contact INTEGER,
    cost_center_id UUID REFERENCES public.cost_centers(id),
    triggered_by TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversion_milestones_cpf ON public.crm_conversion_milestones(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversion_milestones_user ON public.crm_conversion_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_milestones_type ON public.crm_conversion_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_conversion_milestones_date ON public.crm_conversion_milestones(milestone_date DESC);

ALTER TABLE public.crm_conversion_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own milestones" ON public.crm_conversion_milestones
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all milestones" ON public.crm_conversion_milestones
    FOR ALL USING (has_role(auth.uid(), 'admin'));