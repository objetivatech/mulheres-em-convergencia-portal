# 06 — Identidade e Perfis (documento técnico)

> Fase 2 do reboot. Resolve a duplicação de cadastro entre Meu Painel,
> Conecta+, Embaixadoras e CRM. Migration: `reboot/sql/0002_identidade_perfis.sql`.
> Operação: `07-identidade-operacao.md`. Manual para leigo: `08-identidade-manual.md`.

## O problema no sistema atual

A mesma pessoa existe hoje em `profiles`, `conecta_profiles`, `ambassadors` e nos
contatos do CRM, com dados que divergem. Foram criados gatilhos de sincronização
em vários sentidos (`sync_conecta_to_profile`, `sync_profile_to_ambassador`) — e
cada gatilho novo é mais uma forma de as cópias voltarem a divergir.

## A regra do reboot

> **Existe uma pessoa só.** Perfis de módulo não guardam cópia de nome, CPF,
> e-mail, telefone ou foto: apontam para `pessoas` e leem `v_meu_perfil`.

Nada de "estado do cadastro" gravado: papéis, acessos e completude do perfil são
calculados na leitura.

## Registro único no primeiro acesso

Não existe gatilho em `auth.users` (schema reservado da Supabase, nunca tocado).
Depois de autenticar, o portal chama `garantir_pessoa(nome, cpf, email)`, que é
idempotente e casa a pessoa nesta ordem:

1. já existe vínculo `auth_user_id` → devolve a mesma pessoa;
2. CPF informado bate com uma pessoa da carga → vincula;
3. e-mail bate com um contato de pessoa ainda sem login → vincula;
4. nada bate → cria a pessoa.

O preenchimento é **aditivo**: um campo já preenchido nunca é sobrescrito.

## Tabelas e funções

| Objeto | Papel |
|---|---|
| `pessoas` (+ colunas) | foto, bio, gênero, redes, aceite de termos, último acesso |
| `pessoa_enderecos` | endereço, com RLS por dona e por administradora |
| `garantir_pessoa` | registro único no primeiro acesso, idempotente |
| `vincular_cpf` | grava o CPF quando vazio; recusa CPF de outra pessoa |
| `registrar_contato` | acrescenta e-mail/telefone sem apagar histórico |
| `conceder_papel` / `revogar_papel` | gestão de papéis, só administradora; admin não se auto-remove |
| `v_meu_perfil` | leitura única de perfil: dados, contatos principais, papéis, acessos e completude |
| `buscar_pessoas` | busca administrativa por nome, CPF ou e-mail |

## Segurança

- Papéis permanecem em tabela separada, lidos por funções `security definer` —
  nenhuma policy consulta `pessoas` diretamente (sem recursão).
- Toda função de escrita tem `revoke all ... from public` e `grant execute` só
  para `authenticated`.
- `v_meu_perfil` é `security_invoker`: a usuária só enxerga a própria linha; a
  administradora enxerga todas, pelas policies já existentes de `pessoas`.

## Testes de aceitação

`reboot/tests/0002_aceitacao_identidade.sql` — 8 testes: unicidade e formato do
CPF, endereço, contato idempotente, papel sem duplicação, perfil consolidado por
consulta, acesso refletido na hora, recusa de CPF inválido.

## O que a Fase 2 elimina

- `conecta_profiles`, `ambassadors` e contatos do CRM com cópia de dados pessoais.
- Todos os gatilhos de sincronização de perfil.
- A coluna de "perfil completo" gravada e atualizada por rotina.
