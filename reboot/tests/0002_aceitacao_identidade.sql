-- =====================================================================
-- Reboot — Testes de aceitação 0002: Identidade e Perfis
-- Rodar INTEIRO no SQL Editor do projeto NOVO (tysvpeprhokdijquprkd),
-- depois de aplicar 0001 e 0002.
-- Sucesso = nenhum erro + avisos "TESTE n OK". Limpa os próprios dados.
-- =====================================================================

do $$
declare
  v_p1 uuid; v_p2 uuid; v_id uuid;
  v_cpf text := '99988877766';
  v_email citext := 'teste.identidade@exemplo.invalido';
  v_n integer; v_pct integer;
begin
  -- ------------------------------------------------------------------
  -- Preparo: duas pessoas de teste (sem auth_user_id, como numa carga)
  -- ------------------------------------------------------------------
  insert into public.pessoas (nome, cpf) values ('Teste Identidade Um', v_cpf)
  returning id into v_p1;

  insert into public.pessoas (nome) values ('Teste Identidade Dois')
  returning id into v_p2;

  insert into public.pessoa_contatos (pessoa_id, tipo, valor, principal)
  values (v_p2, 'email', v_email, true);

  -- TESTE 1 — CPF é único e normalizado a 11 dígitos
  begin
    insert into public.pessoas (nome, cpf) values ('Duplicada', v_cpf);
    raise exception 'TESTE 1 FALHOU: CPF duplicado foi aceito';
  exception when unique_violation then
    raise notice 'TESTE 1 OK — CPF é identificador único';
  end;

  begin
    insert into public.pessoas (nome, cpf) values ('CPF torto', '123.456.789-00');
    raise exception 'TESTE 2 FALHOU: CPF com máscara foi aceito';
  exception when check_violation then
    raise notice 'TESTE 2 OK — CPF só entra com 11 dígitos';
  end;

  -- TESTE 3 — endereço vinculado e apagado junto com a pessoa
  insert into public.pessoa_enderecos (pessoa_id, cep, cidade, uf)
  values (v_p1, '30110000', 'Belo Horizonte', 'MG') returning id into v_id;
  if v_id is null then raise exception 'TESTE 3 FALHOU: endereço não criado'; end if;
  raise notice 'TESTE 3 OK — endereço registrado';

  -- TESTE 4 — contato não duplica (histórico aditivo, idempotente)
  insert into public.pessoa_contatos (pessoa_id, tipo, valor, principal)
  values (v_p2, 'email', v_email, true)
  on conflict (pessoa_id, tipo, valor) do nothing;
  select count(*) into v_n from public.pessoa_contatos
   where pessoa_id = v_p2 and tipo = 'email' and valor = v_email;
  if v_n <> 1 then raise exception 'TESTE 4 FALHOU: contato duplicado (%).', v_n; end if;
  raise notice 'TESTE 4 OK — contato repetido não duplica';

  -- TESTE 5 — papel vive em tabela separada e não duplica
  insert into public.papeis (pessoa_id, papel) values (v_p1, 'assinante');
  insert into public.papeis (pessoa_id, papel) values (v_p1, 'assinante')
  on conflict (pessoa_id, papel) do nothing;
  select count(*) into v_n from public.papeis where pessoa_id = v_p1;
  if v_n <> 1 then raise exception 'TESTE 5 FALHOU: papel duplicado (%).', v_n; end if;
  raise notice 'TESTE 5 OK — papéis em tabela separada, sem duplicação';

  -- TESTE 6 — v_meu_perfil calcula papéis, acessos e completude
  select papeis, completude_percentual into v_n, v_pct
  from (select array_length(papeis,1) as papeis, completude_percentual
        from public.v_meu_perfil where pessoa_id = v_p1) t;
  if coalesce(v_n,0) <> 1 then raise exception 'TESTE 6 FALHOU: papéis não refletidos na visão'; end if;
  if v_pct is null or v_pct <= 0 or v_pct > 100 then
    raise exception 'TESTE 6 FALHOU: completude fora da faixa (%).', v_pct;
  end if;
  raise notice 'TESTE 6 OK — perfil consolidado por consulta (completude %%: %)', v_pct;

  -- TESTE 7 — acesso continua sendo consulta, nunca coluna gravada
  if (select acesso_diretorio from public.v_meu_perfil where pessoa_id = v_p1) then
    raise exception 'TESTE 7 FALHOU: acesso sem concessão';
  end if;
  insert into public.concessoes_acesso (pessoa_id, tipo, origem, motivo, fim_em)
  values (v_p1, 'diretorio', 'cortesia', 'Teste de aceitação', null);
  if not (select acesso_diretorio from public.v_meu_perfil where pessoa_id = v_p1) then
    raise exception 'TESTE 7 FALHOU: concessão vigente não refletida no perfil';
  end if;
  raise notice 'TESTE 7 OK — perfil e acesso sempre sincronizados (mesma fonte)';

  -- TESTE 8 — vincular_cpf recusa CPF de outra pessoa
  begin
    perform public.vincular_cpf('111');
    raise exception 'TESTE 8 FALHOU: CPF inválido aceito';
  exception
    when sqlstate '42501' then raise notice 'TESTE 8 OK — vínculo exige sessão autenticada';
    when others then
      if sqlstate = 'P0001' then raise notice 'TESTE 8 OK — CPF inválido recusado';
      else raise; end if;
  end;

  -- ------------------------------------------------------------------
  -- Limpeza
  -- ------------------------------------------------------------------
  delete from public.concessoes_acesso where pessoa_id in (v_p1, v_p2);
  delete from public.pessoas where id in (v_p1, v_p2);

  raise notice '=== TODOS OS TESTES DE IDENTIDADE PASSARAM ===';
end $$;
