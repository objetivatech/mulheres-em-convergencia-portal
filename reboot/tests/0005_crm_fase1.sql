-- Testes de aceitação — CRM MeC Conecta, Fase 1.
-- Rodam como uma administradora (troque o UUID pelo auth_user_id de uma admin) e desfazem tudo no fim.
-- Resultado esperado: erro final "CRM OK: ..." (o erro é proposital, para não gravar nada).
do $$
declare
  v_admin uuid := '43d883aa-399c-4bf8-9ad2-c5dab70e1053';
  v_id uuid; v_op uuid; v_tarefa uuid; n int; t text;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  if not public.e_admin() then raise exception 'pré-condição: o UUID informado não é admin'; end if;

  -- 1. contato provisório sem CPF, com apelido
  v_id := public.crm_criar_pessoa('Santa Laurentina (fictícia)', 'santa.ficticia@exemplo.invalid', '(54) 90000-1111', null, 'Laura', 'instagram', '2025-03-10', 'Conheceu no Instagram');

  -- 2. achar por apelido e sem acento
  select count(*) into n from public.crm_pessoas('laura') where pessoa_id = v_id;
  if n <> 1 then raise exception '2 falhou: busca por apelido'; end if;
  select count(*) into n from public.crm_pessoas('LAURENTINA') where pessoa_id = v_id;
  if n <> 1 then raise exception '2b falhou: busca sem diferenciar maiúsculas'; end if;
  select count(*) into n from public.crm_pessoas('90000-1111') where pessoa_id = v_id;
  if n <> 1 then raise exception '2c falhou: busca por telefone'; end if;

  -- 3. mesmo e-mail ou telefone não cria outra pessoa
  begin
    perform public.crm_criar_pessoa('Outra', 'SANTA.ficticia@exemplo.invalid');
    raise exception '3 falhou: e-mail duplicado aceito';
  exception when others then
    if sqlerrm not like 'Já existe uma pessoa com este e-mail%' then raise; end if;
  end;
  begin
    perform public.crm_criar_pessoa('Outra', null, '+55 54 90000-1111');
    raise exception '3b falhou: telefone duplicado aceito';
  exception when others then
    if sqlerrm not like 'Já existe uma pessoa com este telefone%' then raise; end if;
  end;
  select count(*) into n from public.crm_semelhantes(null, null, '5490000 1111', null) where pessoa_id = v_id;
  if n <> 1 then raise exception '3c falhou: possível duplicada por telefone'; end if;

  -- 4. funil: uma oportunidade aberta por pessoa, datas e histórico automáticos
  insert into public.crm_oportunidades (pessoa_id, etapa) values (v_id, 'nova') returning id into v_op;
  begin
    insert into public.crm_oportunidades (pessoa_id) values (v_id);
    raise exception '4 falhou: duas oportunidades abertas';
  exception when unique_violation then null;
  end;
  update public.crm_oportunidades set etapa = 'plano_apresentado' where id = v_op;
  select count(*) into n from public.crm_oportunidades where id = v_op and plano_apresentado_em is not null and fechada_em is null;
  if n <> 1 then raise exception '4b falhou: data de plano apresentado'; end if;
  update public.crm_oportunidades set etapa = 'sem_interesse', motivo = 'momento financeiro' where id = v_op;
  select count(*) into n from public.crm_oportunidades where id = v_op and fechada_em is not null;
  if n <> 1 then raise exception '4c falhou: encerramento'; end if;
  select count(*) into n from public.crm_interacoes where oportunidade_id = v_op and tipo = 'etapa';
  if n <> 3 then raise exception '4d falhou: histórico de etapas (%), esperado 3', n; end if;

  -- 5. concluir tarefa registra no histórico
  insert into public.crm_atividades (pessoa_id, titulo, vence_em) values (v_id, 'Retornar', now()) returning id into v_tarefa;
  update public.crm_atividades set concluida_em = now(), resultado = 'vai pensar' where id = v_tarefa;
  select resumo into t from public.crm_interacoes where pessoa_id = v_id and tipo = 'tarefa';
  if t is distinct from 'Tarefa concluída: Retornar — vai pensar' then raise exception '5 falhou: %', t; end if;

  -- 6. conta comum não enxerga o CRM
  perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
  select count(*) into n from public.crm_interacoes;
  if n <> 0 then raise exception '6 falhou: conta comum leu interações'; end if;
  select count(*) into n from public.crm_pessoas(null);
  if n <> 0 then raise exception '6b falhou: conta comum listou pessoas'; end if;
  begin
    perform public.crm_criar_pessoa('Invasora', 'x@exemplo.invalid');
    raise exception '6c falhou: conta comum cadastrou';
  exception when others then
    if sqlerrm not like 'Apenas a administração%' then raise; end if;
  end;

  raise exception 'CRM OK: 6 grupos de testes passaram (nada foi gravado)';
end $$;
