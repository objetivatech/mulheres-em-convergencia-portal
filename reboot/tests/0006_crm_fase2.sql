-- Testes de aceitação — CRM MeC Conecta, Fase 2 (radar, possíveis repetidas, união de fichas, importador).
-- Rodam como uma administradora (troque o UUID pelo auth_user_id de uma admin) e desfazem tudo no fim.
-- Resultado esperado: erro final "CRM FASE 2 OK: ..." (o erro é proposital, para não gravar nada).
do $$
declare
  v_admin uuid := '43d883aa-399c-4bf8-9ad2-c5dab70e1053';
  v_a uuid; v_b uuid; v_c uuid; v_d uuid; v_e uuid; v_imp uuid; v_nova uuid;
  v_ev uuid; v_p uuid; j jsonb; n int; t text;
begin
  -- preparação (como dona do banco): duas fichas com o mesmo e-mail, uma terceira com outro telefone
  insert into public.pessoas (nome) values ('Ana Teste Fusão (fictícia)') returning id into v_a;
  insert into public.pessoas (nome, nome_social, data_nascimento) values ('Ana Fictícia Dois', 'Aninha', '1990-05-20') returning id into v_b;
  insert into public.pessoas (nome) values ('Carla Teste (fictícia)') returning id into v_c;
  insert into public.pessoa_contatos (pessoa_id, tipo, valor, principal) values
    (v_a, 'email', 'ana.f2@exemplo.invalid', true),
    (v_b, 'email', 'ana.f2@exemplo.invalid', true),
    (v_b, 'whatsapp', '54900002222', true),
    (v_c, 'whatsapp', '54900003333', true);
  insert into public.pessoas (nome, cpf) values ('Cpf Um (fictícia)', '00000000191') returning id into v_d;
  insert into public.pessoas (nome, cpf) values ('Cpf Dois (fictícia)', '00000000272') returning id into v_e;

  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  if not public.e_admin() then raise exception 'pré-condição: o UUID informado não é admin'; end if;

  -- 1. possíveis repetidas: mesmo e-mail é sinal forte
  select count(*) into n from public.crm_duplicadas()
    where pessoa_a = least(v_a, v_b) and pessoa_b = greatest(v_a, v_b) and forte and 'Mesmo e-mail' = any(motivos);
  if n <> 1 then raise exception '1 falhou: par com mesmo e-mail não apareceu'; end if;

  -- 2. "não são a mesma pessoa" tira o par da fila
  perform public.crm_ignorar_duplicada(v_b, v_a, 'teste');
  select count(*) into n from public.crm_duplicadas() where pessoa_a = least(v_a, v_b) and pessoa_b = greatest(v_a, v_b);
  if n <> 0 then raise exception '2 falhou: par ignorado continuou na fila'; end if;

  -- 3. bloqueio: CPFs diferentes não se unem
  begin
    perform public.crm_fundir_pessoas(v_d, v_e, 'teste');
    raise exception '3 falhou: uniu CPFs diferentes';
  exception when others then
    if sqlerrm not like 'As fichas têm CPFs diferentes%' then raise; end if;
  end;

  -- 4. união: histórico move, nada se perde, campos vazios são completados, auditoria registrada
  insert into public.crm_interacoes (pessoa_id, canal, tipo, resumo) values (v_b, 'whatsapp', 'conversa', 'Conversa da ficha B');
  insert into public.crm_atividades (pessoa_id, titulo) values (v_b, 'Tarefa da ficha B');
  insert into public.crm_consentimentos (pessoa_id, canal, situacao) values (v_b, 'whatsapp', 'autorizado');
  j := public.crm_previa_fusao(v_a, v_b);
  if jsonb_array_length(j -> 'bloqueios') <> 0 then raise exception '4 falhou: prévia bloqueou sem motivo: %', j -> 'bloqueios'; end if;
  perform public.crm_fundir_pessoas(v_a, v_b, 'mesma pessoa (teste)');
  if exists (select 1 from public.pessoas where id = v_b) then raise exception '4a falhou: ficha removida ainda existe'; end if;
  select count(*) into n from public.crm_interacoes where pessoa_id = v_a and resumo = 'Conversa da ficha B';
  if n <> 1 then raise exception '4b falhou: conversa não foi movida'; end if;
  select count(*) into n from public.crm_atividades where pessoa_id = v_a and titulo = 'Tarefa da ficha B';
  if n <> 1 then raise exception '4c falhou: tarefa não foi movida'; end if;
  select count(*) into n from public.pessoa_contatos where pessoa_id = v_a and tipo = 'email' and valor = 'ana.f2@exemplo.invalid';
  if n <> 1 then raise exception '4d falhou: e-mail repetido ficou em dobro'; end if;
  select count(*) into n from public.pessoa_contatos where pessoa_id = v_a and tipo = 'whatsapp' and valor = '54900002222' and not principal;
  if n <> 1 then raise exception '4e falhou: telefone da ficha B não veio como contato extra'; end if;
  select nome_social into t from public.pessoas where id = v_a;
  if t is distinct from 'Aninha' then raise exception '4f falhou: campo vazio não foi completado'; end if;
  select count(*) into n from public.crm_apelidos where pessoa_id = v_a and apelido = 'Ana Fictícia Dois';
  if n <> 1 then raise exception '4g falhou: nome da ficha removida não virou apelido'; end if;
  select count(*) into n from public.crm_fusoes where pessoa_mantida_id = v_a and pessoa_removida_id = v_b and motivo = 'mesma pessoa (teste)';
  if n <> 1 then raise exception '4h falhou: união sem auditoria'; end if;

  -- 5. importador: prévia classifica cada linha sem gravar
  j := '[
    {"linha":2,"nome":"Beatriz Planilha (fictícia)","email":"bia.planilha@exemplo.invalid","telefone":"(54) 90000-4444","apelido":"Bia","negocio":"Doces da Bia"},
    {"linha":3,"nome":"Ana outra grafia","email":"ANA.F2@exemplo.invalid","telefone":"54 90000-5555"},
    {"linha":4,"nome":"Sem Contato","email":"isso-nao-e-email"},
    {"linha":5,"nome":"Mistura","email":"ana.f2@exemplo.invalid","telefone":"54900003333"}
  ]'::jsonb;
  select string_agg(acao, ',' order by linha) into t from public.crm_importar_previa(j);
  if t <> 'criar,completar,erro,conflito' then raise exception '5 falhou: prévia classificou %', t; end if;
  if exists (select 1 from public.pessoa_contatos where valor = 'bia.planilha@exemplo.invalid') then raise exception '5b falhou: prévia gravou dados'; end if;

  -- 6. importador: gravação só acrescenta, registra resultado por linha
  v_imp := public.crm_importar_iniciar('lista-teste.xlsx', 'lista_antiga', 4);
  select string_agg(acao, ',' order by linha) into t from public.crm_importar_lote(v_imp, j, true, false);
  if t <> 'criar,completar,erro,conflito' then raise exception '6 falhou: lote fez %', t; end if;
  select c.pessoa_id into v_nova from public.pessoa_contatos c where c.valor = 'bia.planilha@exemplo.invalid';
  if v_nova is null then raise exception '6a falhou: ficha nova não criada'; end if;
  select count(*) into n from public.crm_fichas where pessoa_id = v_nova and origem = 'lista_antiga';
  if n <> 1 then raise exception '6b falhou: origem não registrada'; end if;
  select count(*) into n from public.crm_oportunidades where pessoa_id = v_nova and etapa = 'nova' and fechada_em is null;
  if n <> 1 then raise exception '6c falhou: oportunidade não aberta'; end if;
  select count(*) into n from public.pessoa_contatos where pessoa_id = v_a and valor = '54900005555';
  if n <> 1 then raise exception '6d falhou: telefone novo não completou a ficha existente'; end if;
  select nome into t from public.pessoas where id = v_a;
  if t <> 'Ana Teste Fusão (fictícia)' then raise exception '6e falhou: importação sobrescreveu o nome'; end if;
  select jsonb_array_length(resultado) into n from public.crm_importacoes where id = v_imp;
  if n <> 4 then raise exception '6f falhou: resultado por linha incompleto'; end if;
  select count(*) into n from public.crm_consentimentos where pessoa_id = v_nova;
  if n <> 0 then raise exception '6g falhou: registrou permissão sem a equipe marcar'; end if;

  -- 7. radar: tarefa de agradecimento não duplica
  select r.evento_id, r.pessoa_id into v_ev, v_p from public.crm_radar(730) r where r.pessoa_id is not null limit 1;
  if v_ev is not null then
    j := public.crm_radar_acionar(v_ev, array[v_p], 'agradecer');
    if (j ->> 'criadas')::int <> 1 then raise exception '7 falhou: tarefa do radar não criada (%)', j; end if;
    j := public.crm_radar_acionar(v_ev, array[v_p], 'agradecer');
    if (j ->> 'ja_existiam')::int <> 1 then raise exception '7b falhou: radar duplicou tarefa (%)', j; end if;
    j := public.crm_radar_acionar(v_ev, array[v_a], 'agradecer');
    if (j ->> 'ignoradas')::int <> 1 then raise exception '7c falhou: radar aceitou quem não foi ao encontro'; end if;
  end if;

  -- 8. conta comum não usa nada disso
  perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
  select count(*) into n from public.crm_duplicadas();
  if n <> 0 then raise exception '8 falhou: conta comum viu repetidas'; end if;
  select count(*) into n from public.crm_radar(730);
  if n <> 0 then raise exception '8b falhou: conta comum viu o radar'; end if;
  select count(*) into n from public.crm_fusoes;
  if n <> 0 then raise exception '8c falhou: conta comum leu auditoria'; end if;
  begin
    perform public.crm_fundir_pessoas(v_a, v_c, 'invasão');
    raise exception '8d falhou: conta comum uniu fichas';
  exception when others then
    if sqlerrm not like 'Apenas a administração%' then raise; end if;
  end;
  begin
    perform * from public.crm_importar_previa('[]'::jsonb);
    raise exception '8e falhou: conta comum usou o importador';
  exception when others then
    if sqlerrm not like 'Apenas a administração%' then raise; end if;
  end;

  raise exception 'CRM FASE 2 OK: 8 grupos de testes passaram (radar testado: %; nada foi gravado)', (v_ev is not null);
end $$;
