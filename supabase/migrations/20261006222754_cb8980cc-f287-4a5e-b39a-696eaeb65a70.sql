create or replace function public.ja_usou_evento_gratuito(_pessoa_id uuid, _evento_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.evento_inscricoes i
    join public.pessoas p on p.id = i.pessoa_id
    join public.pessoas eu on eu.id = _pessoa_id
    where i.situacao = 'confirmada' and i.valor_centavos = 0
      and i.evento_id <> _evento_id
      and (i.pessoa_id = _pessoa_id or (eu.cpf is not null and p.cpf = eu.cpf))
  )
$$;
revoke execute on function public.ja_usou_evento_gratuito(uuid, uuid) from public, anon, authenticated;
grant execute on function public.ja_usou_evento_gratuito(uuid, uuid) to service_role;

create or replace function public.participantes_eventos()
returns table(pessoa_id uuid, nome text, cpf text, email text, telefone text,
  total_eventos bigint, eventos_gratuitos bigint, ultimo_evento text, ultima_participacao timestamptz, assinante boolean)
language sql stable security definer set search_path to 'public' as $$
  select coalesce(p.id, null), coalesce(p.nome_social, p.nome, max(i.nome)), p.cpf, max(i.email::text), max(i.telefone),
    count(*), count(*) filter (where i.valor_centavos = 0),
    (array_agg(e.titulo order by i.criado_em desc))[1], max(i.criado_em),
    coalesce(bool_or(exists (select 1 from public.concessoes_acesso c where c.pessoa_id = p.id and c.revogado_em is null
      and c.inicio_em <= now() and (c.fim_em is null or c.fim_em > now()))), false)
  from public.evento_inscricoes i
  join public.eventos e on e.id = i.evento_id
  left join public.pessoas p on p.id = i.pessoa_id
  where public.e_admin() and i.situacao = 'confirmada'
  group by p.id, p.nome_social, p.nome, p.cpf, coalesce(p.id::text, i.email::text)
  order by max(i.criado_em) desc
$$;
revoke execute on function public.participantes_eventos() from public, anon;
grant execute on function public.participantes_eventos() to authenticated;

revoke execute on function public.conceder_por_pagamento(uuid, acesso_tipo, integer) from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;