-- =====================================================================
-- 0003 — Tour guiado persistente (Fase 3)
-- Projeto NOVO (tysvpeprhokdijquprkd). Idempotente: pode rodar de novo.
-- Depende de 0001 (pessoas, pessoa_atual, e_admin).
--
-- Regra do produto: o botão do tour NUNCA some. Esta tabela guarda apenas
-- se a usuária já viu o tour de cada módulo, para não abrir sozinho outra vez.
-- Nada aqui é estado derivado: é um fato ("vi o tour X em tal data").
-- =====================================================================

create table if not exists public.tour_progresso (
  id            uuid primary key default gen_random_uuid(),
  pessoa_id     uuid not null references public.pessoas(id) on delete cascade,
  modulo        text not null,             -- 'meu-painel', 'conecta', 'academy', ...
  versao        integer not null default 1,-- subir a versão reexibe o tour após mudanças
  concluido_em  timestamptz,
  pulado_em     timestamptz,
  passo_atual   integer not null default 0,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index if not exists ux_tour_pessoa_modulo_versao
  on public.tour_progresso (pessoa_id, modulo, versao);

grant select, insert, update on public.tour_progresso to authenticated;
grant all on public.tour_progresso to service_role;

alter table public.tour_progresso enable row level security;

drop policy if exists tour_self_select on public.tour_progresso;
create policy tour_self_select on public.tour_progresso
  for select to authenticated
  using (pessoa_id = public.pessoa_atual() or public.e_admin());

drop policy if exists tour_self_insert on public.tour_progresso;
create policy tour_self_insert on public.tour_progresso
  for insert to authenticated
  with check (pessoa_id = public.pessoa_atual());

drop policy if exists tour_self_update on public.tour_progresso;
create policy tour_self_update on public.tour_progresso
  for update to authenticated
  using (pessoa_id = public.pessoa_atual())
  with check (pessoa_id = public.pessoa_atual());

drop trigger if exists tg_tour_atualizado_em on public.tour_progresso;
create trigger tg_tour_atualizado_em
  before update on public.tour_progresso
  for each row execute function public.tocar_atualizado_em();

-- Registrar/atualizar o progresso do tour em uma única chamada do front.
create or replace function public.registrar_tour(
  _modulo text,
  _passo integer default 0,
  _versao integer default 1,
  _concluido boolean default false,
  _pulado boolean default false
)
returns public.tour_progresso
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pessoa uuid := public.pessoa_atual();
  v_linha public.tour_progresso;
begin
  if v_pessoa is null then
    raise exception 'sem pessoa vinculada ao usuário atual';
  end if;

  insert into public.tour_progresso (pessoa_id, modulo, versao, passo_atual,
                                     concluido_em, pulado_em)
  values (v_pessoa, _modulo, _versao, greatest(_passo, 0),
          case when _concluido then now() end,
          case when _pulado then now() end)
  on conflict (pessoa_id, modulo, versao) do update
    set passo_atual  = greatest(excluded.passo_atual, public.tour_progresso.passo_atual),
        concluido_em = coalesce(public.tour_progresso.concluido_em, excluded.concluido_em),
        pulado_em    = coalesce(excluded.pulado_em, public.tour_progresso.pulado_em)
  returning * into v_linha;

  return v_linha;
end;
$$;

revoke all on function public.registrar_tour(text, integer, integer, boolean, boolean) from public;
grant execute on function public.registrar_tour(text, integer, integer, boolean, boolean) to authenticated;

-- Deve o tour abrir sozinho agora? (o botão manual continua sempre disponível)
create or replace function public.tour_pendente(_modulo text, _versao integer default 1)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.tour_progresso t
    where t.pessoa_id = public.pessoa_atual()
      and t.modulo = _modulo
      and t.versao = _versao
      and (t.concluido_em is not null or t.pulado_em is not null)
  );
$$;

revoke all on function public.tour_pendente(text, integer) from public;
grant execute on function public.tour_pendente(text, integer) to authenticated;
