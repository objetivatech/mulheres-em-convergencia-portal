create or replace function private.ocupacao_tipos_evento(_evento_id uuid)
returns table(tipo_id uuid, usadas bigint) language sql stable security definer set search_path to 'public' as $$
  select t.id, count(i.id) from public.evento_tipos_ingresso t
  left join public.evento_inscricoes i on i.tipo_ingresso_id = t.id and i.situacao in ('confirmada','pendente')
  where t.evento_id = _evento_id group by t.id $$;
revoke all on function private.ocupacao_tipos_evento(uuid) from public;
grant execute on function private.ocupacao_tipos_evento(uuid) to anon, authenticated, service_role;
create or replace function public.ocupacao_tipos_evento(_evento_id uuid)
returns table(tipo_id uuid, usadas bigint) language sql stable security invoker set search_path to 'public' as $$
  select * from private.ocupacao_tipos_evento(_evento_id) $$;
grant execute on function public.ocupacao_tipos_evento(uuid) to anon, authenticated, service_role;

alter table public.evento_inscricoes
  add column if not exists lembrete_2d_em timestamptz,
  add column if not exists lembrete_1d_em timestamptz,
  add column if not exists lembrete_0d_em timestamptz;