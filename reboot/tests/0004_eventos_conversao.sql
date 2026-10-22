-- Aceitação em subtransação: dados de teste são sempre desfeitos.
do $$
declare ev uuid:=gen_random_uuid(); pessoa uuid:=gen_random_uuid(); ins uuid; total bigint; livres bigint; bloqueou boolean:=false;
begin
 begin
  insert into public.pessoas(id,nome) values(pessoa,'Teste de capacidade');
  insert into public.eventos(id,slug,titulo,inicio_em,publicado,gratuito,vagas,ingressos_vendidos_inicial) values(ev,'teste-capacidade-'||ev,'Teste',now()+interval '20 days',true,true,50,20);
  select ocupadas,disponiveis into total,livres from public.v_evento_vagas where evento_id=ev;
  if total<>20 or livres<>30 then raise exception 'Base: esperado 20 ocupadas e 30 disponíveis, encontrado % / %',total,livres; end if;
  insert into public.evento_inscricoes(evento_id,pessoa_id,nome,email,valor_centavos,situacao) values(ev,pessoa,'Teste','capacity-test@example.invalid',0,'confirmada') returning id into ins;
  select ocupadas,disponiveis into total,livres from public.v_evento_vagas where evento_id=ev;
  if total<>21 or livres<>29 then raise exception 'Confirmação deve somar à base'; end if;
  update public.eventos set ingressos_vendidos_inicial=49 where id=ev;
  begin
   insert into public.evento_inscricoes(evento_id,nome,email,valor_centavos,situacao) values(ev,'Teste bloqueado','blocked@example.invalid',0,'confirmada');
  exception when raise_exception then bloqueou:=true;
  end;
  if not bloqueou then raise exception 'Evento cheio aceitou inscrição'; end if;
  perform public.entrar_espera_evento(ev,'Pessoa em espera','wait@example.invalid');
  if (select count(*) from public.evento_lista_espera where evento_id=ev)<>1 then raise exception 'Espera não registrada'; end if;
  perform public.entrar_espera_evento(ev,'Pessoa em espera','WAIT@example.invalid');
  if (select count(*) from public.evento_lista_espera where evento_id=ev)<>1 then raise exception 'Espera duplicada'; end if;
  raise exception using errcode='ZX001',message='Testes passaram: desfazer dados';
 exception when sqlstate 'ZX001' then null;
 end;
end $$;