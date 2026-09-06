# 07 — Identidade e Perfis: operação (documento operacional)

> Como aplicar, testar e operar a Fase 2 no projeto novo (`tysvpeprhokdijquprkd`).
> Técnico: `06-identidade-perfis.md`. Manual para leigo: `08-identidade-manual.md`.

## 1. Aplicação

1. SQL Editor do projeto novo → executar `reboot/sql/0002_identidade_perfis.sql`
   inteiro. Idempotente; depende de `0001_nucleo_acesso.sql`.
2. Executar `reboot/tests/0002_aceitacao_identidade.sql` inteiro.
   Esperado: 8 avisos "TESTE n OK" e nenhum erro.

## 2. Primeira administradora

Depois de a pessoa entrar uma vez no portal (o que cria a linha em `pessoas`):

```sql
insert into public.papeis (pessoa_id, papel)
select id, 'admin' from public.pessoas where cpf = '<cpf só dígitos>'
on conflict do nothing;
```

A partir daí a gestão de papéis é feita pelas funções, nunca por SQL manual:

```sql
select public.conceder_papel('<uuid da pessoa>', 'editora');
select public.revogar_papel('<uuid da pessoa>', 'editora');
```

## 3. Como o portal usa (contrato para o front)

| Momento | Chamada |
|---|---|
| logo após login | `supabase.rpc('garantir_pessoa', { _nome, _cpf, _email })` |
| carregar o perfil | `supabase.from('v_meu_perfil').select('*').single()` |
| informar CPF | `supabase.rpc('vincular_cpf', { _cpf })` |
| novo telefone | `supabase.rpc('registrar_contato', { _tipo: 'whatsapp', _valor, _principal: true })` |
| busca no admin | `supabase.rpc('buscar_pessoas', { _termo })` |

Nenhuma tela grava papel, acesso ou percentual de perfil: tudo vem de `v_meu_perfil`.

## 4. Diagnóstico

| Sintoma | Onde olhar |
|---|---|
| Pessoa entrou e não tem perfil | o front chamou `garantir_pessoa`? `select * from public.pessoas where auth_user_id = '<uid>'` |
| "CPF já cadastrado para outra pessoa" | há duas linhas para a mesma pessoa: conciliar antes (ver abaixo) |
| Admin não vê o painel | `select * from public.papeis where pessoa_id = ...` |
| Perfil aparece incompleto | `select completude_percentual from public.v_meu_perfil where pessoa_id = ...` |

Conciliação de duplicadas (sempre manual e conferida):

```sql
-- 1. mover contatos, endereços, papéis, pagamentos e concessões para a linha boa
update public.pessoa_contatos  set pessoa_id = '<boa>' where pessoa_id = '<duplicada>';
update public.pessoa_enderecos set pessoa_id = '<boa>' where pessoa_id = '<duplicada>';
update public.pagamentos       set pessoa_id = '<boa>' where pessoa_id = '<duplicada>';
update public.concessoes_acesso set pessoa_id = '<boa>' where pessoa_id = '<duplicada>';
-- 2. só então remover a duplicada
delete from public.pessoas where id = '<duplicada>';
```

## 5. Verificações periódicas

```sql
-- pessoas sem CPF (fila de conciliação)
select id, nome from public.pessoas where cpf is null order by criado_em desc;

-- pessoas sem e-mail registrado
select p.id, p.nome from public.pessoas p
where not exists (select 1 from public.pessoa_contatos c
                  where c.pessoa_id = p.id and c.tipo = 'email');

-- quem é administradora hoje
select p.nome, p.cpf from public.papeis r join public.pessoas p on p.id = r.pessoa_id
where r.papel = 'admin';
```
