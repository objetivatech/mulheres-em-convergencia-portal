create table public.evento_tipos_ingresso (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  nome text not null,
  descricao text,
  valor_centavos integer not null default 0,
  vagas integer,
  inicio_em timestamptz,
  fim_em timestamptz,
  ordem integer not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index on public.evento_tipos_ingresso(evento_id);
grant select on public.evento_tipos_ingresso to anon;
grant select, insert, update, delete on public.evento_tipos_ingresso to authenticated;
grant all on public.evento_tipos_ingresso to service_role;
alter table public.evento_tipos_ingresso enable row level security;
create policy evento_tipos_admin_all on public.evento_tipos_ingresso for all to authenticated using (private.e_admin()) with check (private.e_admin());
create policy evento_tipos_public_select on public.evento_tipos_ingresso for select to anon, authenticated using (exists (select 1 from public.eventos e where e.id = evento_id and (e.publicado or private.e_admin())));
create trigger tg_evento_tipos_atualizado before update on public.evento_tipos_ingresso for each row execute function public.tg_set_atualizado_em();

alter table public.evento_inscricoes add column tipo_ingresso_id uuid references public.evento_tipos_ingresso(id) on delete set null;
create index on public.evento_inscricoes(tipo_ingresso_id);

create or replace function private.validar_tipo_ingresso() returns trigger language plpgsql security definer set search_path to 'public' as $$
declare t public.evento_tipos_ingresso; usadas bigint;
begin
 if new.tipo_ingresso_id is null or new.situacao not in ('confirmada','pendente') then return new; end if;
 if tg_op='UPDATE' and old.situacao in ('confirmada','pendente') and new.tipo_ingresso_id is not distinct from old.tipo_ingresso_id then return new; end if;
 select * into t from public.evento_tipos_ingresso where id=new.tipo_ingresso_id for update;
 if t.evento_id<>new.evento_id or not t.ativo or (t.inicio_em is not null and t.inicio_em>now()) or (t.fim_em is not null and t.fim_em<=now()) then raise exception 'Este tipo de ingresso não está disponível.'; end if;
 select count(*) into usadas from public.evento_inscricoes where tipo_ingresso_id=new.tipo_ingresso_id and id<>new.id and situacao in ('confirmada','pendente');
 if t.vagas is not null and usadas>=t.vagas then raise exception 'As vagas deste tipo de ingresso já foram preenchidas.'; end if;
 return new;
end $$;
create trigger ab_validar_tipo_ingresso before insert or update on public.evento_inscricoes for each row execute function private.validar_tipo_ingresso();

create or replace function private.reservar_ingresso_evento_tipo(_evento_id uuid, _pessoa_id uuid, _lote_id uuid, _cupom_id uuid, _nome text, _email text, _telefone text, _valor_centavos integer, _tipo_id uuid)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare existente public.evento_inscricoes; resultado uuid;
begin
 if not (auth.role() = 'service_role') then raise exception 'Não autorizado'; end if;
 perform 1 from public.eventos where id=_evento_id for update;
 select * into existente from public.evento_inscricoes where evento_id=_evento_id and pessoa_id=_pessoa_id;
 if found and existente.situacao in ('pendente','confirmada') then raise exception 'Já existe uma inscrição ou reserva para esta pessoa.'; end if;
 if existente.id is not null then
  update public.evento_inscricoes set lote_id=_lote_id,tipo_ingresso_id=_tipo_id,cupom_id=_cupom_id,nome=_nome,email=_email,telefone=_telefone,valor_centavos=_valor_centavos,situacao='pendente',pagamento_id=null,confirmacao_enviada_em=null where id=existente.id returning id into resultado;
 else
  insert into public.evento_inscricoes(evento_id,pessoa_id,lote_id,tipo_ingresso_id,cupom_id,nome,email,telefone,valor_centavos,situacao) values(_evento_id,_pessoa_id,_lote_id,_tipo_id,_cupom_id,_nome,_email,_telefone,_valor_centavos,'pendente') returning id into resultado;
 end if;
 return resultado;
end $$;
revoke all on function private.reservar_ingresso_evento_tipo(uuid,uuid,uuid,uuid,text,text,text,integer,uuid) from public, anon, authenticated;
grant execute on function private.reservar_ingresso_evento_tipo(uuid,uuid,uuid,uuid,text,text,text,integer,uuid) to service_role;
create or replace function public.reservar_ingresso_evento_tipo(_evento_id uuid, _pessoa_id uuid, _lote_id uuid, _cupom_id uuid, _nome text, _email text, _telefone text, _valor_centavos integer, _tipo_id uuid)
returns uuid language sql set search_path to 'public' as $$ select private.reservar_ingresso_evento_tipo($1,$2,$3,$4,$5,$6,$7,$8,$9) $$;
revoke all on function public.reservar_ingresso_evento_tipo(uuid,uuid,uuid,uuid,text,text,text,integer,uuid) from public, anon, authenticated;
grant execute on function public.reservar_ingresso_evento_tipo(uuid,uuid,uuid,uuid,text,text,text,integer,uuid) to service_role;