CREATE TABLE public.depoimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  texto text NOT NULL,
  descricao text,
  foto_url text,
  nota smallint,
  origem text NOT NULL DEFAULT 'manual',
  link_origem text,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.depoimentos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.depoimentos TO authenticated;
GRANT ALL ON public.depoimentos TO service_role;
ALTER TABLE public.depoimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Depoimentos ativos são públicos" ON public.depoimentos FOR SELECT USING (ativo OR public.e_admin());
CREATE POLICY "Equipe gerencia depoimentos" ON public.depoimentos FOR ALL TO authenticated USING (public.e_admin()) WITH CHECK (public.e_admin());
CREATE TRIGGER depoimentos_atualizado BEFORE UPDATE ON public.depoimentos FOR EACH ROW EXECUTE FUNCTION public.tg_set_atualizado_em();