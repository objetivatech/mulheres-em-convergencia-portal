-- 1) Textos e imagens editáveis do site --------------------------------------
create table if not exists public.textos_site (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  grupo text not null default 'geral',
  rotulo text,
  tipo text not null default 'texto' check (tipo in ('texto','rico','imagem')),
  valor text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

grant select on public.textos_site to anon;
grant select, insert, update, delete on public.textos_site to authenticated;
grant all on public.textos_site to service_role;

alter table public.textos_site enable row level security;

drop policy if exists "textos_site leitura publica" on public.textos_site;
create policy "textos_site leitura publica"
  on public.textos_site for select
  to anon, authenticated
  using (true);

drop policy if exists "textos_site escrita equipe" on public.textos_site;
create policy "textos_site escrita equipe"
  on public.textos_site for all
  to authenticated
  using (public.e_admin() or public.tem_papel(public.pessoa_atual(), 'editora'))
  with check (public.e_admin() or public.tem_papel(public.pessoa_atual(), 'editora'));

drop trigger if exists tg_textos_site_atualizado_em on public.textos_site;
create trigger tg_textos_site_atualizado_em
  before update on public.textos_site
  for each row execute function public.tg_set_atualizado_em();

create index if not exists idx_textos_site_grupo on public.textos_site (grupo);

-- 2) Planos: visibilidade e ofertas privadas ---------------------------------
alter table public.planos
  add column if not exists visibilidade text not null default 'publico',
  add column if not exists codigo_oferta text,
  add column if not exists oferta_validade timestamptz,
  add column if not exists oferta_limite_usos integer,
  add column if not exists observacao_interna text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'planos_visibilidade_check'
  ) then
    alter table public.planos
      add constraint planos_visibilidade_check
      check (visibilidade in ('publico','oculto','privado'));
  end if;
end $$;

create unique index if not exists idx_planos_codigo_oferta
  on public.planos (lower(codigo_oferta)) where codigo_oferta is not null;

-- 3) Pagamento ligado ao plano de origem -------------------------------------
alter table public.pagamentos
  add column if not exists plano_id uuid references public.planos(id);

create index if not exists idx_pagamentos_plano on public.pagamentos (plano_id);