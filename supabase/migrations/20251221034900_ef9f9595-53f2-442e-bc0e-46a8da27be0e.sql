-- Adicionar coluna pipeline_id na tabela crm_deals se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'crm_deals' 
    AND column_name = 'pipeline_id'
  ) THEN
    ALTER TABLE public.crm_deals 
    ADD COLUMN pipeline_id UUID REFERENCES public.crm_pipelines(id);
  END IF;
END $$;

-- Vincular deals existentes ao pipeline padrão (Vendas Geral)
UPDATE public.crm_deals
SET pipeline_id = (
  SELECT id FROM public.crm_pipelines 
  WHERE pipeline_type = 'vendas' AND active = true 
  LIMIT 1
)
WHERE pipeline_id IS NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_crm_deals_pipeline_id ON public.crm_deals(pipeline_id);

-- Criar índice para busca de leads por email
CREATE INDEX IF NOT EXISTS idx_crm_leads_email ON public.crm_leads(email);

-- Criar índice para busca de leads por cpf
CREATE INDEX IF NOT EXISTS idx_crm_leads_cpf ON public.crm_leads(cpf);