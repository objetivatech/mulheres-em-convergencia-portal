-- ============================================================================
-- 0009 — Conecta+: conexões entre associadas e mensagens diretas
-- Depende de 0001 (pessoas, pessoa_atual, e_admin, tenho_acesso) e 0006 (conecta_*).
-- Nada de estado derivado: conexões e mensagens são fatos gravados.
-- ============================================================================

create table if not exists public.conecta_conexoes (
  id uuid primary key default gen_random_uuid(),
  de_pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  para_pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  situacao text not null default 'pendente' check (situacao in ('pendente','aceita','recusada')),
  mensagem text,
  criado_em timestamptz not null default now(),
  respondido_em timestamptz,
  unique (de_pessoa_id, para_pessoa_id),
  check (de_pessoa_id <> para_pessoa_id)
);
create index if not exists ix_conecta_conexoes_de on public.conecta_conexoes (de_pessoa_id);
create index if not exists ix_conecta_conexoes_para on public.conecta_conexoes (para_pessoa_id);

grant select, insert, update, delete on public.conecta_conexoes to authenticated;
grant all on public.conecta_conexoes to service_role;
alter table public.conecta_conexoes enable row level security;

drop policy if exists conecta_conexoes_envolvidas on public.conecta_conexoes;
create policy conecta_conexoes_envolvidas on public.conecta_conexoes for select to authenticated
  using (de_pessoa_id = public.pessoa_atual() or para_pessoa_id = public.pessoa_atual() or public.e_admin());

drop policy if exists conecta_conexoes_criar on public.conecta_conexoes;
create policy conecta_conexoes_criar on public.conecta_conexoes for insert to authenticated
  with check (de_pessoa_id = public.pessoa_atual() and public.tenho_acesso('conecta'));

drop policy if exists conecta_conexoes_responder on public.conecta_conexoes;
create policy conecta_conexoes_responder on public.conecta_conexoes for update to authenticated
  using (de_pessoa_id = public.pessoa_atual() or para_pessoa_id = public.pessoa_atual() or public.e_admin())
  with check (true);

drop policy if exists conecta_conexoes_remover on public.conecta_conexoes;
create policy conecta_conexoes_remover on public.conecta_conexoes for delete to authenticated
  using (de_pessoa_id = public.pessoa_atual() or para_pessoa_id = public.pessoa_atual() or public.e_admin());

-- Conexão aceita entre duas pessoas (usada pela política de mensagens).
create or replace function public.conecta_conectadas(_a uuid, _b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conecta_conexoes c
    where c.situacao = 'aceita'
      and ((c.de_pessoa_id = _a and c.para_pessoa_id = _b)
        or (c.de_pessoa_id = _b and c.para_pessoa_id = _a))
  )
$$;
revoke all on function public.conecta_conectadas(uuid, uuid) from public, anon;
grant execute on function public.conecta_conectadas(uuid, uuid) to authenticated, service_role;

create table if not exists public.conecta_mensagens (
  id uuid primary key default gen_random_uuid(),
  de_pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  para_pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  conteudo text not null,
  lida_em timestamptz,
  criado_em timestamptz not null default now(),
  check (de_pessoa_id <> para_pessoa_id)
);
create index if not exists ix_conecta_mensagens_para on public.conecta_mensagens (para_pessoa_id, lida_em);
create index if not exists ix_conecta_mensagens_par on public.conecta_mensagens (de_pessoa_id, para_pessoa_id, criado_em);

grant select, insert, update on public.conecta_mensagens to authenticated;
grant all on public.conecta_mensagens to service_role;
alter table public.conecta_mensagens enable row level security;

drop policy if exists conecta_mensagens_envolvidas on public.conecta_mensagens;
create policy conecta_mensagens_envolvidas on public.conecta_mensagens for select to authenticated
  using (de_pessoa_id = public.pessoa_atual() or para_pessoa_id = public.pessoa_atual() or public.e_admin());

drop policy if exists conecta_mensagens_enviar on public.conecta_mensagens;
create policy conecta_mensagens_enviar on public.conecta_mensagens for insert to authenticated
  with check (
    de_pessoa_id = public.pessoa_atual()
    and public.tenho_acesso('conecta')
    and public.conecta_conectadas(de_pessoa_id, para_pessoa_id)
  );

drop policy if exists conecta_mensagens_marcar_lida on public.conecta_mensagens;
create policy conecta_mensagens_marcar_lida on public.conecta_mensagens for update to authenticated
  using (para_pessoa_id = public.pessoa_atual())
  with check (para_pessoa_id = public.pessoa_atual());

alter table public.conecta_conexoes replica identity full;
alter table public.conecta_mensagens replica identity full;
