-- =====================================================
-- Remover constraint de stage fixa para permitir stages dinâmicos
-- =====================================================
ALTER TABLE public.crm_deals DROP CONSTRAINT IF EXISTS crm_deals_stage_check;

-- =====================================================
-- Corrigir dados existentes - vincular leads às inscrições
-- =====================================================

-- Atualizar event_registrations com lead_id baseado no email
UPDATE public.event_registrations er
SET lead_id = cl.id
FROM public.crm_leads cl
WHERE er.email = cl.email
  AND er.lead_id IS NULL;

-- Atualizar event_registrations com lead_id baseado no CPF
UPDATE public.event_registrations er
SET lead_id = cl.id
FROM public.crm_leads cl
WHERE er.cpf = cl.cpf
  AND er.cpf IS NOT NULL
  AND er.lead_id IS NULL;

-- =====================================================
-- Criar deals para leads de eventos que não têm deals
-- =====================================================
INSERT INTO public.crm_deals (
  title,
  lead_id,
  pipeline_id,
  stage,
  value,
  description
)
SELECT 
  e.title || ' - ' || cl.full_name as title,
  cl.id as lead_id,
  (SELECT id FROM crm_pipelines WHERE pipeline_type = 'eventos' AND active = true LIMIT 1) as pipeline_id,
  'inscrito' as stage,
  COALESCE(e.price, 0) as value,
  'Deal criado automaticamente a partir de inscrição em evento'
FROM public.crm_leads cl
INNER JOIN public.event_registrations er ON er.lead_id = cl.id OR er.email = cl.email
INNER JOIN public.events e ON e.id = er.event_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_deals cd 
  WHERE cd.lead_id = cl.id 
)
GROUP BY cl.id, cl.full_name, e.id, e.title, e.price;

-- =====================================================
-- Índices para performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_event_registrations_lead_id ON public.event_registrations(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_pipeline_stage ON public.crm_deals(pipeline_id, stage);