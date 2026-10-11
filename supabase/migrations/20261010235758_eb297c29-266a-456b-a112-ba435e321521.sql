ALTER TABLE public.post_comentarios ADD COLUMN IF NOT EXISTS oculto_em timestamptz;
ALTER TABLE public.post_comentarios ALTER COLUMN aprovado_em SET DEFAULT now();
DROP POLICY IF EXISTS comentarios_public_insert ON public.post_comentarios;
DROP POLICY IF EXISTS comentarios_public_select ON public.post_comentarios;
CREATE POLICY comentarios_publico_select ON public.post_comentarios FOR SELECT TO anon, authenticated USING (oculto_em IS NULL);
CREATE POLICY comentarios_publico_insert ON public.post_comentarios FOR INSERT TO anon, authenticated
WITH CHECK (
  oculto_em IS NULL AND email IS NULL
  AND length(trim(nome)) BETWEEN 2 AND 80
  AND length(trim(conteudo)) BETWEEN 2 AND 2000
  AND (pessoa_id IS NULL OR pessoa_id = private.pessoa_atual())
  AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.situacao = 'publicado')
);
REVOKE SELECT (email) ON public.post_comentarios FROM anon;

CREATE OR REPLACE FUNCTION private.autor_de_pessoa(_pessoa_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _id uuid; _p record; _slug text;
BEGIN
  IF NOT (public.e_admin() OR public.tem_papel(public.pessoa_atual(), 'editora')) THEN
    RAISE EXCEPTION 'Apenas a equipe pode definir autoras';
  END IF;
  SELECT id, coalesce(nullif(trim(nome_social),''), nome) AS nome, bio, foto_url INTO _p FROM public.pessoas WHERE id = _pessoa_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pessoa não encontrada'; END IF;
  SELECT id INTO _id FROM public.autores WHERE pessoa_id = _pessoa_id LIMIT 1;
  IF _id IS NOT NULL THEN
    UPDATE public.autores SET nome = _p.nome, bio = _p.bio, foto_url = _p.foto_url WHERE id = _id;
    RETURN _id;
  END IF;
  _slug := lower(regexp_replace(translate(_p.nome, 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'), '[^a-zA-Z0-9]+', '-', 'g'));
  _slug := trim(both '-' from _slug) || '-' || substr(_pessoa_id::text, 1, 6);
  INSERT INTO public.autores (pessoa_id, slug, nome, bio, foto_url) VALUES (_pessoa_id, _slug, _p.nome, _p.bio, _p.foto_url) RETURNING id INTO _id;
  RETURN _id;
END $$;
REVOKE ALL ON FUNCTION private.autor_de_pessoa(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.autor_de_pessoa(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.autor_de_pessoa(_pessoa_id uuid)
RETURNS uuid LANGUAGE sql SET search_path TO 'public' AS $$ select private.autor_de_pessoa($1) $$;
REVOKE ALL ON FUNCTION public.autor_de_pessoa(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.autor_de_pessoa(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION private.tg_sincroniza_autor()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.autores SET nome = coalesce(nullif(trim(NEW.nome_social),''), NEW.nome), bio = NEW.bio, foto_url = NEW.foto_url
  WHERE pessoa_id = NEW.id;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.tg_sincroniza_autor() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS sincroniza_autor ON public.pessoas;
CREATE TRIGGER sincroniza_autor AFTER UPDATE OF nome, nome_social, bio, foto_url ON public.pessoas
FOR EACH ROW EXECUTE FUNCTION private.tg_sincroniza_autor();