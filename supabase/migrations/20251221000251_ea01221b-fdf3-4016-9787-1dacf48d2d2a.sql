-- =============================================
-- FASE 1 - PARTE 3: TRIGGERS E AUTOMAÇÕES
-- =============================================

-- 1. FUNÇÃO PARA ATUALIZAR updated_at (se não existir)
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. TRIGGERS PARA updated_at EM TODAS AS NOVAS TABELAS
-- =============================================
DROP TRIGGER IF EXISTS set_updated_at ON public.cost_centers;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.cost_centers
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.crm_leads;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.crm_leads
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.crm_deals;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.crm_deals
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.events;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.event_registrations;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.event_registrations
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.donations;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.donations
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.sponsors;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.sponsors
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.social_impact_metrics;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.social_impact_metrics
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 3. TRIGGER: ATUALIZAR CONTADOR DE PARTICIPANTES EM EVENTOS
-- =============================================
CREATE OR REPLACE FUNCTION public.update_event_participants_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status IN ('confirmed', 'attended') THEN
            UPDATE public.events 
            SET current_participants = current_participants + 1
            WHERE id = NEW.event_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status NOT IN ('confirmed', 'attended') AND NEW.status IN ('confirmed', 'attended') THEN
            UPDATE public.events SET current_participants = current_participants + 1 WHERE id = NEW.event_id;
        ELSIF OLD.status IN ('confirmed', 'attended') AND NEW.status NOT IN ('confirmed', 'attended') THEN
            UPDATE public.events SET current_participants = GREATEST(0, current_participants - 1) WHERE id = NEW.event_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status IN ('confirmed', 'attended') THEN
            UPDATE public.events SET current_participants = GREATEST(0, current_participants - 1) WHERE id = OLD.event_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_event_participants ON public.event_registrations;
CREATE TRIGGER update_event_participants
    AFTER INSERT OR UPDATE OR DELETE ON public.event_registrations
    FOR EACH ROW EXECUTE FUNCTION public.update_event_participants_count();

-- 4. TRIGGER: REGISTRAR INTERAÇÃO QUANDO INSCRIÇÃO EM EVENTO
-- =============================================
CREATE OR REPLACE FUNCTION public.log_event_registration_interaction()
RETURNS TRIGGER AS $$
DECLARE
    v_event record;
BEGIN
    SELECT title, free, format INTO v_event FROM public.events WHERE id = NEW.event_id;
    
    INSERT INTO public.crm_interactions (
        user_id,
        lead_id,
        cpf,
        interaction_type,
        channel,
        description,
        activity_name,
        activity_paid,
        activity_online,
        cost_center_id,
        metadata
    )
    VALUES (
        NEW.user_id,
        NEW.lead_id,
        NEW.cpf,
        'event_registration',
        'website',
        'Inscrição em evento: ' || v_event.title,
        v_event.title,
        NOT v_event.free,
        v_event.format = 'online',
        NEW.cost_center_id,
        jsonb_build_object('event_id', NEW.event_id, 'registration_id', NEW.id, 'status', NEW.status)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS log_event_registration ON public.event_registrations;
CREATE TRIGGER log_event_registration
    AFTER INSERT ON public.event_registrations
    FOR EACH ROW EXECUTE FUNCTION public.log_event_registration_interaction();

-- 5. TRIGGER: REGISTRAR INTERAÇÃO QUANDO DOAÇÃO
-- =============================================
CREATE OR REPLACE FUNCTION public.log_donation_interaction()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.crm_interactions (
        user_id,
        cpf,
        interaction_type,
        channel,
        description,
        activity_paid,
        cost_center_id,
        metadata
    )
    VALUES (
        NEW.donor_id,
        NEW.cpf,
        'donation',
        'website',
        'Doação: R$ ' || NEW.amount || CASE WHEN NEW.campaign IS NOT NULL THEN ' - Campanha: ' || NEW.campaign ELSE '' END,
        true,
        NEW.cost_center_id,
        jsonb_build_object('donation_id', NEW.id, 'amount', NEW.amount, 'type', NEW.type, 'campaign', NEW.campaign)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS log_donation ON public.donations;
CREATE TRIGGER log_donation
    AFTER INSERT ON public.donations
    FOR EACH ROW EXECUTE FUNCTION public.log_donation_interaction();

-- 6. TRIGGER: CRIAR MILESTONE QUANDO LEAD É CONVERTIDO
-- =============================================
CREATE OR REPLACE FUNCTION public.log_lead_conversion_milestone()
RETURNS TRIGGER AS $$
DECLARE
    v_activities_count INTEGER;
    v_days_from_first INTEGER;
BEGIN
    IF OLD.status != 'converted' AND NEW.status = 'converted' AND NEW.converted_user_id IS NOT NULL THEN
        -- Contar interações do lead
        SELECT COUNT(*) INTO v_activities_count 
        FROM public.crm_interactions 
        WHERE lead_id = NEW.id OR cpf = NEW.cpf;
        
        -- Calcular dias desde primeiro contato
        v_days_from_first := EXTRACT(DAY FROM (now() - NEW.created_at));
        
        INSERT INTO public.crm_conversion_milestones (
            cpf,
            user_id,
            email,
            milestone_type,
            milestone_name,
            activities_count,
            days_from_first_contact,
            cost_center_id,
            triggered_by,
            metadata
        )
        VALUES (
            NEW.cpf,
            NEW.converted_user_id,
            NEW.email,
            'lead_converted',
            'Lead convertido em usuário',
            v_activities_count,
            v_days_from_first,
            NEW.cost_center_id,
            'lead_status_change',
            jsonb_build_object('lead_id', NEW.id, 'source', NEW.source)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS log_lead_conversion ON public.crm_leads;
CREATE TRIGGER log_lead_conversion
    AFTER UPDATE ON public.crm_leads
    FOR EACH ROW EXECUTE FUNCTION public.log_lead_conversion_milestone();