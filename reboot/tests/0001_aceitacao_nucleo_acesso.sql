-- =====================================================================
-- Testes de aceitação — Núcleo de Acesso
-- Destino: SQL Editor do projeto NOVO (tysvpeprhokdijquprkd).
-- Pré-requisito: reboot/sql/0001_nucleo_acesso.sql já aplicado.
--
-- Os 7 testes abaixo são os definidos em docs/_reboot/02-nucleo-acesso.md.
-- Cada teste levanta exceção com mensagem clara se falhar; se o script
-- chegar ao fim, todos passaram. Ao final, todos os dados de teste são
-- removidos (pessoas de CPF 9000000000x).
--
-- Como rodar: colar inteiro no SQL Editor e executar uma única vez.
-- Pode ser reexecutado — a limpeza inicial remove restos de rodadas
-- anteriores.
-- =====================================================================

begin;

-- Limpeza de rodadas anteriores (ordem respeita as FKs)
delete from public.concessoes_acesso
  where pessoa_id in (select id from public.pessoas where cpf like '9000000000%');
delete from public.pagamentos
  where cobranca_externa_id like 'teste_%';
delete from public.pessoa_contatos
  where pessoa_id in (select id from public.pessoas where cpf like '9000000000%');
delete from public.pessoas where cpf like '9000000000%';

-- ---------------------------------------------------------------------
-- Teste 1 — Pagamento em dia → concessão de 31 dias, acesso vigente
-- ---------------------------------------------------------------------
do $$
declare
  v_pessoa uuid; v_pag uuid; v_concessao uuid;
begin
  insert into public.pessoas (cpf, nome) values ('90000000001', 'Teste 1 Em Dia') returning id into v_pessoa;
  insert into public.pagamentos (pessoa_id, cobranca_externa_id, valor_centavos, situacao, confirmado_em)
    values (v_pessoa, 'teste_1', 9700, 'confirmado', now()) returning id into v_pag;

  v_concessao := public.conceder_por_pagamento(v_pag, 'diretorio', 31);

  if v_concessao is null then
    raise exception 'TESTE 1 FALHOU: concessão não foi criada';
  end if;
  if not public.acesso_vigente(v_pessoa, 'diretorio') then
    raise exception 'TESTE 1 FALHOU: acesso deveria estar vigente';
  end if;
  if not exists (
    select 1 from public.concessoes_acesso
    where id = v_concessao and fim_em between inicio_em + interval '30 days' and inicio_em + interval '32 days'
  ) then
    raise exception 'TESTE 1 FALHOU: janela não é de ~31 dias';
  end if;
  raise notice 'TESTE 1 OK';
end $$;

-- ---------------------------------------------------------------------
-- Teste 2 — Pagamento 7 dias APÓS o vencimento → concessão nova a partir
-- do dia do pagamento; acesso volta sem intervenção (caso Luciana)
-- ---------------------------------------------------------------------
do $$
declare
  v_pessoa uuid; v_pag uuid; v_concessao uuid;
  v_inicio timestamptz;
begin
  insert into public.pessoas (cpf, nome) values ('90000000002', 'Teste 2 Atraso') returning id into v_pessoa;
  -- cobrança vencia há 7 dias; pagamento confirmado agora
  insert into public.pagamentos (pessoa_id, cobranca_externa_id, valor_centavos, situacao, vencimento_em, confirmado_em)
    values (v_pessoa, 'teste_2', 9700, 'confirmado', current_date - 7, now()) returning id into v_pag;

  v_concessao := public.conceder_por_pagamento(v_pag, 'diretorio', 31);

  if v_concessao is null then
    raise exception 'TESTE 2 FALHOU: concessão não foi criada para pagamento em atraso';
  end if;
  select inicio_em into v_inicio from public.concessoes_acesso where id = v_concessao;
  if v_inicio < now() - interval '1 hour' then
    raise exception 'TESTE 2 FALHOU: concessão deveria começar no dia do pagamento, não na data de vencimento';
  end if;
  if not public.acesso_vigente(v_pessoa, 'diretorio') then
    raise exception 'TESTE 2 FALHOU: acesso deveria ter voltado imediatamente';
  end if;
  raise notice 'TESTE 2 OK';
end $$;

-- ---------------------------------------------------------------------
-- Teste 3 — Assinatura nova, pagamento confirmado → concessão criada
-- mesmo sem nenhum outro dado cadastrado (caso Paola)
-- ---------------------------------------------------------------------
do $$
declare
  v_pessoa uuid; v_pag uuid;
begin
  insert into public.pessoas (cpf, nome) values ('90000000003', 'Teste 3 Nova') returning id into v_pessoa;
  insert into public.pagamentos (pessoa_id, cobranca_externa_id, assinatura_externa_id, valor_centavos, situacao, confirmado_em)
    values (v_pessoa, 'teste_3', 'sub_teste_3', 9700, 'confirmado', now()) returning id into v_pag;

  if public.conceder_por_pagamento(v_pag, 'diretorio', 31) is null then
    raise exception 'TESTE 3 FALHOU: concessão não foi criada';
  end if;
  if not public.acesso_vigente(v_pessoa, 'diretorio') then
    raise exception 'TESTE 3 FALHOU: acesso deveria estar vigente';
  end if;
  raise notice 'TESTE 3 OK';
end $$;

-- ---------------------------------------------------------------------
-- Teste 4 — Mesmo pagamento processado 3 vezes → 1 pagamento, 1 concessão
-- ---------------------------------------------------------------------
do $$
declare
  v_pessoa uuid; v_pag uuid;
  v_qtd_pag int; v_qtd_conc int;
begin
  insert into public.pessoas (cpf, nome) values ('90000000004', 'Teste 4 Repetido') returning id into v_pessoa;

  -- simula o upsert idempotente do webhook: mesma cobrança 3 vezes
  for i in 1..3 loop
    insert into public.pagamentos (pessoa_id, cobranca_externa_id, valor_centavos, situacao, confirmado_em)
      values (v_pessoa, 'teste_4', 9700, 'confirmado', now())
      on conflict (provedor, cobranca_externa_id) do nothing;
  end loop;

  select id into v_pag from public.pagamentos where cobranca_externa_id = 'teste_4';
  for i in 1..3 loop
    perform public.conceder_por_pagamento(v_pag, 'diretorio', 31);
  end loop;

  select count(*) into v_qtd_pag from public.pagamentos where cobranca_externa_id = 'teste_4';
  select count(*) into v_qtd_conc from public.concessoes_acesso where pagamento_id = v_pag;

  if v_qtd_pag <> 1 or v_qtd_conc <> 1 then
    raise exception 'TESTE 4 FALHOU: esperado 1 pagamento e 1 concessão, obtido % e %', v_qtd_pag, v_qtd_conc;
  end if;
  raise notice 'TESTE 4 OK';
end $$;

-- ---------------------------------------------------------------------
-- Teste 5 — Cortesia → permanente, vigente, exige motivo
-- ---------------------------------------------------------------------
do $$
declare
  v_pessoa uuid;
begin
  insert into public.pessoas (cpf, nome) values ('90000000005', 'Teste 5 Cortesia') returning id into v_pessoa;

  -- cortesia sem motivo deve ser recusada
  begin
    insert into public.concessoes_acesso (pessoa_id, tipo, origem, fim_em)
      values (v_pessoa, 'diretorio', 'cortesia', null);
    raise exception 'TESTE 5 FALHOU: cortesia sem motivo foi aceita';
  exception when check_violation then
    null; -- esperado
  end;

  insert into public.concessoes_acesso (pessoa_id, tipo, origem, fim_em, motivo)
    values (v_pessoa, 'diretorio', 'cortesia', null, 'Parceria institucional — teste');

  if not public.acesso_vigente(v_pessoa, 'diretorio') then
    raise exception 'TESTE 5 FALHOU: cortesia deveria estar vigente';
  end if;
  if (select fim_em from public.concessoes_acesso where pessoa_id = v_pessoa) is not null then
    raise exception 'TESTE 5 FALHOU: cortesia deveria ser permanente (fim_em nulo)';
  end if;
  raise notice 'TESTE 5 OK';
end $$;

-- ---------------------------------------------------------------------
-- Teste 6 — Três recompras da mesma pessoa → 3 concessões em sequência,
-- acesso sempre vigente, nenhuma tela divergente
-- ---------------------------------------------------------------------
do $$
declare
  v_pessoa uuid; v_pag uuid;
  v_qtd int;
begin
  insert into public.pessoas (cpf, nome) values ('90000000006', 'Teste 6 Recompra') returning id into v_pessoa;

  for i in 1..3 loop
    insert into public.pagamentos (pessoa_id, cobranca_externa_id, valor_centavos, situacao, confirmado_em)
      values (v_pessoa, 'teste_6_' || i, 9700, 'confirmado', now()) returning id into v_pag;
    perform public.conceder_por_pagamento(v_pag, 'diretorio', 31);
  end loop;

  select count(*) into v_qtd from public.concessoes_acesso where pessoa_id = v_pessoa and tipo = 'diretorio';
  if v_qtd <> 3 then
    raise exception 'TESTE 6 FALHOU: esperadas 3 concessões, obtidas %', v_qtd;
  end if;
  if not public.acesso_vigente(v_pessoa, 'diretorio') then
    raise exception 'TESTE 6 FALHOU: acesso deveria estar vigente';
  end if;
  raise notice 'TESTE 6 OK';
end $$;

-- ---------------------------------------------------------------------
-- Teste 7 — Pagamento confirmado SEM pessoa identificada → pagamento
-- registrado, nenhuma concessão, nenhum erro (conciliação manual depois)
-- Equivalente em SQL ao "efeito que falha não derruba o acesso": aqui o
-- que se garante é que a ausência de efeito colateral não quebra o fluxo.
-- ---------------------------------------------------------------------
do $$
declare
  v_pag uuid; v_result uuid;
begin
  insert into public.pagamentos (cobranca_externa_id, valor_centavos, situacao, confirmado_em)
    values ('teste_7', 9700, 'confirmado', now()) returning id into v_pag;

  v_result := public.conceder_por_pagamento(v_pag, 'diretorio', 31);

  if v_result is not null then
    raise exception 'TESTE 7 FALHOU: concessão criada sem pessoa identificada';
  end if;
  if not exists (select 1 from public.pagamentos where id = v_pag) then
    raise exception 'TESTE 7 FALHOU: pagamento deveria permanecer registrado';
  end if;
  raise notice 'TESTE 7 OK';
end $$;

-- ---------------------------------------------------------------------
-- Verificação bônus — situacao_acesso responde coerentemente
-- ---------------------------------------------------------------------
do $$
declare
  v_pessoa uuid; v record;
begin
  select id into v_pessoa from public.pessoas where cpf = '90000000001';
  select * into v from public.situacao_acesso(v_pessoa, 'diretorio');
  if not v.vigente or v.origem <> 'pagamento' then
    raise exception 'BÔNUS FALHOU: situacao_acesso incoerente: %', v;
  end if;
  raise notice 'BÔNUS OK (situacao_acesso)';
end $$;

-- ---------------------------------------------------------------------
-- Limpeza final
-- ---------------------------------------------------------------------
delete from public.concessoes_acesso
  where pessoa_id in (select id from public.pessoas where cpf like '9000000000%');
delete from public.pagamentos where cobranca_externa_id like 'teste_%';
delete from public.pessoa_contatos
  where pessoa_id in (select id from public.pessoas where cpf like '9000000000%');
delete from public.pessoas where cpf like '9000000000%';

commit;

-- Se chegou aqui sem exceção: TODOS OS 7 TESTES PASSARAM.
