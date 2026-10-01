-- Negócios: editoras também editam; equipe vê todos
DROP POLICY IF EXISTS negocios_dona_update ON public.negocios;
CREATE POLICY negocios_dona_update ON public.negocios FOR UPDATE
USING ((pessoa_id = pessoa_atual()) OR e_admin() OR tem_papel(pessoa_atual(),'editora'))
WITH CHECK ((pessoa_id = pessoa_atual()) OR e_admin() OR tem_papel(pessoa_atual(),'editora'));
DROP POLICY IF EXISTS negocios_dona_select ON public.negocios;
CREATE POLICY negocios_dona_select ON public.negocios FOR SELECT
USING ((pessoa_id = pessoa_atual()) OR e_admin() OR tem_papel(pessoa_atual(),'editora'));

-- Conecta: toda pessoa com acesso vigente aparece, mesmo sem perfil de networking
CREATE OR REPLACE FUNCTION public.conecta_membros()
RETURNS TABLE(pessoa_id uuid, nome text, foto_url text, empresa text, cargo text, apresentacao text, interesses text[], aceita_contato boolean, instagram text, linkedin text, site text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  select p.id, coalesce(p.nome_social, p.nome), p.foto_url,
         cp.empresa, cp.cargo, coalesce(cp.apresentacao, p.bio),
         coalesce(cp.interesses, '{}'::text[]), coalesce(cp.aceita_contato, true),
         p.instagram, p.linkedin, p.site
  from public.pessoas p
  left join public.conecta_perfis cp on cp.pessoa_id = p.id
  where (public.tenho_acesso('conecta'::acesso_tipo) or public.e_admin())
    and (public.acesso_vigente(p.id, 'conecta'::acesso_tipo) or public.tem_papel(p.id, 'admin'))
$$;

-- Foto pública da empreendedora para cards de negócios publicados
CREATE OR REPLACE FUNCTION public.donas_negocios()
RETURNS TABLE(negocio_id uuid, nome text, foto_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  select n.id, coalesce(p.nome_social, p.nome), p.foto_url
  from public.negocios n join public.pessoas p on p.id = n.pessoa_id
  where n.publicado
$$;
GRANT EXECUTE ON FUNCTION public.donas_negocios() TO anon, authenticated;