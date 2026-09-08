-- 0004 — Site público: negócios (diretório), conteúdo (blog), páginas e blocos
-- Princípios: sem estado derivado, permissão explícita, visibilidade é consulta.

-- ============================================================
-- Enums
-- ============================================================
do $$ begin
  create type midia_tipo as enum ('logo', 'capa', 'galeria');
exception when duplicate_object then null; end $$;

do $$ begin
  create type publicacao_situacao as enum ('rascunho', 'agendado', 'publicado', 'arquivado');
exception when duplicate_object then null; end $$;

-- ============================================================
-- Domínio 2 — Negócios
-- ============================================================
create table if not exists public.negocios (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid references public.pessoas(id) on delete set null,
  slug text not null unique,
  nome text not null,
  descricao text,
  categoria text,
  cidade text,
  uf text,
  bairro text,
  telefone text,
  whatsapp text,
  email citext,
  site text,
  instagram text,
  logo_url text,
  capa_url text,
  publicado boolean not null default false,
  destaque boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

grant select on public.negocios to anon;
grant select, insert, update, delete on public.negocios to authenticated;
grant all on public.negocios to service_role;
alter table public.negocios enable row level security;

drop policy if exists negocios_public_select on public.negocios;
create policy negocios_public_select on public.negocios
  for select to anon, authenticated
  using (
    publicado
    and (pessoa_id is null or public.acesso_vigente(pessoa_id, 'diretorio'::acesso_tipo))
  );

drop policy if exists negocios_dona_select on public.negocios;
create policy negocios_dona_select on public.negocios
  for select to authenticated
  using (pessoa_id = public.pessoa_atual() or public.e_admin());

drop policy if exists negocios_dona_insert on public.negocios;
create policy negocios_dona_insert on public.negocios
  for insert to authenticated
  with check (pessoa_id = public.pessoa_atual() or public.e_admin());

drop policy if exists negocios_dona_update on public.negocios;
create policy negocios_dona_update on public.negocios
  for update to authenticated
  using (pessoa_id = public.pessoa_atual() or public.e_admin())
  with check (pessoa_id = public.pessoa_atual() or public.e_admin());

drop policy if exists negocios_admin_delete on public.negocios;
create policy negocios_admin_delete on public.negocios
  for delete to authenticated using (public.e_admin());

drop trigger if exists tg_negocios_atualizado_em on public.negocios;
create trigger tg_negocios_atualizado_em before update on public.negocios
  for each row execute function public.tg_set_atualizado_em();

create index if not exists ix_negocios_categoria on public.negocios (categoria);
create index if not exists ix_negocios_cidade on public.negocios (cidade);

-- Tabelas filhas do negócio
create table if not exists public.negocio_midias (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  tipo midia_tipo not null default 'galeria',
  url text not null,
  legenda text,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);

create table if not exists public.negocio_areas_atendimento (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  cidade text,
  uf text,
  bairro text
);

create table if not exists public.negocio_comodidades (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  nome text not null
);

do $$
declare t text;
begin
  foreach t in array array['negocio_midias', 'negocio_areas_atendimento', 'negocio_comodidades'] loop
    execute format('grant select on public.%I to anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format($f$create policy %I on public.%I for select to anon, authenticated
      using (exists (select 1 from public.negocios n where n.id = negocio_id))$f$, t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_write', t);
    execute format($f$create policy %I on public.%I for all to authenticated
      using (exists (select 1 from public.negocios n where n.id = negocio_id
                     and (n.pessoa_id = public.pessoa_atual() or public.e_admin())))
      with check (exists (select 1 from public.negocios n where n.id = negocio_id
                     and (n.pessoa_id = public.pessoa_atual() or public.e_admin())))$f$, t || '_write', t);
  end loop;
end $$;

create index if not exists ix_negocio_midias_negocio on public.negocio_midias (negocio_id);
create index if not exists ix_negocio_areas_negocio on public.negocio_areas_atendimento (negocio_id);
create index if not exists ix_negocio_comodidades_negocio on public.negocio_comodidades (negocio_id);

-- ============================================================
-- Domínio 4 — Conteúdo
-- ============================================================
create table if not exists public.autores (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid references public.pessoas(id) on delete set null,
  slug text not null unique,
  nome text not null,
  bio text,
  foto_url text,
  criado_em timestamptz not null default now()
);

create table if not exists public.post_categorias (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  descricao text,
  ordem integer not null default 0
);

create table if not exists public.post_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  resumo text,
  conteudo text,
  capa_url text,
  autor_id uuid references public.autores(id) on delete set null,
  situacao publicacao_situacao not null default 'rascunho',
  publicado_em timestamptz,
  destaque boolean not null default false,
  seo_titulo text,
  seo_descricao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.post_categoria_vinculo (
  post_id uuid not null references public.posts(id) on delete cascade,
  categoria_id uuid not null references public.post_categorias(id) on delete cascade,
  primary key (post_id, categoria_id)
);

create table if not exists public.post_tag_vinculo (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.post_tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

create table if not exists public.post_comentarios (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  pessoa_id uuid references public.pessoas(id) on delete set null,
  nome text not null,
  email citext,
  conteudo text not null,
  aprovado_em timestamptz,
  criado_em timestamptz not null default now()
);

create table if not exists public.paginas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  conteudo text,
  seo_titulo text,
  seo_descricao text,
  situacao publicacao_situacao not null default 'rascunho',
  publicado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.blocos_site (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  tipo text not null,
  conteudo jsonb not null default '{}'::jsonb,
  ordem integer not null default 0,
  ativo boolean not null default true,
  atualizado_em timestamptz not null default now()
);

-- Grants + RLS de leitura pública e escrita administrativa
do $$
declare t text;
begin
  foreach t in array array['autores','post_categorias','post_tags','posts',
                           'post_categoria_vinculo','post_tag_vinculo','paginas','blocos_site'] loop
    execute format('grant select on public.%I to anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin', t);
    execute format($f$create policy %I on public.%I for all to authenticated
      using (public.e_admin() or public.tem_papel(public.pessoa_atual(), 'editora'::papel_tipo))
      with check (public.e_admin() or public.tem_papel(public.pessoa_atual(), 'editora'::papel_tipo))$f$,
      t || '_admin', t);
  end loop;
end $$;

drop policy if exists posts_public_select on public.posts;
create policy posts_public_select on public.posts
  for select to anon, authenticated
  using (situacao = 'publicado' and (publicado_em is null or publicado_em <= now()));

drop policy if exists paginas_public_select on public.paginas;
create policy paginas_public_select on public.paginas
  for select to anon, authenticated
  using (situacao = 'publicado' and (publicado_em is null or publicado_em <= now()));

drop policy if exists blocos_public_select on public.blocos_site;
create policy blocos_public_select on public.blocos_site
  for select to anon, authenticated using (ativo);

do $$
declare t text;
begin
  foreach t in array array['autores','post_categorias','post_tags',
                           'post_categoria_vinculo','post_tag_vinculo'] loop
    execute format('drop policy if exists %I on public.%I', t || '_public_select', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)',
      t || '_public_select', t);
  end loop;
end $$;

-- Comentários: público lê só o que foi aprovado, e nunca o e-mail
grant select (id, post_id, pessoa_id, nome, conteudo, aprovado_em, criado_em)
  on public.post_comentarios to anon, authenticated;
grant insert on public.post_comentarios to anon, authenticated;
grant all on public.post_comentarios to service_role;
alter table public.post_comentarios enable row level security;

drop policy if exists comentarios_public_select on public.post_comentarios;
create policy comentarios_public_select on public.post_comentarios
  for select to anon, authenticated using (aprovado_em is not null);

drop policy if exists comentarios_public_insert on public.post_comentarios;
create policy comentarios_public_insert on public.post_comentarios
  for insert to anon, authenticated with check (aprovado_em is null);

drop policy if exists comentarios_admin on public.post_comentarios;
create policy comentarios_admin on public.post_comentarios
  for all to authenticated
  using (public.e_admin() or public.tem_papel(public.pessoa_atual(), 'editora'::papel_tipo))
  with check (public.e_admin() or public.tem_papel(public.pessoa_atual(), 'editora'::papel_tipo));

drop trigger if exists tg_posts_atualizado_em on public.posts;
create trigger tg_posts_atualizado_em before update on public.posts
  for each row execute function public.tg_set_atualizado_em();

drop trigger if exists tg_paginas_atualizado_em on public.paginas;
create trigger tg_paginas_atualizado_em before update on public.paginas
  for each row execute function public.tg_set_atualizado_em();

create index if not exists ix_posts_publicado_em on public.posts (publicado_em desc);
create index if not exists ix_post_comentarios_post on public.post_comentarios (post_id);

-- ============================================================
-- Conteúdo inicial das páginas institucionais e blocos da home
-- ============================================================
insert into public.paginas (slug, titulo, conteudo, seo_titulo, seo_descricao, situacao, publicado_em)
values
  ('sobre', 'Sobre a Mulheres em Convergência',
   '<p>A Mulheres em Convergência é uma rede que conecta mulheres empreendedoras, com formação, diretório de negócios e encontros.</p>',
   'Sobre a Mulheres em Convergência',
   'Conheça a rede que conecta mulheres empreendedoras com formação, diretório e encontros.',
   'publicado', now()),
  ('termos-de-uso', 'Termos de Uso',
   '<p>Conteúdo dos termos de uso a ser revisado pela equipe.</p>',
   'Termos de Uso', 'Termos de uso do portal Mulheres em Convergência.', 'publicado', now()),
  ('politica-de-privacidade', 'Política de Privacidade',
   '<p>Conteúdo da política de privacidade a ser revisado pela equipe.</p>',
   'Política de Privacidade', 'Como tratamos os dados pessoais no portal.', 'publicado', now()),
  ('politica-de-cookies', 'Política de Cookies',
   '<p>Conteúdo da política de cookies a ser revisado pela equipe.</p>',
   'Política de Cookies', 'Como usamos cookies no portal.', 'publicado', now())
on conflict (slug) do nothing;

insert into public.blocos_site (chave, tipo, conteudo, ordem)
values
  ('home_hero', 'hero', jsonb_build_object(
     'titulo', 'Conecte-se à inteligência coletiva de mulheres empreendedoras',
     'subtitulo', 'Associação, formação e um diretório de negócios liderados por mulheres.',
     'cta_texto', 'Quero fazer parte', 'cta_link', '/planos'), 1),
  ('home_pilares', 'pilares', jsonb_build_object('itens', jsonb_build_array(
     jsonb_build_object('titulo', 'Rede', 'texto', 'Encontros e conexões entre empreendedoras', 'link', '/diretorio'),
     jsonb_build_object('titulo', 'Formação', 'texto', 'Cursos e workshops práticos', 'link', '/academy'),
     jsonb_build_object('titulo', 'Visibilidade', 'texto', 'Seu negócio no diretório da rede', 'link', '/diretorio'),
     jsonb_build_object('titulo', 'Conteúdo', 'texto', 'Histórias e aprendizados no blog', 'link', '/convergindo'))), 2)
on conflict (chave) do nothing;
