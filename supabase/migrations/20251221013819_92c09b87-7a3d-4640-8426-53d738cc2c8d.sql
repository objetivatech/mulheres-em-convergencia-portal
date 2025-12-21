-- Create crm_pipelines table for customizable pipelines
CREATE TABLE public.crm_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  stages JSONB NOT NULL DEFAULT '[]',
  pipeline_type TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add pipeline_id to crm_deals
ALTER TABLE public.crm_deals 
ADD COLUMN pipeline_id UUID REFERENCES public.crm_pipelines(id) ON DELETE SET NULL;

-- Create event_form_fields table for customizable event forms
CREATE TABLE public.event_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  options JSONB,
  required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_form_fields ENABLE ROW LEVEL SECURITY;

-- RLS policies for crm_pipelines (admin only)
CREATE POLICY "Admins can view pipelines"
ON public.crm_pipelines FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can create pipelines"
ON public.crm_pipelines FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can update pipelines"
ON public.crm_pipelines FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can delete pipelines"
ON public.crm_pipelines FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- RLS policies for event_form_fields (admin can manage, public can view for published events)
CREATE POLICY "Admins can manage form fields"
ON public.event_form_fields FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Public can view form fields for published events"
ON public.event_form_fields FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_form_fields.event_id AND events.status = 'published'
  )
);

-- Insert default pipelines
INSERT INTO public.crm_pipelines (name, description, pipeline_type, stages) VALUES
(
  'Vendas Geral',
  'Pipeline padrão de vendas',
  'vendas',
  '[
    {"id": "lead", "name": "Lead", "color": "#6b7280", "order": 0},
    {"id": "contacted", "name": "Contatado", "color": "#3b82f6", "order": 1},
    {"id": "proposal", "name": "Proposta", "color": "#8b5cf6", "order": 2},
    {"id": "negotiation", "name": "Negociação", "color": "#f59e0b", "order": 3},
    {"id": "won", "name": "Ganho", "color": "#22c55e", "order": 4},
    {"id": "lost", "name": "Perdido", "color": "#ef4444", "order": 5}
  ]'::jsonb
),
(
  'Eventos',
  'Pipeline para gerenciar participantes de eventos',
  'eventos',
  '[
    {"id": "interesse", "name": "Interesse", "color": "#6b7280", "order": 0},
    {"id": "inscrito", "name": "Inscrito", "color": "#3b82f6", "order": 1},
    {"id": "pago", "name": "Pago", "color": "#8b5cf6", "order": 2},
    {"id": "confirmado", "name": "Confirmado", "color": "#f59e0b", "order": 3},
    {"id": "participou", "name": "Participou", "color": "#22c55e", "order": 4},
    {"id": "nao_compareceu", "name": "Não Compareceu", "color": "#ef4444", "order": 5}
  ]'::jsonb
),
(
  'Planos e Assinaturas',
  'Pipeline para vendas de planos',
  'planos',
  '[
    {"id": "lead", "name": "Lead", "color": "#6b7280", "order": 0},
    {"id": "demonstracao", "name": "Demonstração", "color": "#3b82f6", "order": 1},
    {"id": "trial", "name": "Trial", "color": "#8b5cf6", "order": 2},
    {"id": "negociacao", "name": "Negociação", "color": "#f59e0b", "order": 3},
    {"id": "ativo", "name": "Ativo", "color": "#22c55e", "order": 4},
    {"id": "cancelado", "name": "Cancelado", "color": "#ef4444", "order": 5}
  ]'::jsonb
);

-- Create trigger for updated_at on crm_pipelines
CREATE TRIGGER update_crm_pipelines_updated_at
BEFORE UPDATE ON public.crm_pipelines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on event_form_fields
CREATE TRIGGER update_event_form_fields_updated_at
BEFORE UPDATE ON public.event_form_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_crm_deals_pipeline_id ON public.crm_deals(pipeline_id);
CREATE INDEX idx_event_form_fields_event_id ON public.event_form_fields(event_id);
CREATE INDEX idx_events_status_date ON public.events(status, date_start);