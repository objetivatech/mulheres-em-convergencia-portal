-- 0005 — Planos e Eventos (projeto novo)
-- Princípios: sem estado derivado gravado (vagas e usos de cupom são consultas),
-- permissão explícita (GRANT + RLS junto do CREATE TABLE), idempotente.

-- ============================================================
-- Planos
-- ============================================================
create table if not exists public.planos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  descricao text,
  tipo acesso_tipo not null default 'diretorio',
  valor_centavos integer not null default 0,
  periodicidade text not null default 'mensal',
  dias_acesso integer not null default 31,
  beneficios jsonb not null default '[]'::jsonb,
  destaque boolean not null default false,
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

grant select on public.planos to anon;
grant select, insert, update, delete on public.planos to authenticated;
grant all on public.planos to service_role;
alter table public.planos enable row level security;

drop policy if exists planos_public_select on public.planos;
create policy planos_public_select on public.planos
  for select to anon, authenticated using (ativo or public.e_admin());

drop policy if exists planos_admin_all on public.planos;
create policy planos_admin_all on public.planos
  for all to authenticated using (public.e_admin()) with check (public.e_admin());

drop trigger if exists tg_planos_atualizado_em on public.planos;
create trigger tg_planos_atualizado_em before update on public.planos
  for each row execute function public.tg_set_atualizado_em();

-- ============================================================
-- Eventos
-- ============================================================
create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  resumo text,
  descricao text,
  capa_url text,
  online boolean not null default false,
  link_online text,
  local_nome text,
  endereco text,
  cidade text,
  uf text,
  inicio_em timestamptz not null,
  fim_em timestamptz,
  vagas integer,
  gratuito boolean not null default false,
  publicado boolean not null default false,
  destaque boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

grant select on public.eventos to anon;
grant select, insert, update, delete on public.eventos to authenticated;
grant all on public.eventos to service_role;
alter table public.eventos enable row level security;

drop policy if exists eventos_public_select on public.eventos;
create policy eventos_public_select on public.eventos
  for select to anon, authenticated using (publicado or public.e_admin());

drop policy if exists eventos_admin_all on public.eventos;
create policy eventos_admin_all on public.eventos
  for all to authenticated using (public.e_admin()) with check (public.e_admin());

drop trigger if exists tg_eventos_atualizado_em on public.eventos;
create trigger tg_eventos_atualizado_em before update on public.eventos
  for each row execute function public.tg_set_atualizado_em();

-- Lotes -------------------------------------------------------
create table if not exists public.evento_lotes (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  nome text not null,
  valor_centavos integer not null default 0,
  vagas integer,
  inicio_em timestamptz,
  fim_em timestamptz,
  ordem integer not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create index if not exists idx_evento_lotes_evento on public.evento_lotes(evento_id);

grant select on public.evento_lotes to anon;
grant select, insert, update, delete on public.evento_lotes to authenticated;
grant all on public.evento_lotes to service_role;
alter table public.evento_lotes enable row level security;

drop policy if exists evento_lotes_public_select on public.evento_lotes;
create policy evento_lotes_public_select on public.evento_lotes
  for select to anon, authenticated
  using (exists (select 1 from public.eventos e where e.id = evento_id and (e.publicado or public.e_admin())));

drop policy if exists evento_lotes_admin_all on public.evento_lotes;
create policy evento_lotes_admin_all on public.evento_lotes
  for all to authenticated using (public.e_admin()) with check (public.e_admin());

-- Palestrantes ------------------------------------------------
create table if not exists public.evento_palestrantes (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  nome text not null,
  minibio text,
  foto_url text,
  ordem integer not null default 0
);
create index if not exists idx_evento_palestrantes_evento on public.evento_palestrantes(evento_id);

grant select on public.evento_palestrantes to anon;
grant select, insert, update, delete on public.evento_palestrantes to authenticated;
grant all on public.evento_palestrantes to service_role;
alter table public.evento_palestrantes enable row level security;

drop policy if exists evento_palestrantes_public_select on public.evento_palestrantes;
create policy evento_palestrantes_public_select on public.evento_palestrantes
  for select to anon, authenticated
  using (exists (select 1 from public.eventos e where e.id = evento_id and (e.publicado or public.e_admin())));

drop policy if exists evento_palestrantes_admin_all on public.evento_palestrantes;
create policy evento_palestrantes_admin_all on public.evento_palestrantes
  for all to authenticated using (public.e_admin()) with check (public.e_admin());

-- Cupons ------------------------------------------------------
create table if not exists public.evento_cupons (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references public.eventos(id) on delete cascade,
  codigo text not null,
  desconto_tipo text not null default 'percentual',
  desconto_valor integer not null default 0,
  limite_uso integer,
  valido_ate timestamptz,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create unique index if not exists idx_evento_cupons_codigo on public.evento_cupons(lower(codigo), coalesce(evento_id, '00000000-0000-0000-0000-000000000000'::uuid));

grant select, insert, update, delete on public.evento_cupons to authenticated;
grant all on public.evento_cupons to service_role;
alter table public.evento_cupons enable row level security;

drop policy if exists evento_cupons_admin_all on public.evento_cupons;
create policy evento_cupons_admin_all on public.evento_cupons
  for all to authenticated using (public.e_admin()) with check (public.e_admin());

-- Inscrições --------------------------------------------------
create table if not exists public.evento_inscricoes (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  lote_id uuid references public.evento_lotes(id) on delete set null,
  pessoa_id uuid references public.pessoas(id) on delete set null,
  cupom_id uuid references public.evento_cupons(id) on delete set null,
  nome text not null,
  email citext not null,
  telefone text,
  valor_centavos integer not null default 0,
  situacao text not null default 'pendente',
  pagamento_id uuid references public.pagamentos(id) on delete set null,
  criado_em timestamptz not null default now()
);
create index if not exists idx_evento_inscricoes_evento on public.evento_inscricoes(evento_id);
create unique index if not exists idx_evento_inscricoes_pessoa on public.evento_inscricoes(evento_id, pessoa_id) where pessoa_id is not null;

grant select, insert, update on public.evento_inscricoes to authenticated;
grant all on public.evento_inscricoes to service_role;
alter table public.evento_inscricoes enable row level security;

drop policy if exists evento_inscricoes_minhas on public.evento_inscricoes;
create policy evento_inscricoes_minhas on public.evento_inscricoes
  for select to authenticated using (pessoa_id = public.pessoa_atual() or public.e_admin());

drop policy if exists evento_inscricoes_insert on public.evento_inscricoes;
create policy evento_inscricoes_insert on public.evento_inscricoes
  for insert to authenticated with check (pessoa_id = public.pessoa_atual() or public.e_admin());

drop policy if exists evento_inscricoes_admin_update on public.evento_inscricoes;
create policy evento_inscricoes_admin_update on public.evento_inscricoes
  for update to authenticated using (public.e_admin()) with check (public.e_admin());

-- Presenças ---------------------------------------------------
create table if not exists public.evento_presencas (
  id uuid primary key default gen_random_uuid(),
  inscricao_id uuid not null unique references public.evento_inscricoes(id) on delete cascade,
  registrado_em timestamptz not null default now(),
  registrado_por uuid references public.pessoas(id) on delete set null
);

grant select, insert, delete on public.evento_presencas to authenticated;
grant all on public.evento_presencas to service_role;
alter table public.evento_presencas enable row level security;

drop policy if exists evento_presencas_admin_all on public.evento_presencas;
create policy evento_presencas_admin_all on public.evento_presencas
  for all to authenticated using (public.e_admin()) with check (public.e_admin());

drop policy if exists evento_presencas_minha_select on public.evento_presencas;
create policy evento_presencas_minha_select on public.evento_presencas
  for select to authenticated
  using (exists (select 1 from public.evento_inscricoes i
                 where i.id = inscricao_id and i.pessoa_id = public.pessoa_atual()));

-- ============================================================
-- Vagas ocupadas: consulta, nunca contador gravado
-- ============================================================
create or replace view public.v_evento_vagas as
  select e.id as evento_id,
         e.vagas,
         count(i.id) filter (where i.situacao = 'confirmada') as ocupadas,
         case when e.vagas is null then null
              else greatest(e.vagas - count(i.id) filter (where i.situacao = 'confirmada'), 0) end as disponiveis
  from public.eventos e
  left join public.evento_inscricoes i on i.evento_id = e.id
  group by e.id, e.vagas;

grant select on public.v_evento_vagas to anon, authenticated, service_role;

-- Lote vigente: o primeiro lote ativo dentro da janela e com estoque
create or replace function public.lote_vigente(_evento_id uuid)
returns uuid
language sql
stable
security definer
set search_path to 'public'
as $$
  select l.id
  from public.evento_lotes l
  where l.evento_id = _evento_id
    and l.ativo
    and (l.inicio_em is null or l.inicio_em <= now())
    and (l.fim_em is null or l.fim_em > now())
    and (l.vagas is null or l.vagas > (
      select count(*) from public.evento_inscricoes i
      where i.lote_id = l.id and i.situacao <> 'cancelada'
    ))
  order by l.ordem, l.valor_centavos
  limit 1
$$;
