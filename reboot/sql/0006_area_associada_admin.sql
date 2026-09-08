-- 0006 — Área da associada, CRM, financeiro, Academy, Conecta+ e Embaixadoras
-- Banco novo MeC-v6 (tysvpeprhokdijquprkd).
-- Princípios: GRANT + RLS junto do CREATE TABLE; nenhum estado derivado gravado.

begin;

/* ============================================================ CRM ========= */

create table if not exists public.funis (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  ordem int not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
grant select on public.funis to authenticated;
grant all on public.funis to service_role;
alter table public.funis enable row level security;
drop policy if exists funis_admin on public.funis;
create policy funis_admin on public.funis for all to authenticated
  using (public.e_admin()) with check (public.e_admin());

create table if not exists public.funil_estagios (
  id uuid primary key default gen_random_uuid(),
  funil_id uuid not null references public.funis(id) on delete cascade,
  nome text not null,
  ordem int not null default 0,
  ganho boolean not null default false,
  perdido boolean not null default false,
  criado_em timestamptz not null default now()
);
grant select on public.funil_estagios to authenticated;
grant all on public.funil_estagios to service_role;
alter table public.funil_estagios enable row level security;
drop policy if exists funil_estagios_admin on public.funil_estagios;
create policy funil_estagios_admin on public.funil_estagios for all to authenticated
  using (public.e_admin()) with check (public.e_admin());

create table if not exists public.negociacoes (
  id uuid primary key default gen_random_uuid(),
  funil_id uuid not null references public.funis(id) on delete cascade,
  estagio_id uuid references public.funil_estagios(id) on delete set null,
  pessoa_id uuid references public.pessoas(id) on delete set null,
  negocio_id uuid references public.negocios(id) on delete set null,
  titulo text not null,
  valor_centavos int not null default 0,
  contato_nome text,
  contato_email citext,
  contato_telefone text,
  observacoes text,
  fechado_em timestamptz,
  resultado text check (resultado in ('ganho','perdido')),
  responsavel_id uuid references public.pessoas(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
grant select, insert, update, delete on public.negociacoes to authenticated;
grant all on public.negociacoes to service_role;
alter table public.negociacoes enable row level security;
drop policy if exists negociacoes_admin on public.negociacoes;
create policy negociacoes_admin on public.negociacoes for all to authenticated
  using (public.e_admin()) with check (public.e_admin());
drop trigger if exists tg_negociacoes_atualizado_em on public.negociacoes;
create trigger tg_negociacoes_atualizado_em before update on public.negociacoes
  for each row execute function public.tg_set_atualizado_em();

create table if not exists public.contato_eventos (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid references public.pessoas(id) on delete cascade,
  email citext,
  tipo text not null,
  titulo text not null,
  detalhe text,
  dados jsonb not null default '{}'::jsonb,
  ocorrido_em timestamptz not null default now(),
  criado_em timestamptz not null default now()
);
create index if not exists ix_contato_eventos_pessoa on public.contato_eventos (pessoa_id, ocorrido_em desc);
grant select, insert on public.contato_eventos to authenticated;
grant all on public.contato_eventos to service_role;
alter table public.contato_eventos enable row level security;
drop policy if exists contato_eventos_admin on public.contato_eventos;
create policy contato_eventos_admin on public.contato_eventos for all to authenticated
  using (public.e_admin()) with check (public.e_admin());

-- Linha do tempo unificada: consulta sobre fatos já registrados.
create or replace view public.v_linha_tempo as
  select p.pessoa_id, p.ocorrido_em, p.tipo, p.titulo, p.detalhe
  from (
    select pg.pessoa_id,
           coalesce(pg.confirmado_em, pg.criado_em) as ocorrido_em,
           'pagamento'::text as tipo,
           coalesce(pg.descricao, 'Pagamento') as titulo,
           pg.situacao::text as detalhe
      from public.pagamentos pg
     where pg.pessoa_id is not null
    union all
    select i.pessoa_id, i.criado_em, 'inscricao', e.titulo, i.situacao
      from public.evento_inscricoes i
      join public.eventos e on e.id = i.evento_id
     where i.pessoa_id is not null
    union all
    select c.pessoa_id, c.criado_em, 'acesso', c.tipo::text, c.origem::text
      from public.concessoes_acesso c
    union all
    select ce.pessoa_id, ce.ocorrido_em, ce.tipo, ce.titulo, ce.detalhe
      from public.contato_eventos ce
     where ce.pessoa_id is not null
  ) p;
grant select on public.v_linha_tempo to authenticated;

-- Resumo financeiro por mês (consulta, nunca contador gravado).
create or replace view public.v_financeiro_mensal as
  select date_trunc('month', coalesce(confirmado_em, criado_em))::date as mes,
         situacao,
         count(*) as quantidade,
         sum(valor_centavos) as total_centavos
    from public.pagamentos
   group by 1, 2;
grant select on public.v_financeiro_mensal to authenticated;

/* ========================================================= Academy ======== */

create table if not exists public.curso_categorias (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  ordem int not null default 0
);
grant select on public.curso_categorias to anon, authenticated;
grant all on public.curso_categorias to service_role;
alter table public.curso_categorias enable row level security;
drop policy if exists curso_categorias_leitura on public.curso_categorias;
create policy curso_categorias_leitura on public.curso_categorias for select using (true);
drop policy if exists curso_categorias_admin on public.curso_categorias;
create policy curso_categorias_admin on public.curso_categorias for all to authenticated
  using (public.e_admin()) with check (public.e_admin());

create table if not exists public.cursos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  resumo text,
  descricao text,
  capa_url text,
  categoria_id uuid references public.curso_categorias(id) on delete set null,
  nivel text not null default 'iniciante',
  carga_horaria_min int,
  gratuito boolean not null default false,
  publicado boolean not null default false,
  destaque boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
grant select on public.cursos to anon, authenticated;
grant all on public.cursos to service_role;
alter table public.cursos enable row level security;
drop policy if exists cursos_leitura on public.cursos;
create policy cursos_leitura on public.cursos for select using (publicado or public.e_admin());
drop policy if exists cursos_admin on public.cursos;
create policy cursos_admin on public.cursos for all to authenticated
  using (public.e_admin()) with check (public.e_admin());
drop trigger if exists tg_cursos_atualizado_em on public.cursos;
create trigger tg_cursos_atualizado_em before update on public.cursos
  for each row execute function public.tg_set_atualizado_em();

create table if not exists public.curso_aulas (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references public.cursos(id) on delete cascade,
  titulo text not null,
  descricao text,
  video_url text,
  material_url text,
  duracao_min int,
  ordem int not null default 0,
  gratuita boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists ix_curso_aulas_curso on public.curso_aulas (curso_id, ordem);
grant select on public.curso_aulas to anon, authenticated;
grant all on public.curso_aulas to service_role;
alter table public.curso_aulas enable row level security;
drop policy if exists curso_aulas_leitura on public.curso_aulas;
create policy curso_aulas_leitura on public.curso_aulas for select using (
  exists (select 1 from public.cursos c where c.id = curso_id and (c.publicado or public.e_admin()))
);
drop policy if exists curso_aulas_admin on public.curso_aulas;
create policy curso_aulas_admin on public.curso_aulas for all to authenticated
  using (public.e_admin()) with check (public.e_admin());

create table if not exists public.matriculas (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  curso_id uuid not null references public.cursos(id) on delete cascade,
  criado_em timestamptz not null default now(),
  concluido_em timestamptz,
  unique (pessoa_id, curso_id)
);
grant select, insert, update on public.matriculas to authenticated;
grant all on public.matriculas to service_role;
alter table public.matriculas enable row level security;
drop policy if exists matriculas_propria on public.matriculas;
create policy matriculas_propria on public.matriculas for select to authenticated
  using (pessoa_id = public.pessoa_atual() or public.e_admin());
drop policy if exists matriculas_criar on public.matriculas;
create policy matriculas_criar on public.matriculas for insert to authenticated
  with check (pessoa_id = public.pessoa_atual()
              and (public.tenho_acesso('academy') or exists (select 1 from public.cursos c where c.id = curso_id and c.gratuito)));
drop policy if exists matriculas_atualizar on public.matriculas;
create policy matriculas_atualizar on public.matriculas for update to authenticated
  using (pessoa_id = public.pessoa_atual() or public.e_admin())
  with check (pessoa_id = public.pessoa_atual() or public.e_admin());

create table if not exists public.progresso_aulas (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  aula_id uuid not null references public.curso_aulas(id) on delete cascade,
  concluida_em timestamptz not null default now(),
  unique (pessoa_id, aula_id)
);
grant select, insert, delete on public.progresso_aulas to authenticated;
grant all on public.progresso_aulas to service_role;
alter table public.progresso_aulas enable row level security;
drop policy if exists progresso_proprio on public.progresso_aulas;
create policy progresso_proprio on public.progresso_aulas for all to authenticated
  using (pessoa_id = public.pessoa_atual() or public.e_admin())
  with check (pessoa_id = public.pessoa_atual());

/* ======================================================== Conecta+ ======== */

create table if not exists public.conecta_perfis (
  pessoa_id uuid primary key references public.pessoas(id) on delete cascade,
  apresentacao text,
  empresa text,
  cargo text,
  interesses text[] not null default '{}',
  aceita_contato boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
grant select, insert, update on public.conecta_perfis to authenticated;
grant all on public.conecta_perfis to service_role;
alter table public.conecta_perfis enable row level security;
drop policy if exists conecta_perfis_membros on public.conecta_perfis;
create policy conecta_perfis_membros on public.conecta_perfis for select to authenticated
  using (public.tenho_acesso('conecta') or public.e_admin() or pessoa_id = public.pessoa_atual());
drop policy if exists conecta_perfis_proprio on public.conecta_perfis;
create policy conecta_perfis_proprio on public.conecta_perfis for all to authenticated
  using (pessoa_id = public.pessoa_atual() or public.e_admin())
  with check (pessoa_id = public.pessoa_atual() or public.e_admin());
drop trigger if exists tg_conecta_perfis_atualizado_em on public.conecta_perfis;
create trigger tg_conecta_perfis_atualizado_em before update on public.conecta_perfis
  for each row execute function public.tg_set_atualizado_em();

create table if not exists public.conecta_grupos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  descricao text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
grant select on public.conecta_grupos to authenticated;
grant all on public.conecta_grupos to service_role;
alter table public.conecta_grupos enable row level security;
drop policy if exists conecta_grupos_membros on public.conecta_grupos;
create policy conecta_grupos_membros on public.conecta_grupos for select to authenticated
  using (public.tenho_acesso('conecta') or public.e_admin());
drop policy if exists conecta_grupos_admin on public.conecta_grupos;
create policy conecta_grupos_admin on public.conecta_grupos for all to authenticated
  using (public.e_admin()) with check (public.e_admin());

create table if not exists public.conecta_grupo_membros (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.conecta_grupos(id) on delete cascade,
  pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  entrou_em timestamptz not null default now(),
  unique (grupo_id, pessoa_id)
);
grant select, insert, delete on public.conecta_grupo_membros to authenticated;
grant all on public.conecta_grupo_membros to service_role;
alter table public.conecta_grupo_membros enable row level security;
drop policy if exists conecta_membros_ver on public.conecta_grupo_membros;
create policy conecta_membros_ver on public.conecta_grupo_membros for select to authenticated
  using (public.tenho_acesso('conecta') or public.e_admin());
drop policy if exists conecta_membros_proprio on public.conecta_grupo_membros;
create policy conecta_membros_proprio on public.conecta_grupo_membros for all to authenticated
  using (pessoa_id = public.pessoa_atual() or public.e_admin())
  with check ((pessoa_id = public.pessoa_atual() and public.tenho_acesso('conecta')) or public.e_admin());

create table if not exists public.conecta_indicacoes (
  id uuid primary key default gen_random_uuid(),
  de_pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  para_pessoa_id uuid references public.pessoas(id) on delete set null,
  descricao text not null,
  situacao text not null default 'aberta' check (situacao in ('aberta','em_andamento','fechada','descartada')),
  criado_em timestamptz not null default now()
);
grant select, insert, update on public.conecta_indicacoes to authenticated;
grant all on public.conecta_indicacoes to service_role;
alter table public.conecta_indicacoes enable row level security;
drop policy if exists conecta_indicacoes_envolvidas on public.conecta_indicacoes;
create policy conecta_indicacoes_envolvidas on public.conecta_indicacoes for select to authenticated
  using (de_pessoa_id = public.pessoa_atual() or para_pessoa_id = public.pessoa_atual() or public.e_admin());
drop policy if exists conecta_indicacoes_criar on public.conecta_indicacoes;
create policy conecta_indicacoes_criar on public.conecta_indicacoes for insert to authenticated
  with check (de_pessoa_id = public.pessoa_atual() and public.tenho_acesso('conecta'));
drop policy if exists conecta_indicacoes_atualizar on public.conecta_indicacoes;
create policy conecta_indicacoes_atualizar on public.conecta_indicacoes for update to authenticated
  using (de_pessoa_id = public.pessoa_atual() or para_pessoa_id = public.pessoa_atual() or public.e_admin())
  with check (true);

/* ===================================================== Embaixadoras ======= */

create table if not exists public.embaixadora_niveis (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  comissao_percentual numeric(5,2) not null default 0,
  minimo_indicacoes int not null default 0,
  ordem int not null default 0
);
grant select on public.embaixadora_niveis to anon, authenticated;
grant all on public.embaixadora_niveis to service_role;
alter table public.embaixadora_niveis enable row level security;
drop policy if exists niveis_leitura on public.embaixadora_niveis;
create policy niveis_leitura on public.embaixadora_niveis for select using (true);
drop policy if exists niveis_admin on public.embaixadora_niveis;
create policy niveis_admin on public.embaixadora_niveis for all to authenticated
  using (public.e_admin()) with check (public.e_admin());

create table if not exists public.embaixadoras (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null unique references public.pessoas(id) on delete cascade,
  codigo text not null unique,
  nivel_id uuid references public.embaixadora_niveis(id) on delete set null,
  apresentacao text,
  cidade text,
  uf text,
  publicada boolean not null default false,
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
grant select on public.embaixadoras to anon, authenticated;
grant update on public.embaixadoras to authenticated;
grant all on public.embaixadoras to service_role;
alter table public.embaixadoras enable row level security;
drop policy if exists embaixadoras_publicas on public.embaixadoras;
create policy embaixadoras_publicas on public.embaixadoras for select
  using (publicada or public.e_admin() or pessoa_id = public.pessoa_atual());
drop policy if exists embaixadoras_admin on public.embaixadoras;
create policy embaixadoras_admin on public.embaixadoras for all to authenticated
  using (public.e_admin()) with check (public.e_admin());
drop policy if exists embaixadoras_propria on public.embaixadoras;
create policy embaixadoras_propria on public.embaixadoras for update to authenticated
  using (pessoa_id = public.pessoa_atual()) with check (pessoa_id = public.pessoa_atual());
drop trigger if exists tg_embaixadoras_atualizado_em on public.embaixadoras;
create trigger tg_embaixadoras_atualizado_em before update on public.embaixadoras
  for each row execute function public.tg_set_atualizado_em();

create table if not exists public.embaixadora_indicacoes (
  id uuid primary key default gen_random_uuid(),
  embaixadora_id uuid not null references public.embaixadoras(id) on delete cascade,
  pessoa_indicada_id uuid references public.pessoas(id) on delete set null,
  pagamento_id uuid references public.pagamentos(id) on delete set null,
  email citext,
  nome text,
  criado_em timestamptz not null default now(),
  unique (embaixadora_id, pagamento_id)
);
grant select on public.embaixadora_indicacoes to authenticated;
grant all on public.embaixadora_indicacoes to service_role;
alter table public.embaixadora_indicacoes enable row level security;
drop policy if exists indicacoes_visiveis on public.embaixadora_indicacoes;
create policy indicacoes_visiveis on public.embaixadora_indicacoes for select to authenticated
  using (public.e_admin() or exists (
    select 1 from public.embaixadoras a where a.id = embaixadora_id and a.pessoa_id = public.pessoa_atual()));
drop policy if exists indicacoes_admin on public.embaixadora_indicacoes;
create policy indicacoes_admin on public.embaixadora_indicacoes for all to authenticated
  using (public.e_admin()) with check (public.e_admin());

create table if not exists public.embaixadora_repasses (
  id uuid primary key default gen_random_uuid(),
  embaixadora_id uuid not null references public.embaixadoras(id) on delete cascade,
  competencia date not null,
  valor_centavos int not null default 0,
  situacao text not null default 'pendente' check (situacao in ('pendente','pago','cancelado')),
  pago_em timestamptz,
  observacao text,
  criado_em timestamptz not null default now()
);
grant select on public.embaixadora_repasses to authenticated;
grant all on public.embaixadora_repasses to service_role;
alter table public.embaixadora_repasses enable row level security;
drop policy if exists repasses_visiveis on public.embaixadora_repasses;
create policy repasses_visiveis on public.embaixadora_repasses for select to authenticated
  using (public.e_admin() or exists (
    select 1 from public.embaixadoras a where a.id = embaixadora_id and a.pessoa_id = public.pessoa_atual()));
drop policy if exists repasses_admin on public.embaixadora_repasses;
create policy repasses_admin on public.embaixadora_repasses for all to authenticated
  using (public.e_admin()) with check (public.e_admin());

create table if not exists public.embaixadora_materiais (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  url text not null,
  tipo text not null default 'arquivo',
  ordem int not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
grant select on public.embaixadora_materiais to authenticated;
grant all on public.embaixadora_materiais to service_role;
alter table public.embaixadora_materiais enable row level security;
drop policy if exists materiais_embaixadoras on public.embaixadora_materiais;
create policy materiais_embaixadoras on public.embaixadora_materiais for select to authenticated
  using (ativo and (public.tenho_acesso('area_embaixadora') or public.e_admin()));
drop policy if exists materiais_admin on public.embaixadora_materiais;
create policy materiais_admin on public.embaixadora_materiais for all to authenticated
  using (public.e_admin()) with check (public.e_admin());

-- Painel da embaixadora: totais são consulta.
create or replace view public.v_embaixadora_resumo as
  select a.id as embaixadora_id,
         a.pessoa_id,
         a.codigo,
         count(i.id) as indicacoes,
         count(i.id) filter (where pg.situacao = 'confirmado') as indicacoes_pagas,
         coalesce(sum(pg.valor_centavos) filter (where pg.situacao = 'confirmado'), 0) as receita_centavos,
         coalesce(round(sum(pg.valor_centavos) filter (where pg.situacao = 'confirmado')
                  * coalesce(n.comissao_percentual, 0) / 100), 0) as comissao_centavos
    from public.embaixadoras a
    left join public.embaixadora_niveis n on n.id = a.nivel_id
    left join public.embaixadora_indicacoes i on i.embaixadora_id = a.id
    left join public.pagamentos pg on pg.id = i.pagamento_id
   group by a.id, a.pessoa_id, a.codigo, n.comissao_percentual;
grant select on public.v_embaixadora_resumo to authenticated;

/* ============================================ Sementes idempotentes ======= */

insert into public.funis (slug, nome, ordem)
values ('relacionamento', 'Relacionamento', 0)
on conflict (slug) do nothing;

insert into public.funil_estagios (funil_id, nome, ordem, ganho, perdido)
select f.id, v.nome, v.ordem, v.ganho, v.perdido
  from public.funis f
  cross join (values
    ('Novo contato', 0, false, false),
    ('Em conversa', 1, false, false),
    ('Proposta enviada', 2, false, false),
    ('Fechado', 3, true, false),
    ('Perdido', 4, false, true)
  ) as v(nome, ordem, ganho, perdido)
 where f.slug = 'relacionamento'
   and not exists (select 1 from public.funil_estagios e where e.funil_id = f.id and e.nome = v.nome);

insert into public.embaixadora_niveis (slug, nome, comissao_percentual, minimo_indicacoes, ordem)
values ('bronze','Bronze',10,0,0), ('prata','Prata',15,5,1), ('ouro','Ouro',20,15,2)
on conflict (slug) do nothing;

commit;
