create table public.mensagens_contato (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email citext not null,
  assunto text not null,
  mensagem text not null,
  situacao text not null default 'nova',
  criado_em timestamptz not null default now()
);
grant select, update, delete on public.mensagens_contato to authenticated;
grant all on public.mensagens_contato to service_role;
alter table public.mensagens_contato enable row level security;
create policy "Equipe gerencia mensagens de contato" on public.mensagens_contato
  for all to authenticated using (public.e_admin()) with check (public.e_admin());
create index on public.mensagens_contato (email, criado_em);