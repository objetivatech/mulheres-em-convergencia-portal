alter table public.eventos add column ingressos_vendidos_inicial integer not null default 0;

create or replace function private.evento_ocupacao(_evento_id uuid)
returns table(ocupadas bigint, reservadas bigint)
language sql stable security definer set search_path = public as $$
 select e.ingressos_vendidos_inicial::bigint + count(i.id) filter(where i.situacao='confirmada'), count(i.id) filter(where i.situacao='pendente')
 from public.eventos e left join public.evento_inscricoes i on i.evento_id=e.id
 where e.id=_evento_id and (e.publicado or private.e_admin() or auth.role()='service_role') group by e.id;
$$;
revoke all on function private.evento_ocupacao(uuid) from public;
grant execute on function private.evento_ocupacao(uuid) to anon, authenticated, service_role;
create or replace view public.v_evento_vagas with (security_invoker=true) as
 select e.id evento_id,e.vagas,o.ocupadas,
 case when e.vagas is null then null::bigint else greatest(e.vagas-o.ocupadas,0::bigint) end disponiveis,
 o.reservadas,case when e.vagas is null then null::bigint else greatest(e.vagas-o.ocupadas-o.reservadas,0::bigint) end livres_para_reserva
 from public.eventos e cross join lateral private.evento_ocupacao(e.id) o;
grant select on public.v_evento_vagas to anon,authenticated,service_role;

create or replace function private.validar_evento_base() returns trigger
language plpgsql security definer set search_path=public as $$
declare utilizadas bigint;
begin
 if new.ingressos_vendidos_inicial<0 or (new.vagas is not null and new.vagas<1) then raise exception 'Informe quantidades inteiras positivas; a base pode ser zero.'; end if;
 if tg_op='UPDATE' then select count(*) into utilizadas from public.evento_inscricoes where evento_id=new.id and situacao in ('confirmada','pendente'); else utilizadas:=0; end if;
 if new.vagas is not null and new.ingressos_vendidos_inicial+utilizadas>new.vagas then raise exception 'A capacidade não pode ser menor que as vagas já ocupadas ou reservadas.'; end if;
 return new;
end $$;
create trigger validar_evento_base before insert or update of vagas,ingressos_vendidos_inicial on public.eventos for each row execute function private.validar_evento_base();

create or replace function private.validar_reserva_evento() returns trigger
language plpgsql security definer set search_path=public as $$
declare ev public.eventos; lt public.evento_lotes; usadas bigint; no_lote bigint;
begin
 if tg_op='UPDATE' and new.evento_id<>old.evento_id then raise exception 'Não é possível transferir a inscrição para outro evento.'; end if;
 select * into ev from public.eventos where id=new.evento_id for update;
 if new.situacao not in ('confirmada','pendente') then return new; end if;
 if tg_op='UPDATE' and old.situacao in ('confirmada','pendente') and new.lote_id is not distinct from old.lote_id then return new; end if;
 if not ev.publicado or ev.inicio_em<=now() then raise exception 'As inscrições deste encontro estão encerradas.'; end if;
 select count(*) into usadas from public.evento_inscricoes where evento_id=new.evento_id and id<>new.id and situacao in ('confirmada','pendente');
 if ev.vagas is not null and ev.ingressos_vendidos_inicial+usadas>=ev.vagas then raise exception 'As vagas deste encontro já foram preenchidas ou reservadas.'; end if;
 if new.lote_id is not null then
  select * into lt from public.evento_lotes where id=new.lote_id;
  if lt.evento_id<>new.evento_id or not lt.ativo or (lt.inicio_em is not null and lt.inicio_em>now()) or (lt.fim_em is not null and lt.fim_em<=now()) then raise exception 'Este lote não está disponível.'; end if;
  select count(*) into no_lote from public.evento_inscricoes where lote_id=new.lote_id and id<>new.id and situacao in ('confirmada','pendente');
  if lt.vagas is not null and no_lote>=lt.vagas then raise exception 'As vagas deste lote já foram preenchidas.'; end if;
 end if;
 return new;
end $$;
create trigger validar_reserva_evento before insert or update on public.evento_inscricoes for each row execute function private.validar_reserva_evento();
revoke all on function private.validar_evento_base() from public;
revoke all on function private.validar_reserva_evento() from public;

create table public.evento_lista_espera(
 id uuid primary key default gen_random_uuid(),evento_id uuid not null references public.eventos(id) on delete cascade,
 nome text not null,email text not null,criado_em timestamptz not null default now(),atualizado_em timestamptz not null default now(),unique(evento_id,email)
);
grant select,update,delete on public.evento_lista_espera to authenticated;
grant all on public.evento_lista_espera to service_role;
alter table public.evento_lista_espera enable row level security;
create policy espera_admin on public.evento_lista_espera for all to authenticated using(private.e_admin()) with check(private.e_admin());
create trigger espera_atualizado before update on public.evento_lista_espera for each row execute function public.tg_set_atualizado_em();
create or replace function private.entrar_espera_evento(_evento_id uuid,_nome text,_email text) returns boolean
language plpgsql security definer set search_path=public as $$
declare ev public.eventos; usadas bigint;
begin
 _nome:=trim(_nome); _email:=lower(trim(_email));
 if length(_nome)<2 or length(_nome)>160 or length(_email)>254 or _email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Preencha seu nome e um e-mail válido.'; end if;
 select * into ev from public.eventos where id=_evento_id and publicado and inicio_em>now();
 if not found or ev.vagas is null then raise exception 'A lista de espera não está disponível para este encontro.'; end if;
 select count(*) into usadas from public.evento_inscricoes where evento_id=ev.id and situacao='confirmada';
 if ev.ingressos_vendidos_inicial+usadas<ev.vagas then raise exception 'Ainda há vagas. Faça sua inscrição no encontro.'; end if;
 insert into public.evento_lista_espera(evento_id,nome,email) values(ev.id,_nome,_email) on conflict(evento_id,email) do nothing;
 return true;
end $$;
revoke all on function private.entrar_espera_evento(uuid,text,text) from public;
grant execute on function private.entrar_espera_evento(uuid,text,text) to anon,authenticated,service_role;
create or replace function public.entrar_espera_evento(_evento_id uuid,_nome text,_email text) returns boolean
language sql security invoker set search_path=public as $$select private.entrar_espera_evento($1,$2,$3)$$;
revoke all on function public.entrar_espera_evento(uuid,text,text) from public;
grant execute on function public.entrar_espera_evento(uuid,text,text) to anon,authenticated,service_role;