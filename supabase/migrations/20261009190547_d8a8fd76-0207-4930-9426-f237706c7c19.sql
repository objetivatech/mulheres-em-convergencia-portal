ALTER TABLE public.planos
  ADD COLUMN IF NOT EXISTS desconto_evento_percentual integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grupo text;

CREATE OR REPLACE FUNCTION public.tg_valida_desconto_plano() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.desconto_evento_percentual < 0 OR NEW.desconto_evento_percentual > 100 THEN
    RAISE EXCEPTION 'Desconto deve ficar entre 0 e 100%%';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS valida_desconto_plano ON public.planos;
CREATE TRIGGER valida_desconto_plano BEFORE INSERT OR UPDATE ON public.planos
  FOR EACH ROW EXECUTE FUNCTION public.tg_valida_desconto_plano();

-- Maior desconto em encontros entre os planos com acesso vigente da pessoa
CREATE OR REPLACE FUNCTION public.desconto_evento_assinante(_pessoa_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(MAX(p.desconto_evento_percentual), 0)::int
  FROM public.concessoes_acesso c
  JOIN public.pagamentos pg ON pg.id = c.pagamento_id
  JOIN public.planos p ON p.id = pg.plano_id
  WHERE c.pessoa_id = _pessoa_id
    AND c.revogado_em IS NULL
    AND c.inicio_em <= now()
    AND (c.fim_em IS NULL OR c.fim_em > now())
    AND (_pessoa_id = public.pessoa_atual() OR public.e_admin()
         OR current_setting('request.jwt.claim.role', true) = 'service_role'
         OR auth.role() = 'service_role');
$$;
REVOKE EXECUTE ON FUNCTION public.desconto_evento_assinante(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.desconto_evento_assinante(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.meu_desconto_evento()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.pessoa_atual() IS NULL THEN 0
              ELSE public.desconto_evento_assinante(public.pessoa_atual()) END;
$$;
REVOKE EXECUTE ON FUNCTION public.meu_desconto_evento() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.meu_desconto_evento() TO authenticated;

CREATE TABLE public.faq_planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta text NOT NULL,
  resposta text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faq_planos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faq_planos TO authenticated;
GRANT ALL ON public.faq_planos TO service_role;
ALTER TABLE public.faq_planos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FAQ ativa é pública" ON public.faq_planos FOR SELECT USING (ativo OR public.e_admin());
CREATE POLICY "Admin gerencia FAQ" ON public.faq_planos FOR ALL TO authenticated
  USING (public.e_admin()) WITH CHECK (public.e_admin());
CREATE TRIGGER faq_planos_atualizado BEFORE UPDATE ON public.faq_planos
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_atualizado_em();