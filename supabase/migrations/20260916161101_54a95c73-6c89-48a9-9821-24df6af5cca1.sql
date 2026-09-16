ALTER TABLE public.planos
  ADD COLUMN IF NOT EXISTS tipos acesso_tipo[] NOT NULL DEFAULT '{}'::acesso_tipo[];

UPDATE public.planos
   SET tipos = ARRAY[tipo]::acesso_tipo[]
 WHERE cardinality(tipos) = 0;

COMMENT ON COLUMN public.planos.tipos IS 'Áreas liberadas pelo plano. `tipo` fica como área principal, por compatibilidade.';