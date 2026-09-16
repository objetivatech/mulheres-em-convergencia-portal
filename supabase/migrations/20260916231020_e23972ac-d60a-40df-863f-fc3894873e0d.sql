CREATE TABLE IF NOT EXISTS public.marcos_linha_tempo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano integer NOT NULL,
  rotulo text,
  titulo text NOT NULL,
  descricao text,
  imagem_url text,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.marcos_linha_tempo TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marcos_linha_tempo TO authenticated;
GRANT ALL ON public.marcos_linha_tempo TO service_role;

ALTER TABLE public.marcos_linha_tempo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marcos_leitura_publica" ON public.marcos_linha_tempo
  FOR SELECT USING (ativo OR public.e_admin());
CREATE POLICY "marcos_admin" ON public.marcos_linha_tempo
  FOR ALL TO authenticated USING (public.e_admin()) WITH CHECK (public.e_admin());

CREATE TRIGGER trg_marcos_atualizado_em BEFORE UPDATE ON public.marcos_linha_tempo
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_atualizado_em();

CREATE TABLE IF NOT EXISTS public.parceiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  logo_url text,
  site text,
  descricao text,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.parceiros TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parceiros TO authenticated;
GRANT ALL ON public.parceiros TO service_role;

ALTER TABLE public.parceiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parceiros_leitura_publica" ON public.parceiros
  FOR SELECT USING (ativo OR public.e_admin());
CREATE POLICY "parceiros_admin" ON public.parceiros
  FOR ALL TO authenticated USING (public.e_admin()) WITH CHECK (public.e_admin());

CREATE TRIGGER trg_parceiros_atualizado_em BEFORE UPDATE ON public.parceiros
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_atualizado_em();

ALTER TABLE public.negocios
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;