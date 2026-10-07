CREATE OR REPLACE FUNCTION public.conceder_cortesia(_pessoa_id uuid, _tipo acesso_tipo, _dias integer, _motivo text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF NOT public.e_admin() THEN RAISE EXCEPTION 'Apenas a administração pode conceder cortesias'; END IF;
  IF _dias IS NULL OR _dias < 1 OR _dias > 3660 THEN RAISE EXCEPTION 'Informe entre 1 e 3660 dias'; END IF;
  INSERT INTO public.concessoes_acesso (pessoa_id, tipo, origem, inicio_em, fim_em, motivo, criado_por)
  VALUES (_pessoa_id, _tipo, 'cortesia', now(), now() + make_interval(days => _dias), NULLIF(trim(_motivo),''), public.pessoa_atual())
  RETURNING id INTO _id;
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.revogar_concessao(_id uuid, _motivo text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.e_admin() THEN RAISE EXCEPTION 'Apenas a administração pode encerrar acessos'; END IF;
  UPDATE public.concessoes_acesso SET revogado_em = now(), revogado_motivo = NULLIF(trim(_motivo),'')
  WHERE id = _id AND revogado_em IS NULL;
  RETURN FOUND;
END $$;

REVOKE ALL ON FUNCTION public.conceder_cortesia(uuid, acesso_tipo, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revogar_concessao(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.conceder_cortesia(uuid, acesso_tipo, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revogar_concessao(uuid, text) TO authenticated;