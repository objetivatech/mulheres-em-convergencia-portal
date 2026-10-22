create or replace function private.reservar_ingresso_evento(_evento_id uuid,_pessoa_id uuid,_lote_id uuid,_cupom_id uuid,_nome text,_email text,_telefone text,_valor_centavos integer) returns uuid
language plpgsql security definer set search_path=public as $$
declare existente public.evento_inscricoes; resultado uuid;
begin
 perform 1 from public.eventos where id=_evento_id for update;
 select * into existente from public.evento_inscricoes where evento_id=_evento_id and pessoa_id=_pessoa_id;
 if found and existente.situacao in ('pendente','confirmada') then raise exception 'Já existe uma inscrição ou reserva para esta pessoa.'; end if;
 if existente.id is not null then
 update public.evento_inscricoes set lote_id=_lote_id,cupom_id=_cupom_id,nome=_nome,email=_email,telefone=_telefone,valor_centavos=_valor_centavos,situacao='pendente',pagamento_id=null,confirmacao_enviada_em=null where id=existente.id returning id into resultado;
 else
 insert into public.evento_inscricoes(evento_id,pessoa_id,lote_id,cupom_id,nome,email,telefone,valor_centavos,situacao) values(_evento_id,_pessoa_id,_lote_id,_cupom_id,_nome,_email,_telefone,_valor_centavos,'pendente') returning id into resultado;
 end if;
 return resultado;
end $$;
revoke all on function private.reservar_ingresso_evento(uuid,uuid,uuid,uuid,text,text,text,integer) from public,anon,authenticated;
grant execute on function private.reservar_ingresso_evento(uuid,uuid,uuid,uuid,text,text,text,integer) to service_role;
create or replace function public.reservar_ingresso_evento(_evento_id uuid,_pessoa_id uuid,_lote_id uuid,_cupom_id uuid,_nome text,_email text,_telefone text,_valor_centavos integer) returns uuid
language sql security invoker set search_path=public as $$select private.reservar_ingresso_evento($1,$2,$3,$4,$5,$6,$7,$8)$$;
revoke all on function public.reservar_ingresso_evento(uuid,uuid,uuid,uuid,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.reservar_ingresso_evento(uuid,uuid,uuid,uuid,text,text,text,integer) to service_role;

create or replace function private.sincronizar_ingresso_pagamento() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 if new.situacao='confirmado' then
 update public.evento_inscricoes set situacao='confirmada' where pagamento_id=new.id and situacao<>'confirmada';
 elsif new.situacao in ('cancelado','estornado') then
 update public.evento_inscricoes set situacao='cancelada' where pagamento_id=new.id and situacao<>'cancelada';
 end if;
 return new;
end $$;
create trigger sincronizar_ingresso_pagamento after update of situacao on public.pagamentos for each row execute function private.sincronizar_ingresso_pagamento();
create or replace function private.sincronizar_ingresso_vinculo() returns trigger
language plpgsql security definer set search_path=public as $$
declare estado public.pagamento_situacao;
begin
 if new.pagamento_id is not null then
 select situacao into estado from public.pagamentos where id=new.pagamento_id;
 if estado='confirmado' then new.situacao:='confirmada'; elsif estado in ('cancelado','estornado') then new.situacao:='cancelada'; end if;
 end if;
 return new;
end $$;
create trigger aa_sincronizar_ingresso_vinculo before insert or update of pagamento_id on public.evento_inscricoes for each row execute function private.sincronizar_ingresso_vinculo();
revoke all on function private.sincronizar_ingresso_pagamento() from public;
revoke all on function private.sincronizar_ingresso_vinculo() from public;