create or replace function public.conecta_membros()
returns table (
  pessoa_id uuid,
  nome text,
  foto_url text,
  empresa text,
  cargo text,
  apresentacao text,
  interesses text[],
  aceita_contato boolean,
  instagram text,
  linkedin text,
  site text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id,
         coalesce(p.nome_social, p.nome),
         p.foto_url,
         cp.empresa,
         cp.cargo,
         cp.apresentacao,
         cp.interesses,
         cp.aceita_contato,
         p.instagram,
         p.linkedin,
         p.site
  from public.conecta_perfis cp
  join public.pessoas p on p.id = cp.pessoa_id
  where public.tenho_acesso('conecta'::acesso_tipo) or public.e_admin()
$$;

revoke all on function public.conecta_membros() from public, anon;
grant execute on function public.conecta_membros() to authenticated, service_role;