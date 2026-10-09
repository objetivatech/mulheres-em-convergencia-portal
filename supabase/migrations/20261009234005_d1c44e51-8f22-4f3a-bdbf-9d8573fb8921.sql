alter table public.negocio_avaliacoes add column if not exists pessoa_id uuid references public.pessoas(id) on delete set null;
alter table public.negocio_avaliacoes add column if not exists atualizado_em timestamptz not null default now();
create unique index if not exists idx_negocio_avaliacoes_pessoa on public.negocio_avaliacoes(negocio_id, pessoa_id) where pessoa_id is not null;
alter table public.negocio_avaliacoes alter column status set default 'aprovado';

drop policy if exists negocio_avaliacoes_enviar on public.negocio_avaliacoes;
drop policy if exists negocio_avaliacoes_moderar on public.negocio_avaliacoes;
revoke insert, update on public.negocio_avaliacoes from anon;
grant select on public.negocio_avaliacoes to anon;
grant select, insert, update, delete on public.negocio_avaliacoes to authenticated;
grant all on public.negocio_avaliacoes to service_role;

create policy negocio_avaliacoes_enviar on public.negocio_avaliacoes
  for insert to authenticated
  with check (
    pessoa_id = public.pessoa_atual()
    and status = 'aprovado'
    and exists (select 1 from public.negocios n where n.id = negocio_id and n.publicado
                and (n.pessoa_id is null or n.pessoa_id <> public.pessoa_atual()))
  );
create policy negocio_avaliacoes_minha_select on public.negocio_avaliacoes
  for select to authenticated using (pessoa_id = public.pessoa_atual());
create policy negocio_avaliacoes_minha_update on public.negocio_avaliacoes
  for update to authenticated
  using (pessoa_id = public.pessoa_atual() and status = 'aprovado')
  with check (pessoa_id = public.pessoa_atual() and status = 'aprovado');
create policy negocio_avaliacoes_admin_update on public.negocio_avaliacoes
  for update to authenticated using (public.e_admin()) with check (public.e_admin());

drop trigger if exists tg_negocio_avaliacoes_atualizado on public.negocio_avaliacoes;
create trigger tg_negocio_avaliacoes_atualizado before update on public.negocio_avaliacoes
  for each row execute function public.tg_set_atualizado_em();

create or replace function public.tg_valida_avaliacao()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.nota < 1 or new.nota > 5 then raise exception 'A nota vai de 1 a 5 estrelas'; end if;
  new.comentario := nullif(left(trim(coalesce(new.comentario,'')), 1000), '');
  new.avaliador_nome := left(trim(new.avaliador_nome), 80);
  return new;
end $$;
drop trigger if exists tg_negocio_avaliacoes_valida on public.negocio_avaliacoes;
create trigger tg_negocio_avaliacoes_valida before insert or update on public.negocio_avaliacoes
  for each row execute function public.tg_valida_avaliacao();

create table if not exists public.embaixadora_campanhas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  mensagem text not null default '',
  link_url text,
  imagens text[] not null default '{}',
  inicio_em timestamptz,
  fim_em timestamptz,
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
grant select, insert, update, delete on public.embaixadora_campanhas to authenticated;
grant all on public.embaixadora_campanhas to service_role;
alter table public.embaixadora_campanhas enable row level security;
create policy campanhas_admin on public.embaixadora_campanhas
  for all to authenticated using (public.e_admin()) with check (public.e_admin());
create policy campanhas_embaixadoras on public.embaixadora_campanhas
  for select to authenticated
  using (ativo and public.tenho_acesso('area_embaixadora'::public.acesso_tipo)
         and (inicio_em is null or inicio_em <= now()) and (fim_em is null or fim_em > now()));
create trigger tg_embaixadora_campanhas_atualizado before update on public.embaixadora_campanhas
  for each row execute function public.tg_set_atualizado_em();