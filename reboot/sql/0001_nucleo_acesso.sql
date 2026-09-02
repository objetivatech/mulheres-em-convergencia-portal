-- =====================================================================
-- Reboot — Migration 0001: Núcleo de Acesso
-- Projeto de destino: tysvpeprhokdijquprkd (banco NOVO, vazio)
-- NÃO aplicar no projeto antigo (ngqymbjatenxztrjjdxa).
--
-- Idempotente: pode ser executada mais de uma vez sem efeito duplicado.
-- Conteúdo: pessoas, contatos, papéis, concessões de acesso, pagamentos,
--           webhooks recebidos, função única de consulta de acesso.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------
-- 0. Tipos
-- ---------------------------------------------------------------------
do $$ begin
  create type public.papel_tipo as enum (
    'admin','editora','embaixadora','dona_negocio','assinante','aluna','facilitadora'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.acesso_tipo as enum (
    'diretorio','conecta','academy','evento','area_embaixadora'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.acesso_origem as enum (
    'pagamento','cortesia','administrativo','importacao'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.pagamento_situacao as enum (
    'pendente','confirmado','estornado','cancelado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.contato_tipo as enum ('email','telefone','whatsapp');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 1. Higiene (único uso de trigger permitido pelo schema novo)
-- ---------------------------------------------------------------------
create or replace function public.tg_set_atualizado_em()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create or replace function public.so_digitos(txt text)
returns text
language sql
immutable
as $$ select nullif(regexp_replace(coalesce(txt,''), '\D', '', 'g'), '') $$;

-- ---------------------------------------------------------------------
-- 2. pessoas — registro único; CPF é o identificador central
-- ---------------------------------------------------------------------
create table if not exists public.pessoas (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique,
  cpf           text unique,
  nome          text not null,
  nome_social   text,
  data_nascimento date,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint pessoas_cpf_digitos check (cpf is null or cpf ~ '^\d{11}$')
);

grant select, insert, update on public.pessoas to authenticated;
grant all on public.pessoas to service_role;
alter table public.pessoas enable row level security;

-- ---------------------------------------------------------------------
-- 3. papéis — SEMPRE em tabela separada (nunca no perfil)
-- ---------------------------------------------------------------------
create table if not exists public.papeis (
  id         uuid primary key default gen_random_uuid(),
  pessoa_id  uuid not null references public.pessoas(id) on delete cascade,
  papel      public.papel_tipo not null,
  criado_em  timestamptz not null default now(),
  criado_por uuid references public.pessoas(id),
  unique (pessoa_id, papel)
);

grant select on public.papeis to authenticated;
grant all on public.papeis to service_role;
alter table public.papeis enable row level security;

-- Funções de identidade / autorização (SECURITY DEFINER: nunca consultam
-- a tabela protegida dentro da própria policy dela)
create or replace function public.pessoa_atual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$ select id from public.pessoas where auth_user_id = auth.uid() limit 1 $$;

create or replace function public.tem_papel(_pessoa_id uuid, _papel public.papel_tipo)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.papeis
    where pessoa_id = _pessoa_id and papel = _papel
  )
$$;

create or replace function public.e_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select public.tem_papel(public.pessoa_atual(), 'admin') $$;

-- ---------------------------------------------------------------------
-- 4. pessoa_contatos — histórico não destrutivo
-- ---------------------------------------------------------------------
create table if not exists public.pessoa_contatos (
  id         uuid primary key default gen_random_uuid(),
  pessoa_id  uuid not null references public.pessoas(id) on delete cascade,
  tipo       public.contato_tipo not null,
  valor      citext not null,
  principal  boolean not null default false,
  verificado_em timestamptz,
  criado_em  timestamptz not null default now(),
  unique (pessoa_id, tipo, valor)
);
create index if not exists ix_pessoa_contatos_valor on public.pessoa_contatos (valor);

grant select, insert, update on public.pessoa_contatos to authenticated;
grant all on public.pessoa_contatos to service_role;
alter table public.pessoa_contatos enable row level security;

-- ---------------------------------------------------------------------
-- 5. pagamentos — o fato financeiro, vindo do Asaas
-- ---------------------------------------------------------------------
create table if not exists public.pagamentos (
  id              uuid primary key default gen_random_uuid(),
  pessoa_id       uuid references public.pessoas(id) on delete set null,
  provedor        text not null default 'asaas',
  cobranca_externa_id text,
  assinatura_externa_id text,
  cliente_externo_id  text,
  referencia_externa  text,
  descricao       text,
  valor_centavos  integer not null check (valor_centavos >= 0),
  situacao        public.pagamento_situacao not null default 'pendente',
  vencimento_em   date,
  confirmado_em   timestamptz,
  dados_brutos    jsonb not null default '{}'::jsonb,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  unique (provedor, cobranca_externa_id)
);
create index if not exists ix_pagamentos_pessoa on public.pagamentos (pessoa_id, confirmado_em desc);

grant select on public.pagamentos to authenticated;
grant all on public.pagamentos to service_role;
alter table public.pagamentos enable row level security;

drop trigger if exists tg_pagamentos_atualizado_em on public.pagamentos;
create trigger tg_pagamentos_atualizado_em
  before update on public.pagamentos
  for each row execute function public.tg_set_atualizado_em();

-- ---------------------------------------------------------------------
-- 6. concessoes_acesso — o coração do sistema
--    Nenhuma linha passada é editada: revoga-se ou cria-se outra.
-- ---------------------------------------------------------------------
create table if not exists public.concessoes_acesso (
  id             uuid primary key default gen_random_uuid(),
  pessoa_id      uuid not null references public.pessoas(id) on delete cascade,
  tipo           public.acesso_tipo not null,
  origem         public.acesso_origem not null,
  pagamento_id   uuid references public.pagamentos(id) on delete set null,
  inicio_em      timestamptz not null default now(),
  fim_em         timestamptz,               -- nulo = permanente
  motivo         text,
  criado_por     uuid references public.pessoas(id),
  criado_em      timestamptz not null default now(),
  revogado_em    timestamptz,
  revogado_motivo text,
  constraint concessao_janela_valida check (fim_em is null or fim_em > inicio_em),
  constraint concessao_motivo_obrigatorio check (
    origem not in ('cortesia','administrativo') or coalesce(btrim(motivo),'') <> ''
  )
);

-- Idempotência: um pagamento gera no máximo uma concessão por tipo.
create unique index if not exists ux_concessao_por_pagamento
  on public.concessoes_acesso (pagamento_id, tipo)
  where pagamento_id is not null;

create index if not exists ix_concessoes_vigencia
  on public.concessoes_acesso (pessoa_id, tipo, fim_em desc);

grant select on public.concessoes_acesso to authenticated;
grant all on public.concessoes_acesso to service_role;
alter table public.concessoes_acesso enable row level security;

-- ---------------------------------------------------------------------
-- 7. webhooks_recebidos — registro idempotente de todo evento externo
-- ---------------------------------------------------------------------
create table if not exists public.webhooks_recebidos (
  id            uuid primary key default gen_random_uuid(),
  provedor      text not null default 'asaas',
  evento_externo_id text not null,
  tipo_evento   text,
  carga         jsonb not null,
  recebido_em   timestamptz not null default now(),
  processado_em timestamptz,
  tentativas    integer not null default 0,
  erro          text,
  unique (provedor, evento_externo_id)
);
create index if not exists ix_webhooks_pendentes
  on public.webhooks_recebidos (recebido_em desc)
  where processado_em is null;

grant all on public.webhooks_recebidos to service_role;
alter table public.webhooks_recebidos enable row level security;

-- ---------------------------------------------------------------------
-- 8. Função única de consulta de acesso
--    Toda tela do portal responde "tem acesso?" por aqui.
-- ---------------------------------------------------------------------
create or replace function public.acesso_vigente(_pessoa_id uuid, _tipo public.acesso_tipo)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.concessoes_acesso c
    where c.pessoa_id = _pessoa_id
      and c.tipo = _tipo
      and c.revogado_em is null
      and c.inicio_em <= now()
      and (c.fim_em is null or c.fim_em > now())
  )
$$;

create or replace function public.tenho_acesso(_tipo public.acesso_tipo)
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select public.acesso_vigente(public.pessoa_atual(), _tipo) $$;

-- Situação detalhada (para painel de operação e telas de aviso)
create or replace function public.situacao_acesso(_pessoa_id uuid, _tipo public.acesso_tipo)
returns table (
  vigente          boolean,
  vence_em         timestamptz,
  origem           public.acesso_origem,
  dias_desde_fim   integer,
  em_carencia      boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with ultima as (
    select c.*
    from public.concessoes_acesso c
    where c.pessoa_id = _pessoa_id
      and c.tipo = _tipo
      and c.revogado_em is null
    order by coalesce(c.fim_em, 'infinity'::timestamptz) desc
    limit 1
  )
  select
    coalesce(u.inicio_em <= now() and (u.fim_em is null or u.fim_em > now()), false),
    u.fim_em,
    u.origem,
    case when u.fim_em is null or u.fim_em > now() then 0
         else extract(day from now() - u.fim_em)::int end,
    coalesce(u.fim_em is not null and u.fim_em <= now() and now() - u.fim_em < interval '5 days', false)
  from ultima u
  right join (select 1) x on true
$$;

-- Concessão a partir de um pagamento confirmado. Sempre a partir da
-- confirmação — pagar em atraso deixa de ser caso especial.
create or replace function public.conceder_por_pagamento(
  _pagamento_id uuid,
  _tipo public.acesso_tipo,
  _dias integer default 31
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pessoa uuid;
  v_confirmado timestamptz;
  v_id uuid;
begin
  select pessoa_id, coalesce(confirmado_em, now())
    into v_pessoa, v_confirmado
  from public.pagamentos
  where id = _pagamento_id and situacao = 'confirmado';

  if v_pessoa is null then
    return null; -- pagamento inexistente, não confirmado ou sem pessoa identificada
  end if;

  insert into public.concessoes_acesso (pessoa_id, tipo, origem, pagamento_id, inicio_em, fim_em)
  values (v_pessoa, _tipo, 'pagamento', _pagamento_id, v_confirmado, v_confirmado + make_interval(days => _dias))
  on conflict (pagamento_id, tipo) where pagamento_id is not null
  do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.concessoes_acesso
    where pagamento_id = _pagamento_id and tipo = _tipo;
  end if;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 9. Políticas RLS
-- ---------------------------------------------------------------------
drop policy if exists pessoas_self_select on public.pessoas;
create policy pessoas_self_select on public.pessoas
  for select to authenticated
  using (auth_user_id = auth.uid() or public.e_admin());

drop policy if exists pessoas_self_update on public.pessoas;
create policy pessoas_self_update on public.pessoas
  for update to authenticated
  using (auth_user_id = auth.uid() or public.e_admin())
  with check (auth_user_id = auth.uid() or public.e_admin());

drop policy if exists pessoas_self_insert on public.pessoas;
create policy pessoas_self_insert on public.pessoas
  for insert to authenticated
  with check (auth_user_id = auth.uid());

drop policy if exists papeis_select on public.papeis;
create policy papeis_select on public.papeis
  for select to authenticated
  using (pessoa_id = public.pessoa_atual() or public.e_admin());

drop policy if exists contatos_self on public.pessoa_contatos;
create policy contatos_self on public.pessoa_contatos
  for select to authenticated
  using (pessoa_id = public.pessoa_atual() or public.e_admin());

drop policy if exists contatos_self_write on public.pessoa_contatos;
create policy contatos_self_write on public.pessoa_contatos
  for insert to authenticated
  with check (pessoa_id = public.pessoa_atual());

drop policy if exists pagamentos_self on public.pagamentos;
create policy pagamentos_self on public.pagamentos
  for select to authenticated
  using (pessoa_id = public.pessoa_atual() or public.e_admin());

drop policy if exists concessoes_self on public.concessoes_acesso;
create policy concessoes_self on public.concessoes_acesso
  for select to authenticated
  using (pessoa_id = public.pessoa_atual() or public.e_admin());

-- webhooks_recebidos: nenhum acesso por cliente. Só service_role (edge functions).

-- ---------------------------------------------------------------------
-- 10. Visão de operação (painel administrativo)
-- ---------------------------------------------------------------------
create or replace view public.v_acesso_operacao
with (security_invoker = true)
as
select
  p.id                as pessoa_id,
  p.nome,
  p.cpf,
  c.tipo,
  c.origem,
  c.inicio_em,
  c.fim_em,
  (c.revogado_em is null and c.inicio_em <= now() and (c.fim_em is null or c.fim_em > now())) as vigente,
  pg.cobranca_externa_id,
  pg.valor_centavos,
  pg.confirmado_em
from public.pessoas p
join public.concessoes_acesso c on c.pessoa_id = p.id
left join public.pagamentos pg on pg.id = c.pagamento_id;

grant select on public.v_acesso_operacao to authenticated;
