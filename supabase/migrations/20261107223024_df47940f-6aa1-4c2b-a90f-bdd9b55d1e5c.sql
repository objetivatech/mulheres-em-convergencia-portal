-- =============================================================== limpeza do funil antigo
drop table if exists public.negociacoes;
drop table if exists public.funil_estagios;
drop table if exists public.funis;

-- =============================================================== tabelas novas
create table public.crm_fusoes (
  id uuid primary key default gen_random_uuid(),
  pessoa_mantida_id uuid references public.pessoas(id) on delete set null,
  pessoa_removida_id uuid not null,
  nome_mantido text not null,
  nome_removido text not null,
  motivo text,
  dados_removidos jsonb not null default '{}'::jsonb,
  movimentos jsonb not null default '{}'::jsonb,
  realizado_por uuid default private.pessoa_atual() references public.pessoas(id) on delete set null,
  realizado_em timestamptz not null default now()
);
create index crm_fusoes_mantida on public.crm_fusoes (pessoa_mantida_id);
grant select on public.crm_fusoes to authenticated;
grant all on public.crm_fusoes to service_role;
alter table public.crm_fusoes enable row level security;
create policy crm_fusoes_admin_le on public.crm_fusoes for select to authenticated using (private.e_admin());

create table public.crm_duplicadas_ignoradas (
  id uuid primary key default gen_random_uuid(),
  pessoa_a uuid not null references public.pessoas(id) on delete cascade,
  pessoa_b uuid not null references public.pessoas(id) on delete cascade,
  motivo text,
  registrado_por uuid default private.pessoa_atual() references public.pessoas(id) on delete set null,
  registrado_em timestamptz not null default now(),
  constraint crm_duplicadas_ignoradas_ordem check (pessoa_a < pessoa_b),
  unique (pessoa_a, pessoa_b)
);
grant select, delete on public.crm_duplicadas_ignoradas to authenticated;
grant all on public.crm_duplicadas_ignoradas to service_role;
alter table public.crm_duplicadas_ignoradas enable row level security;
create policy crm_dup_ign_admin_le on public.crm_duplicadas_ignoradas for select to authenticated using (private.e_admin());
create policy crm_dup_ign_admin_apaga on public.crm_duplicadas_ignoradas for delete to authenticated using (private.e_admin());

create table public.crm_importacoes (
  id uuid primary key default gen_random_uuid(),
  nome_arquivo text not null,
  origem text,
  total integer not null default 0,
  resultado jsonb not null default '[]'::jsonb,
  realizado_por uuid default private.pessoa_atual() references public.pessoas(id) on delete set null,
  criado_em timestamptz not null default now()
);
grant select on public.crm_importacoes to authenticated;
grant all on public.crm_importacoes to service_role;
alter table public.crm_importacoes enable row level security;
create policy crm_importacoes_admin_le on public.crm_importacoes for select to authenticated using (private.e_admin());

-- =============================================================== radar pós-encontro
create or replace function private.crm_radar(_dias integer default 120)
returns table(
  evento_id uuid, evento_titulo text, evento_inicio timestamptz, evento_online boolean, evento_tem_portaria boolean,
  inscricao_id uuid, pessoa_id uuid, nome text, email text, telefone text, compareceu boolean, assinante boolean,
  oportunidade_id uuid, etapa public.crm_etapa, contato_depois timestamptz, tarefa_aberta boolean, tarefa_feita boolean,
  whatsapp_recusado boolean
)
language sql stable security definer set search_path = public as $$
  select
    e.id, e.titulo, e.inicio_em, e.online,
    exists (select 1 from public.evento_presencas pr join public.evento_inscricoes i2 on i2.id = pr.inscricao_id where i2.evento_id = e.id),
    i.id, i.pessoa_id,
    coalesce(nullif(btrim(p.nome_social),''), p.nome, i.nome),
    coalesce((select c.valor::text from public.pessoa_contatos c where c.pessoa_id = i.pessoa_id and c.tipo = 'email'
               order by c.principal desc, c.criado_em limit 1), i.email::text),
    coalesce((select c.valor::text from public.pessoa_contatos c where c.pessoa_id = i.pessoa_id and c.tipo in ('whatsapp','telefone')
               order by (c.tipo = 'whatsapp') desc, c.principal desc, c.criado_em limit 1), i.telefone),
    exists (select 1 from public.evento_presencas pr where pr.inscricao_id = i.id),
    case when i.pessoa_id is null then false else
      (private.acesso_vigente(i.pessoa_id, 'diretorio') or private.acesso_vigente(i.pessoa_id, 'conecta') or private.acesso_vigente(i.pessoa_id, 'academy')) end,
    o.id, o.etapa,
    (select max(x.ocorrido_em) from public.crm_interacoes x where x.pessoa_id = i.pessoa_id and x.canal <> 'sistema' and x.ocorrido_em >= e.inicio_em),
    exists (select 1 from public.crm_atividades a where a.pessoa_id = i.pessoa_id and a.evento_id = e.id and a.concluida_em is null and a.cancelada_em is null),
    exists (select 1 from public.crm_atividades a where a.pessoa_id = i.pessoa_id and a.evento_id = e.id and a.concluida_em is not null),
    coalesce((select s.situacao = 'recusado' from public.crm_consentimentos s where s.pessoa_id = i.pessoa_id and s.canal = 'whatsapp'
               order by s.registrado_em desc limit 1), false)
  from public.eventos e
  join public.evento_inscricoes i on i.evento_id = e.id and i.situacao = 'confirmada'
  left join public.pessoas p on p.id = i.pessoa_id
  left join lateral (
    select o2.id, o2.etapa from public.crm_oportunidades o2 where o2.pessoa_id = i.pessoa_id and o2.fechada_em is null limit 1
  ) o on true
  where private.e_admin()
    and e.inicio_em <= now()
    and e.inicio_em >= now() - make_interval(days => greatest(1, least(coalesce(_dias, 120), 730)))
  order by e.inicio_em desc, 8
$$;

create or replace function private.crm_radar_acionar(_evento_id uuid, _pessoas uuid[], _acao text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  ev public.eventos; v_p uuid; v_op uuid; v_titulo text; v_tipo text;
  v_criadas int := 0; v_existentes int := 0; v_ignoradas int := 0;
begin
  if not private.e_admin() then raise exception 'Apenas a administração pode usar o radar'; end if;
  if _acao not in ('oportunidade','agradecer','sentimos_falta') then raise exception 'Ação desconhecida'; end if;
  select * into ev from public.eventos where id = _evento_id;
  if ev.id is null then raise exception 'Encontro não encontrado'; end if;
  if coalesce(array_length(_pessoas, 1), 0) > 500 then raise exception 'Selecione no máximo 500 pessoas por vez'; end if;

  foreach v_p in array coalesce(_pessoas, '{}'::uuid[]) loop
    if not exists (select 1 from public.evento_inscricoes where evento_id = _evento_id and pessoa_id = v_p and situacao = 'confirmada') then
      v_ignoradas := v_ignoradas + 1; continue;
    end if;
    v_op := null;
    if _acao = 'oportunidade' then
      select id into v_op from public.crm_oportunidades where pessoa_id = v_p and fechada_em is null limit 1;
      if v_op is null then
        insert into public.crm_oportunidades (pessoa_id, titulo, etapa, canal, proxima_acao)
        values (v_p, 'Pós-encontro: ' || ev.titulo, 'nova', case when ev.online then 'site' else 'presencial' end,
                'Conversar sobre a experiência no encontro')
        returning id into v_op;
        v_criadas := v_criadas + 1;
      else
        v_existentes := v_existentes + 1;
      end if;
      v_titulo := 'Conversar sobre associação após "' || ev.titulo || '"'; v_tipo := 'conversao';
    elsif _acao = 'agradecer' then
      v_titulo := 'Agradecer a presença em "' || ev.titulo || '"'; v_tipo := 'relacionamento';
    else
      v_titulo := 'Sentimos sua falta em "' || ev.titulo || '"'; v_tipo := 'relacionamento';
    end if;

    if not exists (select 1 from public.crm_atividades where pessoa_id = v_p and evento_id = _evento_id and titulo = v_titulo) then
      insert into public.crm_atividades (pessoa_id, oportunidade_id, evento_id, tipo, titulo, vence_em)
      values (v_p, v_op, _evento_id, v_tipo, v_titulo, now() + interval '1 day');
      if _acao <> 'oportunidade' then v_criadas := v_criadas + 1; end if;
    elsif _acao <> 'oportunidade' then
      v_existentes := v_existentes + 1;
    end if;
  end loop;
  return jsonb_build_object('criadas', v_criadas, 'ja_existiam', v_existentes, 'ignoradas', v_ignoradas);
end $$;

-- =============================================================== possíveis repetidas
create or replace function private.crm_duplicadas()
returns table(pessoa_a uuid, nome_a text, pessoa_b uuid, nome_b text, motivos text[], forte boolean)
language sql stable security definer set search_path = public as $$
  with
  em as (select pessoa_id, valor from public.pessoa_contatos where tipo = 'email'),
  tel as (select pessoa_id, public.crm_telefone_chave(valor::text) as k from public.pessoa_contatos
          where tipo in ('telefone','whatsapp') and length(coalesce(public.so_digitos(valor::text),'')) >= 10),
  nom as (select id, public.crm_normalizar(btrim(nome)) as n from public.pessoas where length(btrim(coalesce(nome,''))) >= 5),
  pares as (
    select e1.pessoa_id as a, e2.pessoa_id as b, 'Mesmo e-mail'::text as m, true as f
      from em e1 join em e2 on e2.valor = e1.valor and e1.pessoa_id < e2.pessoa_id
    union all
    select t1.pessoa_id, t2.pessoa_id, 'Mesmo telefone', true
      from tel t1 join tel t2 on t2.k = t1.k and t1.pessoa_id < t2.pessoa_id
    union all
    select n1.id, n2.id, 'Nome igual (confira)', false
      from nom n1 join nom n2 on n2.n = n1.n and n1.id < n2.id
  )
  select x.a, pa.nome, x.b, pb.nome, array_agg(distinct x.m order by x.m), bool_or(x.f)
  from pares x
  join public.pessoas pa on pa.id = x.a
  join public.pessoas pb on pb.id = x.b
  where private.e_admin()
    and not exists (select 1 from public.crm_duplicadas_ignoradas g where g.pessoa_a = x.a and g.pessoa_b = x.b)
  group by x.a, pa.nome, x.b, pb.nome
  order by bool_or(x.f) desc, pa.nome
$$;

create or replace function private.crm_ignorar_duplicada(_a uuid, _b uuid, _motivo text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not private.e_admin() then raise exception 'Apenas a administração pode revisar fichas repetidas'; end if;
  if _a is null or _b is null or _a = _b then raise exception 'Escolha duas fichas diferentes'; end if;
  insert into public.crm_duplicadas_ignoradas (pessoa_a, pessoa_b, motivo)
  values (least(_a, _b), greatest(_a, _b), nullif(btrim(coalesce(_motivo,'')),''))
  on conflict (pessoa_a, pessoa_b) do nothing;
end $$;

-- =============================================================== união de fichas
create or replace function private.crm_resumo_pessoa(_id uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p.id, 'nome', p.nome, 'nome_social', p.nome_social,
    'cpf', case when p.cpf is null then null else '***.' || substr(p.cpf,4,3) || '.' || substr(p.cpf,7,3) || '-**' end,
    'conta_site', p.auth_user_id is not null, 'criado_em', p.criado_em,
    'contatos', coalesce((select jsonb_agg(c.valor::text order by c.principal desc, c.criado_em) from public.pessoa_contatos c where c.pessoa_id = p.id), '[]'::jsonb),
    'inscricoes', (select count(*) from public.evento_inscricoes where pessoa_id = p.id),
    'pagamentos', (select count(*) from public.pagamentos where pessoa_id = p.id),
    'conversas', (select count(*) from public.crm_interacoes where pessoa_id = p.id and canal <> 'sistema'),
    'tarefas', (select count(*) from public.crm_atividades where pessoa_id = p.id),
    'negocios', (select count(*) from public.negocios where pessoa_id = p.id),
    'oportunidade_aberta', exists (select 1 from public.crm_oportunidades where pessoa_id = p.id and fechada_em is null),
    'papeis', coalesce((select jsonb_agg(r.papel order by r.papel) from public.papeis r where r.pessoa_id = p.id), '[]'::jsonb),
    'associada', (private.acesso_vigente(p.id, 'diretorio') or private.acesso_vigente(p.id, 'conecta') or private.acesso_vigente(p.id, 'academy'))
  ) from public.pessoas p where p.id = _id
$$;

create or replace function private.crm_previa_fusao(_manter uuid, _remover uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare m public.pessoas; r public.pessoas; b text[] := '{}'; a text[] := '{}'; n int;
begin
  if not private.e_admin() then raise exception 'Apenas a administração pode unir fichas'; end if;
  if _manter is null or _remover is null or _manter = _remover then raise exception 'Escolha duas fichas diferentes'; end if;
  select * into m from public.pessoas where id = _manter;
  select * into r from public.pessoas where id = _remover;
  if m.id is null or r.id is null then raise exception 'Ficha não encontrada. Atualize a página.'; end if;

  if m.auth_user_id is not null and r.auth_user_id is not null then
    b := b || 'As duas fichas têm conta de acesso ao site. Duas contas de login não podem ser unidas.';
  end if;
  if m.cpf is not null and r.cpf is not null and m.cpf <> r.cpf then
    b := b || 'As fichas têm CPFs diferentes, então são pessoas diferentes.';
  end if;
  if exists (select 1 from public.crm_oportunidades where pessoa_id = _manter and fechada_em is null)
     and exists (select 1 from public.crm_oportunidades where pessoa_id = _remover and fechada_em is null) then
    b := b || 'As duas fichas têm conversa aberta no funil. Encerre uma delas antes de unir.';
  end if;
  if exists (select 1 from public.embaixadoras where pessoa_id = _manter)
     and exists (select 1 from public.embaixadoras where pessoa_id = _remover) then
    b := b || 'As duas fichas são embaixadoras. Fale com a coordenação antes de unir.';
  end if;

  select count(*) into n from public.evento_inscricoes ir
    join public.evento_inscricoes im on im.evento_id = ir.evento_id and im.pessoa_id = _manter
    where ir.pessoa_id = _remover;
  if n > 0 then
    a := a || (n || ' inscrição(ões) repetida(s) no mesmo encontro continuam valendo no encontro, mas ficam sem ligação com a ficha.');
  end if;
  select count(*) into n from public.negocio_avaliacoes ar
    join public.negocio_avaliacoes am on am.negocio_id = ar.negocio_id and am.pessoa_id = _manter
    where ar.pessoa_id = _remover;
  if n > 0 then
    a := a || (n || ' avaliação(ões) repetida(s) do mesmo negócio continuam publicadas, como avaliação de visitante.');
  end if;
  if r.auth_user_id is not null then a := a || 'O acesso ao site (login) da ficha removida passa para a ficha mantida.'; end if;
  if r.cpf is not null and m.cpf is null then a := a || 'O CPF da ficha removida passa para a ficha mantida.'; end if;

  return jsonb_build_object(
    'bloqueios', to_jsonb(b), 'avisos', to_jsonb(a),
    'manter', private.crm_resumo_pessoa(_manter), 'remover', private.crm_resumo_pessoa(_remover)
  );
end $$;

create or replace function private.crm_fundir_pessoas(_manter uuid, _remover uuid, _motivo text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  m public.pessoas; r public.pessoas; v_prev jsonb; v_mov jsonb := '{}'::jsonb; v_snap jsonb; n int;
  v_soltas uuid[]; rec record; v_tem boolean;
begin
  if not private.e_admin() then raise exception 'Apenas a administração pode unir fichas'; end if;
  if _manter is null or _remover is null or _manter = _remover then raise exception 'Escolha duas fichas diferentes'; end if;
  -- trava as duas fichas na mesma ordem para evitar uniões cruzadas simultâneas
  perform 1 from public.pessoas where id in (_manter, _remover) order by id for update;
  select * into m from public.pessoas where id = _manter;
  select * into r from public.pessoas where id = _remover;
  if m.id is null or r.id is null then raise exception 'Ficha não encontrada. Atualize a página.'; end if;

  v_prev := private.crm_previa_fusao(_manter, _remover);
  if jsonb_array_length(v_prev -> 'bloqueios') > 0 then raise exception '%', v_prev -> 'bloqueios' ->> 0; end if;

  v_snap := jsonb_build_object(
    'pessoa', to_jsonb(r),
    'contatos', coalesce((select jsonb_agg(to_jsonb(c)) from public.pessoa_contatos c where c.pessoa_id = _remover), '[]'::jsonb),
    'apelidos', coalesce((select jsonb_agg(x.apelido) from public.crm_apelidos x where x.pessoa_id = _remover), '[]'::jsonb),
    'ficha', (select to_jsonb(f) from public.crm_fichas f where f.pessoa_id = _remover),
    'avisos', v_prev -> 'avisos'
  );

  -- identidade: libera as chaves únicas e só completa o que está vazio na ficha mantida
  update public.pessoas set auth_user_id = null, cpf = null where id = _remover;
  update public.pessoas set
    auth_user_id     = coalesce(m.auth_user_id, r.auth_user_id),
    cpf              = coalesce(m.cpf, r.cpf),
    nome             = case when coalesce(btrim(m.nome),'') in ('','Sem nome') then r.nome else m.nome end,
    nome_social      = coalesce(nullif(btrim(m.nome_social),''), r.nome_social),
    data_nascimento  = coalesce(m.data_nascimento, r.data_nascimento),
    foto_url         = coalesce(m.foto_url, r.foto_url),
    bio              = coalesce(m.bio, r.bio),
    genero           = coalesce(m.genero, r.genero),
    instagram        = coalesce(m.instagram, r.instagram),
    linkedin         = coalesce(m.linkedin, r.linkedin),
    site             = coalesce(m.site, r.site),
    como_conheceu    = coalesce(m.como_conheceu, r.como_conheceu),
    aceite_termos_em = coalesce(m.aceite_termos_em, r.aceite_termos_em),
    ultimo_acesso_em = greatest(m.ultimo_acesso_em, r.ultimo_acesso_em),
    criado_em        = least(m.criado_em, r.criado_em)
  where id = _manter;

  -- contatos e endereços (sem roubar o "principal" da ficha mantida)
  delete from public.pessoa_contatos c where c.pessoa_id = _remover
    and exists (select 1 from public.pessoa_contatos k where k.pessoa_id = _manter and k.tipo = c.tipo and k.valor = c.valor);
  update public.pessoa_contatos set pessoa_id = _manter, principal = false where pessoa_id = _remover;
  get diagnostics n = row_count; v_mov := v_mov || jsonb_build_object('contatos', n);
  update public.pessoa_enderecos set pessoa_id = _manter,
    principal = principal and not exists (select 1 from public.pessoa_enderecos e where e.pessoa_id = _manter and e.principal)
    where pessoa_id = _remover;

  -- papéis e acessos
  delete from public.papeis x where x.pessoa_id = _remover and exists (select 1 from public.papeis y where y.pessoa_id = _manter and y.papel = x.papel);
  update public.papeis set pessoa_id = _manter where pessoa_id = _remover;
  update public.papeis set criado_por = _manter where criado_por = _remover;
  update public.concessoes_acesso set pessoa_id = _manter where pessoa_id = _remover;
  get diagnostics n = row_count; v_mov := v_mov || jsonb_build_object('acessos', n);
  update public.concessoes_acesso set criado_por = _manter where criado_por = _remover;

  -- financeiro, encontros, negócios, conteúdo
  update public.pagamentos set pessoa_id = _manter where pessoa_id = _remover;
  get diagnostics n = row_count; v_mov := v_mov || jsonb_build_object('pagamentos', n);
  select array_agg(ir.id) into v_soltas from public.evento_inscricoes ir
    where ir.pessoa_id = _remover and exists (select 1 from public.evento_inscricoes im where im.evento_id = ir.evento_id and im.pessoa_id = _manter);
  update public.evento_inscricoes set pessoa_id = null where id = any(coalesce(v_soltas, '{}'::uuid[]));
  update public.evento_inscricoes set pessoa_id = _manter where pessoa_id = _remover;
  get diagnostics n = row_count;
  v_mov := v_mov || jsonb_build_object('inscricoes', n, 'inscricoes_sem_ficha', to_jsonb(coalesce(v_soltas, '{}'::uuid[])));
  update public.evento_presencas set registrado_por = _manter where registrado_por = _remover;
  update public.negocios set pessoa_id = _manter where pessoa_id = _remover;
  get diagnostics n = row_count; v_mov := v_mov || jsonb_build_object('negocios', n);
  update public.negocio_avaliacoes ar set pessoa_id = null where ar.pessoa_id = _remover
    and exists (select 1 from public.negocio_avaliacoes am where am.negocio_id = ar.negocio_id and am.pessoa_id = _manter);
  update public.negocio_avaliacoes set pessoa_id = _manter where pessoa_id = _remover;
  update public.post_comentarios set pessoa_id = _manter where pessoa_id = _remover;
  update public.autores set pessoa_id = _manter where pessoa_id = _remover;
  update public.campanha_envios set pessoa_id = _manter where pessoa_id = _remover;
  update public.contato_eventos set pessoa_id = _manter where pessoa_id = _remover;

  -- Academy e tour
  update public.matriculas mm set concluido_em = coalesce(mm.concluido_em, mr.concluido_em)
    from public.matriculas mr where mm.pessoa_id = _manter and mr.pessoa_id = _remover and mr.curso_id = mm.curso_id;
  delete from public.matriculas x where x.pessoa_id = _remover and exists (select 1 from public.matriculas y where y.pessoa_id = _manter and y.curso_id = x.curso_id);
  update public.matriculas set pessoa_id = _manter where pessoa_id = _remover;
  delete from public.progresso_aulas x where x.pessoa_id = _remover and exists (select 1 from public.progresso_aulas y where y.pessoa_id = _manter and y.aula_id = x.aula_id);
  update public.progresso_aulas set pessoa_id = _manter where pessoa_id = _remover;
  delete from public.tour_progresso x where x.pessoa_id = _remover and exists (select 1 from public.tour_progresso y where y.pessoa_id = _manter and y.modulo = x.modulo and y.versao = x.versao);
  update public.tour_progresso set pessoa_id = _manter where pessoa_id = _remover;

  -- Conecta+ e embaixadoras
  delete from public.conecta_conexoes where (de_pessoa_id = _remover and para_pessoa_id = _manter) or (de_pessoa_id = _manter and para_pessoa_id = _remover);
  delete from public.conecta_conexoes x where x.de_pessoa_id = _remover and exists (select 1 from public.conecta_conexoes y where y.de_pessoa_id = _manter and y.para_pessoa_id = x.para_pessoa_id);
  delete from public.conecta_conexoes x where x.para_pessoa_id = _remover and exists (select 1 from public.conecta_conexoes y where y.para_pessoa_id = _manter and y.de_pessoa_id = x.de_pessoa_id);
  update public.conecta_conexoes set de_pessoa_id = _manter where de_pessoa_id = _remover;
  update public.conecta_conexoes set para_pessoa_id = _manter where para_pessoa_id = _remover;
  delete from public.conecta_grupo_membros x where x.pessoa_id = _remover and exists (select 1 from public.conecta_grupo_membros y where y.pessoa_id = _manter and y.grupo_id = x.grupo_id);
  update public.conecta_grupo_membros set pessoa_id = _manter where pessoa_id = _remover;
  update public.conecta_indicacoes set de_pessoa_id = _manter where de_pessoa_id = _remover;
  update public.conecta_indicacoes set para_pessoa_id = _manter where para_pessoa_id = _remover;
  update public.conecta_mensagens set de_pessoa_id = _manter where de_pessoa_id = _remover;
  update public.conecta_mensagens set para_pessoa_id = _manter where para_pessoa_id = _remover;
  if exists (select 1 from public.conecta_perfis where pessoa_id = _manter) then
    delete from public.conecta_perfis where pessoa_id = _remover;
  else
    update public.conecta_perfis set pessoa_id = _manter where pessoa_id = _remover;
  end if;
  update public.embaixadoras set pessoa_id = _manter where pessoa_id = _remover;
  update public.embaixadora_indicacoes set pessoa_indicada_id = _manter where pessoa_indicada_id = _remover;

  -- CRM
  if exists (select 1 from public.crm_fichas where pessoa_id = _manter) then
    update public.crm_fichas fm set
      origem = coalesce(fm.origem, fr.origem),
      origem_detalhe = coalesce(fm.origem_detalhe, fr.origem_detalhe),
      primeiro_contato_em = least(fm.primeiro_contato_em, fr.primeiro_contato_em),
      observacoes = nullif(concat_ws(E'\n\n', nullif(btrim(fm.observacoes),''), nullif(btrim(fr.observacoes),'')), '')
      from public.crm_fichas fr where fm.pessoa_id = _manter and fr.pessoa_id = _remover;
    delete from public.crm_fichas where pessoa_id = _remover;
  else
    update public.crm_fichas set pessoa_id = _manter where pessoa_id = _remover;
  end if;
  delete from public.crm_apelidos x where x.pessoa_id = _remover
    and exists (select 1 from public.crm_apelidos y where y.pessoa_id = _manter and lower(y.apelido) = lower(x.apelido));
  update public.crm_apelidos set pessoa_id = _manter where pessoa_id = _remover;
  if public.crm_normalizar(btrim(r.nome)) <> public.crm_normalizar(btrim(m.nome)) and coalesce(btrim(r.nome),'') not in ('','Sem nome') then
    insert into public.crm_apelidos (pessoa_id, apelido, origem) values (_manter, btrim(r.nome), 'união de fichas') on conflict do nothing;
  end if;
  update public.crm_oportunidades set pessoa_id = _manter where pessoa_id = _remover;
  get diagnostics n = row_count; v_mov := v_mov || jsonb_build_object('oportunidades', n);
  update public.crm_oportunidades set responsavel_id = _manter where responsavel_id = _remover;
  update public.crm_interacoes set pessoa_id = _manter where pessoa_id = _remover;
  get diagnostics n = row_count; v_mov := v_mov || jsonb_build_object('historico', n);
  update public.crm_interacoes set registrado_por = _manter where registrado_por = _remover;
  update public.crm_atividades set pessoa_id = _manter where pessoa_id = _remover;
  get diagnostics n = row_count; v_mov := v_mov || jsonb_build_object('tarefas', n);
  update public.crm_atividades set responsavel_id = _manter where responsavel_id = _remover;
  update public.crm_atividades set criado_por = _manter where criado_por = _remover;
  update public.crm_consentimentos set pessoa_id = _manter where pessoa_id = _remover;
  update public.crm_consentimentos set registrado_por = _manter where registrado_por = _remover;
  delete from public.crm_negocio_vinculos x where x.pessoa_id = _remover
    and exists (select 1 from public.crm_negocio_vinculos y where y.pessoa_id = _manter and y.negocio_id = x.negocio_id);
  update public.crm_negocio_vinculos set pessoa_id = _manter where pessoa_id = _remover;
  update public.crm_fusoes set pessoa_mantida_id = _manter where pessoa_mantida_id = _remover;
  update public.crm_fusoes set realizado_por = _manter where realizado_por = _remover;
  update public.crm_duplicadas_ignoradas set registrado_por = _manter where registrado_por = _remover;
  update public.crm_importacoes set realizado_por = _manter where realizado_por = _remover;

  -- trava de segurança: se algum dado ainda apontar para a ficha removida, nada é apagado
  for rec in
    select c.conrelid::regclass as tabela, a.attname as coluna
    from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.contype = 'f' and c.confrelid = 'public.pessoas'::regclass
      and c.conrelid <> 'public.crm_duplicadas_ignoradas'::regclass
  loop
    execute format('select exists (select 1 from %s where %I = $1)', rec.tabela, rec.coluna) into v_tem using _remover;
    if v_tem then
      raise exception 'A união foi cancelada: ainda há dados em "%" ligados à ficha removida. Nada foi alterado.', rec.tabela;
    end if;
  end loop;

  delete from public.pessoas where id = _remover;

  insert into public.crm_fusoes (pessoa_mantida_id, pessoa_removida_id, nome_mantido, nome_removido, motivo, dados_removidos, movimentos)
  values (_manter, _remover, m.nome, r.nome, nullif(btrim(coalesce(_motivo,'')),''), v_snap, v_mov);
  insert into public.crm_interacoes (pessoa_id, canal, tipo, resumo)
  values (_manter, 'sistema', 'nota', 'Ficha unida com "' || r.nome || '"' || coalesce(' · ' || nullif(btrim(_motivo),''), ''));

  return v_mov;
end $$;

-- =============================================================== importador
create or replace function private.crm_classificar_contato(_nome text, _email text, _telefone text, _cpf text)
returns table(acao text, pessoa_id uuid, pessoa_nome text, motivo text, aviso text, email_ok citext, telefone_ok text, cpf_ok text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_email citext; v_tel text; v_cpf text; v_av text[] := '{}'; v_mot text[] := '{}';
  id_cpf uuid; id_email uuid; id_tel uuid; v_ids uuid[]; v_nome text := btrim(coalesce(_nome,''));
begin
  v_email := nullif(lower(btrim(coalesce(_email,''))),'')::citext;
  if v_email is not null and v_email::text !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    v_av := v_av || ('E-mail inválido ignorado (' || v_email::text || ')'); v_email := null;
  end if;
  v_tel := public.so_digitos(_telefone);
  if v_tel is not null and (length(v_tel) < 10 or length(v_tel) > 13) then
    v_av := v_av || 'Telefone sem DDD ignorado'::text; v_tel := null;
  end if;
  v_cpf := public.so_digitos(_cpf);
  if v_cpf is not null and length(v_cpf) <> 11 then
    v_av := v_av || 'CPF incompleto ignorado'::text; v_cpf := null;
  end if;

  if v_cpf is not null then select p.id into id_cpf from public.pessoas p where p.cpf = v_cpf; end if;
  if v_email is not null then
    select c.pessoa_id into id_email from public.pessoa_contatos c where c.tipo = 'email' and c.valor = v_email order by c.criado_em limit 1;
  end if;
  if v_tel is not null then
    select c.pessoa_id into id_tel from public.pessoa_contatos c
      where c.tipo in ('telefone','whatsapp') and public.crm_telefone_chave(c.valor::text) = public.crm_telefone_chave(v_tel)
      order by c.criado_em limit 1;
  end if;
  if id_cpf is not null then v_mot := v_mot || 'mesmo CPF'::text; end if;
  if id_email is not null then v_mot := v_mot || 'mesmo e-mail'::text; end if;
  if id_tel is not null then v_mot := v_mot || 'mesmo telefone'::text; end if;
  select array_agg(distinct x) into v_ids from unnest(array[id_cpf, id_email, id_tel]) x where x is not null;

  if coalesce(array_length(v_ids, 1), 0) > 1 then
    return query select 'conflito'::text, null::uuid, null::text,
      'Os dados apontam para fichas diferentes (' || (select string_agg(p.nome, ' e ') from public.pessoas p where p.id = any(v_ids))
        || '). Confira em "Possíveis repetidas".',
      array_to_string(v_av, ' · '), v_email, v_tel, v_cpf;
    return;
  end if;

  if coalesce(array_length(v_ids, 1), 0) = 1 then
    if v_cpf is not null and id_cpf is null
       and exists (select 1 from public.pessoas p where p.id = v_ids[1] and p.cpf is not null and p.cpf <> v_cpf) then
      return query select 'conflito'::text, v_ids[1], (select p.nome from public.pessoas p where p.id = v_ids[1]),
        'A ficha encontrada tem outro CPF. Confira antes de importar.', array_to_string(v_av, ' · '), v_email, v_tel, v_cpf;
      return;
    end if;
    return query select 'completar'::text, v_ids[1], (select p.nome from public.pessoas p where p.id = v_ids[1]),
      'Já cadastrada (' || array_to_string(v_mot, ', ') || '): só acrescenta o que faltar', array_to_string(v_av, ' · '), v_email, v_tel, v_cpf;
    return;
  end if;

  if length(v_nome) < 2 then
    return query select 'erro'::text, null::uuid, null::text, 'Linha sem nome'::text, array_to_string(v_av, ' · '), v_email, v_tel, v_cpf;
    return;
  end if;
  if v_email is null and v_tel is null and v_cpf is null then
    return query select 'erro'::text, null::uuid, null::text, 'Sem e-mail, telefone com DDD ou CPF válido'::text, array_to_string(v_av, ' · '), v_email, v_tel, v_cpf;
    return;
  end if;
  if exists (select 1 from public.pessoas p where public.crm_normalizar(btrim(p.nome)) = public.crm_normalizar(v_nome)) then
    v_av := v_av || 'Já existe alguém com o mesmo nome (confira)'::text;
  end if;
  return query select 'criar'::text, null::uuid, null::text, 'Nova ficha'::text, array_to_string(v_av, ' · '), v_email, v_tel, v_cpf;
end $$;

create or replace function private.crm_importar_previa(_linhas jsonb)
returns table(linha integer, acao text, pessoa_id uuid, pessoa_nome text, motivo text, aviso text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not private.e_admin() then raise exception 'Apenas a administração pode importar contatos'; end if;
  if jsonb_typeof(_linhas) <> 'array' then raise exception 'Formato inválido'; end if;
  if jsonb_array_length(_linhas) > 2000 then raise exception 'Envie no máximo 2.000 linhas por vez'; end if;
  return query
    select (l ->> 'linha')::int, c.acao, c.pessoa_id, c.pessoa_nome, c.motivo, nullif(c.aviso, '')
    from jsonb_array_elements(_linhas) l
    cross join lateral private.crm_classificar_contato(l ->> 'nome', l ->> 'email', l ->> 'telefone', l ->> 'cpf') c;
end $$;

create or replace function private.crm_importar_iniciar(_nome_arquivo text, _origem text, _total integer)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not private.e_admin() then raise exception 'Apenas a administração pode importar contatos'; end if;
  insert into public.crm_importacoes (nome_arquivo, origem, total)
  values (left(coalesce(nullif(btrim(_nome_arquivo),''), 'planilha'), 200), nullif(btrim(coalesce(_origem,'')),''), greatest(0, coalesce(_total, 0)))
  returning id into v_id;
  return v_id;
end $$;

create or replace function private.crm_importar_lote(
  _importacao_id uuid, _linhas jsonb, _criar_oportunidade boolean default false, _autorizou_whatsapp boolean default false
) returns table(linha integer, acao text, pessoa_id uuid, mensagem text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  imp public.crm_importacoes; l jsonb; c record; v_id uuid; v_linha int; v_acao text; v_msg text; v_nota text;
  v_res jsonb := '[]'::jsonb; v_prim timestamptz;
begin
  if not private.e_admin() then raise exception 'Apenas a administração pode importar contatos'; end if;
  select * into imp from public.crm_importacoes where id = _importacao_id for update;
  if imp.id is null then raise exception 'Importação não encontrada'; end if;
  if jsonb_typeof(_linhas) <> 'array' then raise exception 'Formato inválido'; end if;
  if jsonb_array_length(_linhas) > 500 then raise exception 'Envie no máximo 500 linhas por lote'; end if;

  for l in select * from jsonb_array_elements(_linhas) loop
    v_linha := (l ->> 'linha')::int; v_id := null; v_msg := null;
    begin
      select * into c from private.crm_classificar_contato(l ->> 'nome', l ->> 'email', l ->> 'telefone', l ->> 'cpf');
      v_acao := c.acao;
      v_prim := nullif(btrim(coalesce(l ->> 'primeiro_contato','')),'')::date::timestamptz;
      if c.acao in ('erro','conflito') then
        v_msg := c.motivo;
      elsif c.acao = 'criar' then
        insert into public.pessoas (nome, cpf) values (btrim(l ->> 'nome'), c.cpf_ok) returning id into v_id;
        if c.email_ok is not null then
          insert into public.pessoa_contatos (pessoa_id, tipo, valor, principal) values (v_id, 'email', c.email_ok, true);
        end if;
        if c.telefone_ok is not null then
          insert into public.pessoa_contatos (pessoa_id, tipo, valor, principal) values (v_id, 'whatsapp', c.telefone_ok::citext, true);
        end if;
        insert into public.crm_fichas (pessoa_id, origem, origem_detalhe, primeiro_contato_em)
        values (v_id, imp.origem, 'Planilha: ' || imp.nome_arquivo, v_prim);
        v_msg := 'Ficha criada';
      else
        v_id := c.pessoa_id;
        if c.cpf_ok is not null then update public.pessoas set cpf = c.cpf_ok where id = v_id and cpf is null; end if;
        if c.email_ok is not null then
          insert into public.pessoa_contatos (pessoa_id, tipo, valor, principal)
          values (v_id, 'email', c.email_ok, not exists (select 1 from public.pessoa_contatos k where k.pessoa_id = v_id and k.tipo = 'email'))
          on conflict (pessoa_id, tipo, valor) do nothing;
        end if;
        if c.telefone_ok is not null and not exists (
          select 1 from public.pessoa_contatos k where k.pessoa_id = v_id and k.tipo in ('telefone','whatsapp')
            and public.crm_telefone_chave(k.valor::text) = public.crm_telefone_chave(c.telefone_ok)) then
          insert into public.pessoa_contatos (pessoa_id, tipo, valor, principal)
          values (v_id, 'whatsapp', c.telefone_ok::citext,
                  not exists (select 1 from public.pessoa_contatos k where k.pessoa_id = v_id and k.tipo in ('telefone','whatsapp')));
        end if;
        insert into public.crm_fichas (pessoa_id, origem, origem_detalhe, primeiro_contato_em)
        values (v_id, imp.origem, 'Planilha: ' || imp.nome_arquivo, v_prim)
        on conflict (pessoa_id) do update set
          origem = coalesce(public.crm_fichas.origem, excluded.origem),
          origem_detalhe = coalesce(public.crm_fichas.origem_detalhe, excluded.origem_detalhe),
          primeiro_contato_em = coalesce(public.crm_fichas.primeiro_contato_em, excluded.primeiro_contato_em);
        v_msg := 'Ficha existente completada';
      end if;

      if v_id is not null then
        if nullif(btrim(coalesce(l ->> 'apelido','')),'') is not null then
          insert into public.crm_apelidos (pessoa_id, apelido, origem) values (v_id, btrim(l ->> 'apelido'), 'importação') on conflict do nothing;
        end if;
        v_nota := concat_ws(' · ', 'Veio na planilha "' || imp.nome_arquivo || '"',
                            'Negócio: ' || nullif(btrim(coalesce(l ->> 'negocio','')),''),
                            nullif(btrim(coalesce(l ->> 'observacao','')),''));
        insert into public.crm_interacoes (pessoa_id, canal, tipo, resumo) values (v_id, 'sistema', 'nota', left(v_nota, 2000));
        if _criar_oportunidade and not exists (select 1 from public.crm_oportunidades o where o.pessoa_id = v_id and o.fechada_em is null) then
          insert into public.crm_oportunidades (pessoa_id, titulo, etapa) values (v_id, 'Contato da planilha ' || imp.nome_arquivo, 'nova');
        end if;
        if _autorizou_whatsapp and c.telefone_ok is not null
           and not exists (select 1 from public.crm_consentimentos s where s.pessoa_id = v_id and s.canal = 'whatsapp') then
          insert into public.crm_consentimentos (pessoa_id, canal, situacao, origem)
          values (v_id, 'whatsapp', 'autorizado', 'importação: ' || imp.nome_arquivo);
        end if;
      end if;
    exception when others then
      v_acao := 'erro'; v_id := null; v_msg := sqlerrm;
    end;
    v_res := v_res || jsonb_build_object('linha', v_linha, 'acao', v_acao, 'pessoa_id', v_id, 'mensagem', v_msg, 'nome', l ->> 'nome');
    linha := v_linha; acao := v_acao; pessoa_id := v_id; mensagem := v_msg;
    return next;
  end loop;
  update public.crm_importacoes set resultado = resultado || v_res where id = _importacao_id;
end $$;

-- =============================================================== permissões das funções privadas
revoke all on function private.crm_radar(integer) from public, anon;
revoke all on function private.crm_radar_acionar(uuid, uuid[], text) from public, anon;
revoke all on function private.crm_duplicadas() from public, anon;
revoke all on function private.crm_ignorar_duplicada(uuid, uuid, text) from public, anon;
revoke all on function private.crm_resumo_pessoa(uuid) from public, anon;
revoke all on function private.crm_previa_fusao(uuid, uuid) from public, anon;
revoke all on function private.crm_fundir_pessoas(uuid, uuid, text) from public, anon;
revoke all on function private.crm_classificar_contato(text, text, text, text) from public, anon;
revoke all on function private.crm_importar_previa(jsonb) from public, anon;
revoke all on function private.crm_importar_iniciar(text, text, integer) from public, anon;
revoke all on function private.crm_importar_lote(uuid, jsonb, boolean, boolean) from public, anon;
grant execute on function private.crm_radar(integer) to authenticated, service_role;
grant execute on function private.crm_radar_acionar(uuid, uuid[], text) to authenticated, service_role;
grant execute on function private.crm_duplicadas() to authenticated, service_role;
grant execute on function private.crm_ignorar_duplicada(uuid, uuid, text) to authenticated, service_role;
grant execute on function private.crm_resumo_pessoa(uuid) to authenticated, service_role;
grant execute on function private.crm_previa_fusao(uuid, uuid) to authenticated, service_role;
grant execute on function private.crm_fundir_pessoas(uuid, uuid, text) to authenticated, service_role;
grant execute on function private.crm_classificar_contato(text, text, text, text) to authenticated, service_role;
grant execute on function private.crm_importar_previa(jsonb) to authenticated, service_role;
grant execute on function private.crm_importar_iniciar(text, text, integer) to authenticated, service_role;
grant execute on function private.crm_importar_lote(uuid, jsonb, boolean, boolean) to authenticated, service_role;

-- =============================================================== wrappers públicos (invoker)
create or replace function public.crm_radar(_dias integer default 120)
returns table(
  evento_id uuid, evento_titulo text, evento_inicio timestamptz, evento_online boolean, evento_tem_portaria boolean,
  inscricao_id uuid, pessoa_id uuid, nome text, email text, telefone text, compareceu boolean, assinante boolean,
  oportunidade_id uuid, etapa public.crm_etapa, contato_depois timestamptz, tarefa_aberta boolean, tarefa_feita boolean,
  whatsapp_recusado boolean
)
language sql stable set search_path = public as $$ select * from private.crm_radar($1) $$;

create or replace function public.crm_radar_acionar(_evento_id uuid, _pessoas uuid[], _acao text)
returns jsonb language sql set search_path = public as $$ select private.crm_radar_acionar($1, $2, $3) $$;

create or replace function public.crm_duplicadas()
returns table(pessoa_a uuid, nome_a text, pessoa_b uuid, nome_b text, motivos text[], forte boolean)
language sql stable set search_path = public as $$ select * from private.crm_duplicadas() $$;

create or replace function public.crm_ignorar_duplicada(_a uuid, _b uuid, _motivo text default null)
returns void language sql set search_path = public as $$ select private.crm_ignorar_duplicada($1, $2, $3) $$;

create or replace function public.crm_previa_fusao(_manter uuid, _remover uuid)
returns jsonb language sql stable set search_path = public as $$ select private.crm_previa_fusao($1, $2) $$;

create or replace function public.crm_fundir_pessoas(_manter uuid, _remover uuid, _motivo text default null)
returns jsonb language sql set search_path = public as $$ select private.crm_fundir_pessoas($1, $2, $3) $$;

create or replace function public.crm_importar_previa(_linhas jsonb)
returns table(linha integer, acao text, pessoa_id uuid, pessoa_nome text, motivo text, aviso text)
language sql stable set search_path = public as $$ select * from private.crm_importar_previa($1) $$;

create or replace function public.crm_importar_iniciar(_nome_arquivo text, _origem text, _total integer)
returns uuid language sql set search_path = public as $$ select private.crm_importar_iniciar($1, $2, $3) $$;

create or replace function public.crm_importar_lote(
  _importacao_id uuid, _linhas jsonb, _criar_oportunidade boolean default false, _autorizou_whatsapp boolean default false
) returns table(linha integer, acao text, pessoa_id uuid, mensagem text)
language sql set search_path = public as $$ select * from private.crm_importar_lote($1, $2, $3, $4) $$;

revoke all on function public.crm_radar(integer) from public, anon;
revoke all on function public.crm_radar_acionar(uuid, uuid[], text) from public, anon;
revoke all on function public.crm_duplicadas() from public, anon;
revoke all on function public.crm_ignorar_duplicada(uuid, uuid, text) from public, anon;
revoke all on function public.crm_previa_fusao(uuid, uuid) from public, anon;
revoke all on function public.crm_fundir_pessoas(uuid, uuid, text) from public, anon;
revoke all on function public.crm_importar_previa(jsonb) from public, anon;
revoke all on function public.crm_importar_iniciar(text, text, integer) from public, anon;
revoke all on function public.crm_importar_lote(uuid, jsonb, boolean, boolean) from public, anon;
grant execute on function public.crm_radar(integer) to authenticated, service_role;
grant execute on function public.crm_radar_acionar(uuid, uuid[], text) to authenticated, service_role;
grant execute on function public.crm_duplicadas() to authenticated, service_role;
grant execute on function public.crm_ignorar_duplicada(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.crm_previa_fusao(uuid, uuid) to authenticated, service_role;
grant execute on function public.crm_fundir_pessoas(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.crm_importar_previa(jsonb) to authenticated, service_role;
grant execute on function public.crm_importar_iniciar(text, text, integer) to authenticated, service_role;
grant execute on function public.crm_importar_lote(uuid, jsonb, boolean, boolean) to authenticated, service_role;