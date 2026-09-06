-- =====================================================================
-- Reboot — Migration 0002: Identidade e Perfis (Fase 2)
-- Projeto de destino: tysvpeprhokdijquprkd (banco NOVO)
-- NÃO aplicar no projeto antigo (ngqymbjatenxztrjjdxa).
--
-- Idempotente: pode ser executada mais de uma vez sem efeito duplicado.
-- Depende de: 0001_nucleo_acesso.sql
--
-- Conteúdo: campos de perfil em `pessoas`, endereços, registro único de
--           pessoa no primeiro login (sem trigger em auth.*), vínculo de
--           CPF não destrutivo, gestão de papéis por administradora e a
--           visão `v_meu_perfil` que todas as telas consomem.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Campos de perfil (aditivos; nenhuma coluna existente é alterada)
-- ---------------------------------------------------------------------
alter table public.pessoas add column if not exists foto_url text;
alter table public.pessoas add column if not exists bio text;
alter table public.pessoas add column if not exists genero text;
alter table public.pessoas add column if not exists instagram text;
alter table public.pessoas add column if not exists linkedin text;
alter table public.pessoas add column if not exists site text;
alter table public.pessoas add column if not exists como_conheceu text;
alter table public.pessoas add column if not exists aceite_termos_em timestamptz;
alter table public.pessoas add column if not exists ultimo_acesso_em timestamptz;

drop trigger if exists tg_pessoas_atualizado_em on public.pessoas;
create trigger tg_pessoas_atualizado_em
  before update on public.pessoas
  for each row execute function public.tg_set_atualizado_em();

-- Busca por nome no painel de operação
create index if not exists ix_pessoas_nome on public.pessoas (lower(nome));

-- ---------------------------------------------------------------------
-- 2. pessoa_enderecos
-- ---------------------------------------------------------------------
create table if not exists public.pessoa_enderecos (
  id          uuid primary key default gen_random_uuid(),
  pessoa_id   uuid not null references public.pessoas(id) on delete cascade,
  cep         text,
  logradouro  text,
  numero      text,
  complemento text,
  bairro      text,
  cidade      text,
  uf          text,
  principal   boolean not null default true,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint endereco_uf_valida check (uf is null or uf ~ '^[A-Z]{2}$')
);
create index if not exists ix_pessoa_enderecos_pessoa on public.pessoa_enderecos (pessoa_id);

grant select, insert, update, delete on public.pessoa_enderecos to authenticated;
grant all on public.pessoa_enderecos to service_role;
alter table public.pessoa_enderecos enable row level security;

drop trigger if exists tg_pessoa_enderecos_atualizado_em on public.pessoa_enderecos;
create trigger tg_pessoa_enderecos_atualizado_em
  before update on public.pessoa_enderecos
  for each row execute function public.tg_set_atualizado_em();

drop policy if exists enderecos_self on public.pessoa_enderecos;
create policy enderecos_self on public.pessoa_enderecos
  for select to authenticated
  using (pessoa_id = public.pessoa_atual() or public.e_admin());

drop policy if exists enderecos_self_insert on public.pessoa_enderecos;
create policy enderecos_self_insert on public.pessoa_enderecos
  for insert to authenticated
  with check (pessoa_id = public.pessoa_atual());

drop policy if exists enderecos_self_update on public.pessoa_enderecos;
create policy enderecos_self_update on public.pessoa_enderecos
  for update to authenticated
  using (pessoa_id = public.pessoa_atual() or public.e_admin())
  with check (pessoa_id = public.pessoa_atual() or public.e_admin());

drop policy if exists enderecos_self_delete on public.pessoa_enderecos;
create policy enderecos_self_delete on public.pessoa_enderecos
  for delete to authenticated
  using (pessoa_id = public.pessoa_atual() or public.e_admin());

-- ---------------------------------------------------------------------
-- 3. Registro único da pessoa no primeiro login
--    Sem trigger em auth.users (schema reservado da Supabase): o app
--    chama `garantir_pessoa()` logo após autenticar. Idempotente.
--    Regra de casamento: CPF primeiro; depois e-mail; senão cria.
-- ---------------------------------------------------------------------
create or replace function public.garantir_pessoa(
  _nome  text default null,
  _cpf   text default null,
  _email text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_cpf   text := public.so_digitos(_cpf);
  v_email citext := nullif(btrim(coalesce(_email, auth.jwt() ->> 'email')), '')::citext;
  v_nome  text := nullif(btrim(coalesce(_nome, auth.jwt() -> 'user_metadata' ->> 'full_name', auth.jwt() ->> 'email')), '');
  v_id    uuid;
begin
  if v_uid is null then
    raise exception 'garantir_pessoa exige usuária autenticada';
  end if;

  -- já vinculada
  select id into v_id from public.pessoas where auth_user_id = v_uid;

  -- casa por CPF (fonte central de verdade)
  if v_id is null and v_cpf is not null then
    select id into v_id from public.pessoas where cpf = v_cpf;
  end if;

  -- casa por e-mail já registrado em contatos
  if v_id is null and v_email is not null then
    select c.pessoa_id into v_id
    from public.pessoa_contatos c
    join public.pessoas p on p.id = c.pessoa_id
    where c.tipo = 'email' and c.valor = v_email and p.auth_user_id is null
    limit 1;
  end if;

  if v_id is null then
    insert into public.pessoas (auth_user_id, cpf, nome)
    values (v_uid, v_cpf, coalesce(v_nome, 'Sem nome'))
    returning id into v_id;
  else
    -- vínculo e preenchimento apenas aditivos: nada é sobrescrito
    update public.pessoas
       set auth_user_id = coalesce(auth_user_id, v_uid),
           cpf          = coalesce(cpf, v_cpf),
           nome         = case when coalesce(btrim(nome),'') in ('','Sem nome')
                               then coalesce(v_nome, nome) else nome end
     where id = v_id
       and (auth_user_id is null or auth_user_id = v_uid);
  end if;

  if v_email is not null then
    insert into public.pessoa_contatos (pessoa_id, tipo, valor, principal, verificado_em)
    values (v_id, 'email', v_email, true, now())
    on conflict (pessoa_id, tipo, valor) do nothing;
  end if;

  update public.pessoas set ultimo_acesso_em = now() where id = v_id;

  return v_id;
end;
$$;

revoke all on function public.garantir_pessoa(text, text, text) from public;
grant execute on function public.garantir_pessoa(text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 4. Vínculo de CPF (não destrutivo: só preenche quando está vazio)
-- ---------------------------------------------------------------------
create or replace function public.vincular_cpf(_cpf text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pessoa uuid := public.pessoa_atual();
  v_cpf    text := public.so_digitos(_cpf);
  v_dono   uuid;
begin
  if v_pessoa is null then raise exception 'sem pessoa vinculada à sessão'; end if;
  if v_cpf is null or length(v_cpf) <> 11 then raise exception 'CPF inválido'; end if;

  select id into v_dono from public.pessoas where cpf = v_cpf;

  if v_dono is not null and v_dono <> v_pessoa then
    raise exception 'CPF já cadastrado para outra pessoa';
  end if;

  update public.pessoas set cpf = coalesce(cpf, v_cpf) where id = v_pessoa;
  return v_pessoa;
end;
$$;

revoke all on function public.vincular_cpf(text) from public;
grant execute on function public.vincular_cpf(text) to authenticated;

-- ---------------------------------------------------------------------
-- 5. Contatos adicionais (telefone/whatsapp) — aditivo, sem apagar
-- ---------------------------------------------------------------------
create or replace function public.registrar_contato(
  _tipo public.contato_tipo,
  _valor text,
  _principal boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pessoa uuid := public.pessoa_atual();
  v_valor  citext;
  v_id     uuid;
begin
  if v_pessoa is null then raise exception 'sem pessoa vinculada à sessão'; end if;

  v_valor := case when _tipo = 'email'
                  then nullif(btrim(_valor),'')::citext
                  else public.so_digitos(_valor)::citext end;
  if v_valor is null then raise exception 'valor de contato inválido'; end if;

  insert into public.pessoa_contatos (pessoa_id, tipo, valor, principal)
  values (v_pessoa, _tipo, v_valor, _principal)
  on conflict (pessoa_id, tipo, valor) do update set principal = excluded.principal or public.pessoa_contatos.principal
  returning id into v_id;

  if _principal then
    update public.pessoa_contatos
       set principal = false
     where pessoa_id = v_pessoa and tipo = _tipo and id <> v_id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.registrar_contato(public.contato_tipo, text, boolean) from public;
grant execute on function public.registrar_contato(public.contato_tipo, text, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- 6. Gestão de papéis (somente administradora)
-- ---------------------------------------------------------------------
create or replace function public.conceder_papel(_pessoa_id uuid, _papel public.papel_tipo)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if not public.e_admin() then raise exception 'apenas administradoras'; end if;
  insert into public.papeis (pessoa_id, papel, criado_por)
  values (_pessoa_id, _papel, public.pessoa_atual())
  on conflict (pessoa_id, papel) do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.papeis where pessoa_id = _pessoa_id and papel = _papel;
  end if;
  return v_id;
end;
$$;

create or replace function public.revogar_papel(_pessoa_id uuid, _papel public.papel_tipo)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.e_admin() then raise exception 'apenas administradoras'; end if;
  if _papel = 'admin' and _pessoa_id = public.pessoa_atual() then
    raise exception 'uma administradora não pode remover o próprio acesso';
  end if;
  delete from public.papeis where pessoa_id = _pessoa_id and papel = _papel;
  return found;
end;
$$;

revoke all on function public.conceder_papel(uuid, public.papel_tipo) from public;
revoke all on function public.revogar_papel(uuid, public.papel_tipo) from public;
grant execute on function public.conceder_papel(uuid, public.papel_tipo) to authenticated;
grant execute on function public.revogar_papel(uuid, public.papel_tipo) to authenticated;

-- ---------------------------------------------------------------------
-- 7. v_meu_perfil — a única leitura de perfil do portal
--    Sem estado derivado gravado: papéis e acessos são consultados aqui.
-- ---------------------------------------------------------------------
create or replace view public.v_meu_perfil
with (security_invoker = true)
as
select
  p.id           as pessoa_id,
  p.nome,
  p.nome_social,
  p.cpf,
  p.data_nascimento,
  p.foto_url,
  p.bio,
  p.genero,
  p.instagram,
  p.linkedin,
  p.site,
  p.ultimo_acesso_em,
  (select c.valor from public.pessoa_contatos c
    where c.pessoa_id = p.id and c.tipo = 'email'
    order by c.principal desc, c.criado_em limit 1)        as email_principal,
  (select c.valor from public.pessoa_contatos c
    where c.pessoa_id = p.id and c.tipo in ('telefone','whatsapp')
    order by c.principal desc, c.criado_em limit 1)        as telefone_principal,
  coalesce((select array_agg(r.papel order by r.papel) from public.papeis r
             where r.pessoa_id = p.id), '{}'::public.papel_tipo[]) as papeis,
  public.acesso_vigente(p.id, 'diretorio')       as acesso_diretorio,
  public.acesso_vigente(p.id, 'conecta')         as acesso_conecta,
  public.acesso_vigente(p.id, 'academy')         as acesso_academy,
  public.acesso_vigente(p.id, 'area_embaixadora') as acesso_embaixadora,
  -- completude do cadastro, calculada (nunca gravada)
  (
    (case when coalesce(btrim(p.nome),'') <> '' then 1 else 0 end) +
    (case when p.cpf is not null then 1 else 0 end) +
    (case when p.data_nascimento is not null then 1 else 0 end) +
    (case when p.foto_url is not null then 1 else 0 end) +
    (case when exists (select 1 from public.pessoa_contatos c
                        where c.pessoa_id = p.id and c.tipo = 'email') then 1 else 0 end) +
    (case when exists (select 1 from public.pessoa_contatos c
                        where c.pessoa_id = p.id and c.tipo in ('telefone','whatsapp')) then 1 else 0 end) +
    (case when exists (select 1 from public.pessoa_enderecos e
                        where e.pessoa_id = p.id) then 1 else 0 end)
  ) * 100 / 7 as completude_percentual
from public.pessoas p;

grant select on public.v_meu_perfil to authenticated;

-- ---------------------------------------------------------------------
-- 8. Busca administrativa de pessoas (nome, CPF, e-mail, telefone)
-- ---------------------------------------------------------------------
create or replace function public.buscar_pessoas(_termo text, _limite integer default 30)
returns table (
  pessoa_id uuid,
  nome text,
  cpf text,
  email text,
  papeis public.papel_tipo[]
)
language sql
stable
security definer
set search_path = public
as $$
  select v.pessoa_id, v.nome, v.cpf, v.email_principal::text, v.papeis
  from public.v_meu_perfil v
  where public.e_admin()
    and (
      coalesce(_termo,'') = ''
      or lower(v.nome) like '%' || lower(_termo) || '%'
      or v.cpf = public.so_digitos(_termo)
      or lower(v.email_principal::text) like '%' || lower(_termo) || '%'
    )
  order by v.nome
  limit greatest(1, least(coalesce(_limite, 30), 200))
$$;

revoke all on function public.buscar_pessoas(text, integer) from public;
grant execute on function public.buscar_pessoas(text, integer) to authenticated;
