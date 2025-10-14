-- FASE 2: Migrar Planos Existentes para Novos Valores

-- Atualizar negócios com plano 'basic' para 'iniciante'
UPDATE public.businesses 
SET subscription_plan = 'iniciante'
WHERE subscription_plan = 'basic';

-- Atualizar variações de 'intermediate' para 'intermediario'
UPDATE public.businesses 
SET subscription_plan = 'intermediario'
WHERE subscription_plan IN ('intermediate', 'intermediário');

-- Atualizar variações de 'premium' para 'impulso'
UPDATE public.businesses 
SET subscription_plan = 'impulso'
WHERE subscription_plan IN ('impulse', 'premium', 'master');

-- Remover constraint antiga se existir
ALTER TABLE public.businesses
DROP CONSTRAINT IF EXISTS businesses_subscription_plan_check;

-- Adicionar constraint para garantir apenas valores válidos
ALTER TABLE public.businesses
ADD CONSTRAINT businesses_subscription_plan_check
CHECK (subscription_plan IN ('iniciante', 'intermediario', 'impulso'));