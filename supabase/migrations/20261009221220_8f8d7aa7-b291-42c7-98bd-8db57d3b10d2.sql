alter view if exists public.v_evento_vagas set (security_invoker = true);
revoke execute on function public.tenho_acesso(public.acesso_tipo) from public, anon;
grant execute on function public.tenho_acesso(public.acesso_tipo) to authenticated;
drop policy if exists prt_sem_acesso on public.password_reset_tokens;
create policy prt_sem_acesso on public.password_reset_tokens as restrictive for all to anon, authenticated using (false) with check (false);

create table public.menu_itens (
  id uuid primary key default gen_random_uuid(),
  menu text not null default 'principal',
  pai_id uuid references public.menu_itens(id) on delete cascade,
  rotulo text not null,
  url text not null default '#',
  ordem integer not null default 0,
  ativo boolean not null default true,
  nova_aba boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
grant select on public.menu_itens to anon;
grant select, insert, update, delete on public.menu_itens to authenticated;
grant all on public.menu_itens to service_role;
alter table public.menu_itens enable row level security;
create policy menu_itens_leitura on public.menu_itens for select to anon, authenticated using (ativo or public.e_admin());
create policy menu_itens_admin on public.menu_itens for all to authenticated using (public.e_admin()) with check (public.e_admin());
create index menu_itens_menu_idx on public.menu_itens(menu, pai_id, ordem);
create trigger menu_itens_atualizado before update on public.menu_itens for each row execute function public.tg_set_atualizado_em();

create or replace function public.tg_valida_menu_nivel() returns trigger language plpgsql set search_path = public as $$
declare _nivel int := 0; _p uuid := new.pai_id;
begin
  while _p is not null loop
    _nivel := _nivel + 1;
    if _nivel > 2 then raise exception 'O menu aceita no máximo dois níveis de submenu'; end if;
    select pai_id into _p from public.menu_itens where id = _p;
  end loop;
  return new;
end $$;
create trigger menu_itens_nivel before insert or update on public.menu_itens for each row execute function public.tg_valida_menu_nivel();

insert into public.menu_itens (menu, rotulo, url, ordem) values
 ('principal','Início','/',1),('principal','Diretório','/diretorio',2),('principal','Convergindo','/convergindo',3),
 ('principal','Academy','/academy',4),('principal','Eventos','/eventos',5),('principal','Sobre','/sobre',6),
 ('institucional','Sobre','/sobre',1),('institucional','Contato','/contato',2),('institucional','Termos de uso','/termos-de-uso',3),
 ('institucional','Política de privacidade','/politica-de-privacidade',4),('institucional','Política de cookies','/politica-de-cookies',5);