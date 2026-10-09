CREATE TABLE public.negocio_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  nome text NOT NULL CHECK (length(trim(nome)) between 1 and 120),
  descricao text NOT NULL CHECK (length(trim(descricao)) between 1 and 1000),
  valor_centavos integer CHECK (valor_centavos IS NULL OR valor_centavos >= 0),
  categoria text,
  link_compra text,
  fotos text[] NOT NULL DEFAULT '{}' CHECK (coalesce(array_length(fotos,1),0) <= 3),
  destaque_tag text CHECK (destaque_tag IN ('destaque','promocao','oferta','mais_vendido')),
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.negocio_produtos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.negocio_produtos TO authenticated;
GRANT ALL ON public.negocio_produtos TO service_role;
ALTER TABLE public.negocio_produtos ENABLE ROW LEVEL SECURITY;
CREATE INDEX ix_negocio_produtos_negocio ON public.negocio_produtos(negocio_id, ordem);
CREATE POLICY negocio_produtos_select ON public.negocio_produtos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id));
CREATE POLICY negocio_produtos_escrita ON public.negocio_produtos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND (n.pessoa_id = public.pessoa_atual() OR public.e_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND (n.pessoa_id = public.pessoa_atual() OR public.e_admin())));
CREATE TRIGGER tg_negocio_produtos_atualizado BEFORE UPDATE ON public.negocio_produtos
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_atualizado_em();

CREATE TABLE public.negocio_avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  avaliador_nome text NOT NULL CHECK (length(trim(avaliador_nome)) between 2 and 80),
  nota smallint NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario text CHECK (comentario IS NULL OR length(comentario) <= 1000),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','rejeitado')),
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.negocio_avaliacoes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.negocio_avaliacoes TO authenticated;
GRANT ALL ON public.negocio_avaliacoes TO service_role;
ALTER TABLE public.negocio_avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE INDEX ix_negocio_avaliacoes_negocio ON public.negocio_avaliacoes(negocio_id, status);
CREATE POLICY negocio_avaliacoes_publico ON public.negocio_avaliacoes FOR SELECT
  USING (status = 'aprovado' AND EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id));
CREATE POLICY negocio_avaliacoes_dona_select ON public.negocio_avaliacoes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND (n.pessoa_id = public.pessoa_atual() OR public.e_admin())));
CREATE POLICY negocio_avaliacoes_enviar ON public.negocio_avaliacoes FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pendente' AND EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND n.publicado));
CREATE POLICY negocio_avaliacoes_moderar ON public.negocio_avaliacoes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND (n.pessoa_id = public.pessoa_atual() OR public.e_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.negocios n WHERE n.id = negocio_id AND (n.pessoa_id = public.pessoa_atual() OR public.e_admin())));
CREATE POLICY negocio_avaliacoes_excluir ON public.negocio_avaliacoes FOR DELETE TO authenticated
  USING (public.e_admin());