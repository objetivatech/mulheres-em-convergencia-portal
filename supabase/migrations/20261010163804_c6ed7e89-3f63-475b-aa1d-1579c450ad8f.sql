DROP FUNCTION IF EXISTS public.embaixadoras_publicas();
DROP FUNCTION IF EXISTS private.embaixadoras_publicas();
CREATE FUNCTION private.embaixadoras_publicas()
RETURNS TABLE(id uuid, nome text, foto_url text, apresentacao text, cidade text, uf text,
  instagram text, linkedin text, site text, nivel text, indicacoes bigint, desde timestamptz, codigo text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select e.id, coalesce(p.nome_social, p.nome), p.foto_url, coalesce(e.apresentacao, p.bio),
    e.cidade, e.uf, p.instagram, p.linkedin, p.site, nv.nome,
    (select count(*) from public.embaixadora_indicacoes i where i.embaixadora_id = e.id and i.pagamento_id is not null),
    e.criado_em, e.codigo
  from public.embaixadoras e
  join public.pessoas p on p.id = e.pessoa_id
  left join public.embaixadora_niveis nv on nv.id = e.nivel_id
  where e.publicada and e.ativa
$$;
REVOKE ALL ON FUNCTION private.embaixadoras_publicas() FROM public;
GRANT EXECUTE ON FUNCTION private.embaixadoras_publicas() TO anon, authenticated;
CREATE FUNCTION public.embaixadoras_publicas()
RETURNS TABLE(id uuid, nome text, foto_url text, apresentacao text, cidade text, uf text,
  instagram text, linkedin text, site text, nivel text, indicacoes bigint, desde timestamptz, codigo text)
LANGUAGE sql STABLE SET search_path TO 'public' AS $$ select * from private.embaixadoras_publicas() $$;
GRANT EXECUTE ON FUNCTION public.embaixadoras_publicas() TO anon, authenticated;