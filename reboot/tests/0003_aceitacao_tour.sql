-- =====================================================================
-- Testes de aceitação — 0003 Tour guiado
-- Rodar no SQL Editor do projeto NOVO. Termina sem erro = todos passaram.
-- Cria e apaga seus próprios dados.
-- =====================================================================
do $$
declare
  v_pessoa uuid;
  v_linha public.tour_progresso;
  v_qtd integer;
begin
  insert into public.pessoas (nome)
  values ('TESTE TOUR — apagar') returning id into v_pessoa;

  -- 1) primeiro registro do tour
  insert into public.tour_progresso (pessoa_id, modulo, passo_atual)
  values (v_pessoa, 'meu-painel', 2) returning * into v_linha;
  if v_linha.concluido_em is not null then
    raise exception 'TESTE 1 FALHOU: tour novo não pode nascer concluído';
  end if;
  raise notice 'TESTE 1 OK — progresso registrado';

  -- 2) um par pessoa+modulo+versao só existe uma vez
  begin
    insert into public.tour_progresso (pessoa_id, modulo) values (v_pessoa, 'meu-painel');
    raise exception 'TESTE 2 FALHOU: duplicata aceita';
  exception when unique_violation then
    raise notice 'TESTE 2 OK — duplicata bloqueada';
  end;

  -- 3) conclusão não é desfeita por atualização posterior
  update public.tour_progresso set concluido_em = now()
   where pessoa_id = v_pessoa and modulo = 'meu-painel';
  update public.tour_progresso set passo_atual = 5
   where pessoa_id = v_pessoa and modulo = 'meu-painel';
  select count(*) into v_qtd from public.tour_progresso
   where pessoa_id = v_pessoa and modulo = 'meu-painel' and concluido_em is not null;
  if v_qtd <> 1 then
    raise exception 'TESTE 3 FALHOU: conclusão perdida';
  end if;
  raise notice 'TESTE 3 OK — conclusão preservada';

  -- 4) nova versão do tour convive com a antiga (reexibição controlada)
  insert into public.tour_progresso (pessoa_id, modulo, versao) values (v_pessoa, 'meu-painel', 2);
  select count(*) into v_qtd from public.tour_progresso
   where pessoa_id = v_pessoa and modulo = 'meu-painel';
  if v_qtd <> 2 then
    raise exception 'TESTE 4 FALHOU: versões não coexistem';
  end if;
  raise notice 'TESTE 4 OK — versão nova reexibe o tour';

  -- 5) apagar a pessoa apaga o progresso (sem lixo órfão)
  delete from public.pessoas where id = v_pessoa;
  select count(*) into v_qtd from public.tour_progresso where pessoa_id = v_pessoa;
  if v_qtd <> 0 then
    raise exception 'TESTE 5 FALHOU: progresso órfão';
  end if;
  raise notice 'TESTE 5 OK — limpeza em cascata';

  raise notice 'TODOS OS TESTES DE TOUR PASSARAM';
end $$;
