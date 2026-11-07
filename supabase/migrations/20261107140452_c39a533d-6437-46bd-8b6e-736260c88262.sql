
-- ======================================================= tipos e utilitários
create type public.crm_etapa as enum ('nova','em_conversa','plano_apresentado','aguardando_decisao','associada','sem_interesse','perdida');

create or replace function public.crm_normalizar(_t text) returns text
language sql immutable set search_path = public as $$
  select lower(translate(coalesce(_t,''),
    'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
    'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'))
$$;

create or replace function public.crm_telefone_chave(_t text) returns text
language sql immutable set search_path = public as $$
  select case when d is null then null
              when length(d) >= 12 and left(d,2) = '55' then substr(d,3)
              else d end
  from (select public.so_digitos(_t) as d) x
$$;

create or replace function public.crm_rotulo_etapa(_e public.crm_etapa) returns text
language sql immutable set search_path = public as $$
  select case _e
    when 'nova' then 'Nova interessada'
    when 'em_conversa' then 'Em conversa'
    when 'plano_apresentado' then 'Plano apresentado'
    when 'aguardando_decisao' then 'Aguardando decisão'
    when 'associada' then 'Associada'
    when 'sem_interesse' then 'Sem interesse'
    when 'perdida' then 'Perdida / encerrada' end
$$;

-- ======================================================= crm_fichas
create table public.crm_fichas (
  pessoa_id uuid primary key references public.pessoas(id) on delete cascade,
  origem text,
  origem_detalhe text,
  primeiro_contato_em timestamptz,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
grant select, insert, update, delete on public.crm_fichas to authenticated;
grant all on public.crm_fichas to service_role;
alter table public.crm_fichas enable row level security;
create policy crm_fichas_admin on public.crm_fichas for all to authenticated
  using (private.e_admin()) with check (private.e_admin());
create trigger tg_crm_fichas_atualizado before update on public.crm_fichas
  for each row execute function public.tg_set_atualizado_em();

-- ======================================================= crm_apelidos
create table public.crm_apelidos (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  apelido text not null,
  origem text,
  criado_em timestamptz not null default now()
);
create unique index crm_apelidos_unico on public.crm_apelidos (pessoa_id, lower(apelido));
grant select, insert, update, delete on public.crm_apelidos to authenticated;
grant all on public.crm_apelidos to service_role;
alter table public.crm_apelidos enable row level security;
create policy crm_apelidos_admin on public.crm_apelidos for all to authenticated
  using (private.e_admin()) with check (private.e_admin());

-- ======================================================= crm_consentimentos
create table public.crm_consentimentos (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  canal text not null check (canal in ('whatsapp','email_comercial','telefone')),
  situacao text not null check (situacao in ('autorizado','recusado')),
  origem text,
  registrado_em timestamptz not null default now(),
  registrado_por uuid default private.pessoa_atual() references public.pessoas(id) on delete set null
);
create index crm_consentimentos_pessoa on public.crm_consentimentos (pessoa_id, canal, registrado_em desc);
grant select, insert, update, delete on public.crm_consentimentos to authenticated;
grant all on public.crm_consentimentos to service_role;
alter table public.crm_consentimentos enable row level security;
create policy crm_consentimentos_admin on public.crm_consentimentos for all to authenticated
  using (private.e_admin()) with check (private.e_admin());

-- ======================================================= crm_oportunidades
create table public.crm_oportunidades (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  titulo text,
  etapa public.crm_etapa not null default 'nova',
  plano_id uuid references public.planos(id) on delete set null,
  valor_centavos integer not null default 0,
  canal text,
  interesse_em timestamptz not null default now(),
  plano_apresentado_em timestamptz,
  fechada_em timestamptz,
  motivo text,
  proxima_acao text,
  responsavel_id uuid default private.pessoa_atual() references public.pessoas(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create unique index crm_oportunidade_aberta_unica on public.crm_oportunidades (pessoa_id) where fechada_em is null;
create index crm_oportunidades_etapa on public.crm_oportunidades (etapa);
grant select, insert, update, delete on public.crm_oportunidades to authenticated;
grant all on public.crm_oportunidades to service_role;
alter table public.crm_oportunidades enable row level security;
create policy crm_oportunidades_admin on public.crm_oportunidades for all to authenticated
  using (private.e_admin()) with check (private.e_admin());
create trigger tg_crm_oportunidades_atualizado before update on public.crm_oportunidades
  for each row execute function public.tg_set_atualizado_em();

-- ======================================================= crm_interacoes
create table public.crm_interacoes (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  oportunidade_id uuid references public.crm_oportunidades(id) on delete set null,
  ocorrido_em timestamptz not null default now(),
  canal text not null default 'outro'
    check (canal in ('whatsapp','instagram','facebook','email','telefone','presencial','site','indicacao','sistema','outro')),
  tipo text not null default 'conversa'
    check (tipo in ('conversa','nota','apresentacao','objecao','follow_up','mensagem','etapa','tarefa')),
  resumo text not null,
  objecao text,
  registrado_por uuid default private.pessoa_atual() references public.pessoas(id) on delete set null,
  criado_em timestamptz not null default now()
);
create index crm_interacoes_pessoa on public.crm_interacoes (pessoa_id, ocorrido_em desc);
grant select, insert, update, delete on public.crm_interacoes to authenticated;
grant all on public.crm_interacoes to service_role;
alter table public.crm_interacoes enable row level security;
create policy crm_interacoes_admin on public.crm_interacoes for all to authenticated
  using (private.e_admin()) with check (private.e_admin());

-- ======================================================= crm_atividades
create table public.crm_atividades (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid references public.pessoas(id) on delete cascade,
  oportunidade_id uuid references public.crm_oportunidades(id) on delete set null,
  evento_id uuid references public.eventos(id) on delete set null,
  tipo text not null default 'conversao' check (tipo in ('conversao','relacionamento','ativacao')),
  titulo text not null,
  notas text,
  vence_em timestamptz not null default now(),
  prioridade text not null default 'normal' check (prioridade in ('baixa','normal','alta')),
  concluida_em timestamptz,
  cancelada_em timestamptz,
  resultado text,
  responsavel_id uuid default private.pessoa_atual() references public.pessoas(id) on delete set null,
  criado_por uuid default private.pessoa_atual() references public.pessoas(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index crm_atividades_abertas on public.crm_atividades (vence_em) where concluida_em is null and cancelada_em is null;
create index crm_atividades_pessoa on public.crm_atividades (pessoa_id);
grant select, insert, update, delete on public.crm_atividades to authenticated;
grant all on public.crm_atividades to service_role;
alter table public.crm_atividades enable row level security;
create policy crm_atividades_admin on public.crm_atividades for all to authenticated
  using (private.e_admin()) with check (private.e_admin());
create trigger tg_crm_atividades_atualizado before update on public.crm_atividades
  for each row execute function public.tg_set_atualizado_em();

-- ======================================================= crm_modelos_mensagem
create table public.crm_modelos_mensagem (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text not null default 'outro'
    check (categoria in ('reconexao','diagnostico','apresentacao','objecao','follow_up','aniversario','boas_vindas','convite_evento','outro')),
  texto text not null,
  ordem integer not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
grant select, insert, update, delete on public.crm_modelos_mensagem to authenticated;
grant all on public.crm_modelos_mensagem to service_role;
alter table public.crm_modelos_mensagem enable row level security;
create policy crm_modelos_admin on public.crm_modelos_mensagem for all to authenticated
  using (private.e_admin()) with check (private.e_admin());
create trigger tg_crm_modelos_atualizado before update on public.crm_modelos_mensagem
  for each row execute function public.tg_set_atualizado_em();

-- ======================================================= crm_negocio_vinculos
create table public.crm_negocio_vinculos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  papel text not null default 'socia' check (papel in ('proprietaria','socia','representante')),
  criado_em timestamptz not null default now(),
  unique (negocio_id, pessoa_id)
);
grant select, insert, update, delete on public.crm_negocio_vinculos to authenticated;
grant all on public.crm_negocio_vinculos to service_role;
alter table public.crm_negocio_vinculos enable row level security;
create policy crm_vinculos_admin on public.crm_negocio_vinculos for all to authenticated
  using (private.e_admin()) with check (private.e_admin());

-- ======================================================= gatilhos do funil
create or replace function public.tg_crm_oportunidade_datas() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.etapa = 'plano_apresentado' and new.plano_apresentado_em is null then
    new.plano_apresentado_em := now();
  end if;
  if new.etapa in ('associada','sem_interesse','perdida') then
    if new.fechada_em is null then new.fechada_em := now(); end if;
  else
    new.fechada_em := null;
  end if;
  return new;
end $$;
create trigger aa_crm_oportunidade_datas before insert or update on public.crm_oportunidades
  for each row execute function public.tg_crm_oportunidade_datas();

create or replace function public.tg_crm_oportunidade_historico() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.crm_interacoes (pessoa_id, oportunidade_id, canal, tipo, resumo)
    values (new.pessoa_id, new.id, 'sistema', 'etapa',
            'Oportunidade aberta em "' || public.crm_rotulo_etapa(new.etapa) || '"');
  elsif new.etapa is distinct from old.etapa then
    insert into public.crm_interacoes (pessoa_id, oportunidade_id, canal, tipo, resumo)
    values (new.pessoa_id, new.id, 'sistema', 'etapa',
            'Etapa: ' || public.crm_rotulo_etapa(old.etapa) || ' → ' || public.crm_rotulo_etapa(new.etapa)
            || coalesce(' · ' || nullif(btrim(new.motivo),''), ''));
  end if;
  return null;
end $$;
create trigger crm_oportunidade_historico after insert or update on public.crm_oportunidades
  for each row execute function public.tg_crm_oportunidade_historico();

create or replace function public.tg_crm_atividade_concluida() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.pessoa_id is not null and new.concluida_em is not null and old.concluida_em is null then
    insert into public.crm_interacoes (pessoa_id, oportunidade_id, canal, tipo, resumo, ocorrido_em)
    values (new.pessoa_id, new.oportunidade_id, 'sistema', 'tarefa',
            'Tarefa concluída: ' || new.titulo || coalesce(' — ' || nullif(btrim(new.resultado),''), ''),
            new.concluida_em);
  end if;
  return null;
end $$;
create trigger crm_atividade_concluida after update on public.crm_atividades
  for each row execute function public.tg_crm_atividade_concluida();

-- ======================================================= lista de pessoas do CRM
create or replace function private.crm_pessoas(_termo text default null, _limite integer default 300)
returns table(
  pessoa_id uuid, nome text, nome_social text, cpf_mascarado text, email text, telefone text,
  apelidos text[], papeis public.papel_tipo[], assinante boolean, conta_site boolean,
  origem text, primeiro_contato_em timestamptz, oportunidade_id uuid, etapa public.crm_etapa,
  proxima_tarefa_em timestamptz, ultima_interacao_em timestamptz, criado_em timestamptz
)
language sql stable security definer set search_path = public as $$
  with t as (
    select public.crm_normalizar(btrim(coalesce(_termo,''))) as n, coalesce(public.so_digitos(_termo),'') as d
  )
  select
    p.id, p.nome, p.nome_social,
    case when p.cpf is null then null else '***.' || substr(p.cpf,4,3) || '.' || substr(p.cpf,7,3) || '-**' end,
    (select c.valor::text from public.pessoa_contatos c where c.pessoa_id = p.id and c.tipo = 'email'
       order by c.principal desc, c.criado_em limit 1),
    (select c.valor::text from public.pessoa_contatos c where c.pessoa_id = p.id and c.tipo in ('telefone','whatsapp')
       order by (c.tipo = 'whatsapp') desc, c.principal desc, c.criado_em limit 1),
    coalesce((select array_agg(a.apelido order by a.apelido) from public.crm_apelidos a where a.pessoa_id = p.id), '{}'::text[]),
    coalesce((select array_agg(r.papel order by r.papel) from public.papeis r where r.pessoa_id = p.id), '{}'::public.papel_tipo[]),
    (private.acesso_vigente(p.id, 'diretorio') or private.acesso_vigente(p.id, 'conecta') or private.acesso_vigente(p.id, 'academy')),
    p.auth_user_id is not null,
    f.origem, f.primeiro_contato_em,
    o.id, o.etapa,
    (select min(at.vence_em) from public.crm_atividades at
       where at.pessoa_id = p.id and at.concluida_em is null and at.cancelada_em is null),
    (select max(i.ocorrido_em) from public.crm_interacoes i where i.pessoa_id = p.id and i.canal <> 'sistema'),
    p.criado_em
  from public.pessoas p
  cross join t
  left join public.crm_fichas f on f.pessoa_id = p.id
  left join lateral (
    select o2.id, o2.etapa from public.crm_oportunidades o2
    where o2.pessoa_id = p.id
    order by (o2.fechada_em is null) desc, o2.atualizado_em desc limit 1
  ) o on true
  where private.e_admin()
    and (
      t.n = ''
      or public.crm_normalizar(p.nome) like '%' || t.n || '%'
      or public.crm_normalizar(p.nome_social) like '%' || t.n || '%'
      or exists (select 1 from public.crm_apelidos a where a.pessoa_id = p.id and public.crm_normalizar(a.apelido) like '%' || t.n || '%')
      or exists (select 1 from public.pessoa_contatos c where c.pessoa_id = p.id and c.tipo = 'email' and lower(c.valor::text) like '%' || t.n || '%')
      or (length(t.d) >= 4 and exists (select 1 from public.pessoa_contatos c where c.pessoa_id = p.id
            and c.tipo in ('telefone','whatsapp') and c.valor::text like '%' || t.d || '%'))
      or (length(t.d) = 11 and p.cpf = t.d)
      or exists (select 1 from public.negocios n
            where (n.pessoa_id = p.id or exists (select 1 from public.crm_negocio_vinculos v where v.negocio_id = n.id and v.pessoa_id = p.id))
              and public.crm_normalizar(n.nome) like '%' || t.n || '%')
    )
  order by p.nome
  limit greatest(1, least(coalesce(_limite, 300), 2000))
$$;
revoke all on function private.crm_pessoas(text, integer) from public, anon;
grant execute on function private.crm_pessoas(text, integer) to authenticated, service_role;

create or replace function public.crm_pessoas(_termo text default null, _limite integer default 300)
returns table(
  pessoa_id uuid, nome text, nome_social text, cpf_mascarado text, email text, telefone text,
  apelidos text[], papeis public.papel_tipo[], assinante boolean, conta_site boolean,
  origem text, primeiro_contato_em timestamptz, oportunidade_id uuid, etapa public.crm_etapa,
  proxima_tarefa_em timestamptz, ultima_interacao_em timestamptz, criado_em timestamptz
)
language sql stable set search_path = public as $$ select * from private.crm_pessoas($1, $2) $$;
revoke all on function public.crm_pessoas(text, integer) from public, anon;
grant execute on function public.crm_pessoas(text, integer) to authenticated, service_role;

-- ======================================================= possíveis duplicadas
create or replace function private.crm_semelhantes(_nome text default null, _email text default null, _telefone text default null, _cpf text default null)
returns table(pessoa_id uuid, nome text, motivo text)
language sql stable security definer set search_path = public as $$
  with x as (
    select p.id, p.nome, 'Mesmo CPF' as motivo, 1 as peso from public.pessoas p
      where length(coalesce(public.so_digitos(_cpf),'')) = 11 and p.cpf = public.so_digitos(_cpf)
    union all
    select p.id, p.nome, 'Mesmo e-mail', 2 from public.pessoas p
      join public.pessoa_contatos c on c.pessoa_id = p.id and c.tipo = 'email'
      where nullif(btrim(coalesce(_email,'')),'') is not null and c.valor = btrim(_email)::citext
    union all
    select p.id, p.nome, 'Mesmo telefone', 3 from public.pessoas p
      join public.pessoa_contatos c on c.pessoa_id = p.id and c.tipo in ('telefone','whatsapp')
      where length(coalesce(public.so_digitos(_telefone),'')) >= 8
        and public.crm_telefone_chave(c.valor::text) = public.crm_telefone_chave(_telefone)
    union all
    select p.id, p.nome, 'Nome igual (confira antes)', 4 from public.pessoas p
      where length(btrim(coalesce(_nome,''))) >= 3
        and public.crm_normalizar(btrim(p.nome)) = public.crm_normalizar(btrim(_nome))
  )
  select distinct on (x.id) x.id, x.nome, x.motivo from x
  where private.e_admin()
  order by x.id, x.peso
$$;
revoke all on function private.crm_semelhantes(text, text, text, text) from public, anon;
grant execute on function private.crm_semelhantes(text, text, text, text) to authenticated, service_role;
create or replace function public.crm_semelhantes(_nome text default null, _email text default null, _telefone text default null, _cpf text default null)
returns table(pessoa_id uuid, nome text, motivo text)
language sql stable set search_path = public as $$ select * from private.crm_semelhantes($1, $2, $3, $4) $$;
revoke all on function public.crm_semelhantes(text, text, text, text) from public, anon;
grant execute on function public.crm_semelhantes(text, text, text, text) to authenticated, service_role;

-- ======================================================= cadastro de contato provisório
create or replace function private.crm_criar_pessoa(
  _nome text, _email text default null, _telefone text default null, _cpf text default null,
  _apelido text default null, _origem text default null, _primeiro_contato_em timestamptz default null,
  _observacao text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_email citext := nullif(lower(btrim(coalesce(_email,''))),'')::citext;
  v_tel text := public.so_digitos(_telefone);
  v_cpf text := public.so_digitos(_cpf);
begin
  if not private.e_admin() then raise exception 'Apenas a administração pode cadastrar contatos no CRM'; end if;
  if length(btrim(coalesce(_nome,''))) < 2 then raise exception 'Informe o nome da pessoa'; end if;
  if v_cpf is not null and length(v_cpf) <> 11 then raise exception 'O CPF precisa ter 11 números'; end if;
  if v_tel is not null and length(v_tel) < 10 then raise exception 'Informe o telefone com DDD'; end if;
  if v_cpf is not null and exists (select 1 from public.pessoas where cpf = v_cpf) then
    raise exception 'Já existe uma pessoa com este CPF. Use a busca para abrir a ficha dela.';
  end if;
  if v_email is not null and exists (select 1 from public.pessoa_contatos where tipo = 'email' and valor = v_email) then
    raise exception 'Já existe uma pessoa com este e-mail. Use a busca para abrir a ficha dela.';
  end if;
  if v_tel is not null and exists (select 1 from public.pessoa_contatos where tipo in ('telefone','whatsapp')
       and public.crm_telefone_chave(valor::text) = public.crm_telefone_chave(v_tel)) then
    raise exception 'Já existe uma pessoa com este telefone. Use a busca para abrir a ficha dela.';
  end if;

  insert into public.pessoas (nome, cpf) values (btrim(_nome), v_cpf) returning id into v_id;
  if v_email is not null then
    insert into public.pessoa_contatos (pessoa_id, tipo, valor, principal) values (v_id, 'email', v_email, true);
  end if;
  if v_tel is not null then
    insert into public.pessoa_contatos (pessoa_id, tipo, valor, principal) values (v_id, 'whatsapp', v_tel::citext, true);
  end if;
  if nullif(btrim(coalesce(_apelido,'')),'') is not null then
    insert into public.crm_apelidos (pessoa_id, apelido, origem) values (v_id, btrim(_apelido), 'crm');
  end if;
  insert into public.crm_fichas (pessoa_id, origem, primeiro_contato_em)
  values (v_id, nullif(btrim(coalesce(_origem,'')),''), _primeiro_contato_em);
  if nullif(btrim(coalesce(_observacao,'')),'') is not null then
    insert into public.crm_interacoes (pessoa_id, canal, tipo, resumo, ocorrido_em)
    values (v_id, 'outro', 'nota', btrim(_observacao), coalesce(_primeiro_contato_em, now()));
  end if;
  return v_id;
end $$;
revoke all on function private.crm_criar_pessoa(text, text, text, text, text, text, timestamptz, text) from public, anon;
grant execute on function private.crm_criar_pessoa(text, text, text, text, text, text, timestamptz, text) to authenticated, service_role;
create or replace function public.crm_criar_pessoa(
  _nome text, _email text default null, _telefone text default null, _cpf text default null,
  _apelido text default null, _origem text default null, _primeiro_contato_em timestamptz default null,
  _observacao text default null
) returns uuid
language sql set search_path = public as $$ select private.crm_criar_pessoa($1, $2, $3, $4, $5, $6, $7, $8) $$;
revoke all on function public.crm_criar_pessoa(text, text, text, text, text, text, timestamptz, text) from public, anon;
grant execute on function public.crm_criar_pessoa(text, text, text, text, text, text, timestamptz, text) to authenticated, service_role;

-- ======================================================= contato extra
create or replace function private.crm_adicionar_contato(_pessoa_id uuid, _tipo public.contato_tipo, _valor text, _principal boolean default false)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_valor citext; v_dona uuid; v_id uuid;
begin
  if not private.e_admin() then raise exception 'Apenas a administração pode alterar contatos pelo CRM'; end if;
  v_valor := case when _tipo = 'email' then nullif(lower(btrim(coalesce(_valor,''))),'')::citext
                  else public.so_digitos(_valor)::citext end;
  if v_valor is null then raise exception 'Contato vazio'; end if;
  if _tipo <> 'email' and length(v_valor::text) < 10 then raise exception 'Informe o telefone com DDD'; end if;
  if _tipo = 'email' then
    select pessoa_id into v_dona from public.pessoa_contatos where tipo = 'email' and valor = v_valor and pessoa_id <> _pessoa_id limit 1;
  else
    select pessoa_id into v_dona from public.pessoa_contatos where tipo in ('telefone','whatsapp')
      and public.crm_telefone_chave(valor::text) = public.crm_telefone_chave(v_valor::text) and pessoa_id <> _pessoa_id limit 1;
  end if;
  if v_dona is not null then
    raise exception 'Este contato já está na ficha de outra pessoa. Confira se não é a mesma pessoa antes de continuar.';
  end if;
  insert into public.pessoa_contatos (pessoa_id, tipo, valor, principal)
  values (_pessoa_id, _tipo, v_valor, coalesce(_principal,false))
  on conflict (pessoa_id, tipo, valor) do update set principal = excluded.principal or public.pessoa_contatos.principal
  returning id into v_id;
  return v_id;
end $$;
revoke all on function private.crm_adicionar_contato(uuid, public.contato_tipo, text, boolean) from public, anon;
grant execute on function private.crm_adicionar_contato(uuid, public.contato_tipo, text, boolean) to authenticated, service_role;
create or replace function public.crm_adicionar_contato(_pessoa_id uuid, _tipo public.contato_tipo, _valor text, _principal boolean default false)
returns uuid
language sql set search_path = public as $$ select private.crm_adicionar_contato($1, $2, $3, $4) $$;
revoke all on function public.crm_adicionar_contato(uuid, public.contato_tipo, text, boolean) from public, anon;
grant execute on function public.crm_adicionar_contato(uuid, public.contato_tipo, text, boolean) to authenticated, service_role;

-- ======================================================= busca existente: acentos, nome preferido e apelidos
create or replace function private.buscar_pessoas(_termo text, _limite integer default 30)
returns table(pessoa_id uuid, nome text, cpf text, email text, papeis public.papel_tipo[])
language sql stable security definer set search_path = public as $$
  select v.pessoa_id, v.nome, v.cpf, v.email_principal::text, v.papeis
  from public.v_meu_perfil v
  where public.e_admin()
    and (
      coalesce(_termo,'') = ''
      or public.crm_normalizar(v.nome) like '%' || public.crm_normalizar(_termo) || '%'
      or public.crm_normalizar(v.nome_social) like '%' || public.crm_normalizar(_termo) || '%'
      or v.cpf = public.so_digitos(_termo)
      or lower(v.email_principal::text) like '%' || lower(_termo) || '%'
      or exists (select 1 from public.crm_apelidos a where a.pessoa_id = v.pessoa_id
                   and public.crm_normalizar(a.apelido) like '%' || public.crm_normalizar(_termo) || '%')
    )
  order by v.nome
  limit greatest(1, least(coalesce(_limite, 30), 200))
$$;

-- ======================================================= mensagens prontas iniciais
insert into public.crm_modelos_mensagem (titulo, categoria, texto, ordem) values
('Reconexão carinhosa', 'reconexao', 'Oi, {primeiro_nome}! Tudo bem por aí? Lembrei de você e quis saber como anda o seu negócio. Quando puder, me conta as novidades? 💜', 1),
('Diagnóstico rápido', 'diagnostico', 'Oi, {primeiro_nome}! Para eu te indicar o melhor caminho na Mulheres em Convergência, posso te fazer 3 perguntinhas rápidas sobre o seu momento de negócio?', 2),
('Apresentação dos planos', 'apresentacao', 'Oi, {primeiro_nome}! Como combinamos, aqui estão os planos de associação da Mulheres em Convergência: https://mulheresemconvergencia.com.br/planos. Qualquer dúvida, estou aqui para te ajudar a escolher.', 3),
('Resposta a "está caro"', 'objecao', 'Entendo, {primeiro_nome}. Muitas associadas pensaram o mesmo no começo. Que tal eu te mostrar o que você já recebe no primeiro mês (encontros, diretório e rede)? Assim você decide com calma.', 4),
('Retorno combinado', 'follow_up', 'Oi, {primeiro_nome}! Passando para retomar a nossa conversa. Conseguiu pensar sobre a associação? Se quiser, marcamos 10 minutinhos para eu tirar suas dúvidas.', 5),
('Feliz aniversário', 'aniversario', 'Feliz aniversário, {primeiro_nome}! 🎉 Que este novo ciclo traga muita prosperidade para você e para o seu negócio. Com carinho, equipe Mulheres em Convergência.', 6),
('Boas-vindas de associada', 'boas_vindas', 'Seja muito bem-vinda, {primeiro_nome}! 💜 Agora você faz parte da Mulheres em Convergência. Entre na sua área em https://mulheresemconvergencia.com.br/minha-area e complete o seu perfil para aparecer no diretório.', 7),
('Convite para encontro', 'convite_evento', 'Oi, {primeiro_nome}! Vai ter encontro novo da Mulheres em Convergência e lembrei de você. Veja os detalhes e garanta sua vaga: https://mulheresemconvergencia.com.br/eventos', 8);
