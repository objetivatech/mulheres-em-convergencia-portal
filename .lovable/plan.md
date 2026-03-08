

# Plano: Integração de Roles, Newsletter Opt-in e Remodelação do Meu Painel

## Contexto

O portal possui um sistema de roles via `user_roles` com enum `app_role` no banco de dados, mas a lógica de verificação no frontend (`useRoles.ts`, `useAuth.ts`, `useConectaAccess.ts`) está fragmentada e incompleta. É preciso unificar e alinhar os fluxos de acesso conforme a nova matriz de permissões, adicionar newsletter opt-in nos cadastros, e remodelar a página "Meu Painel" com perfil completo e dados socioeconômicos.

---

## Posicionamento e Sugestões

### Problemas identificados

1. **`useRoles.hasRole()` é incompleto** -- só verifica `admin` e `blog_editor` via RPC, todos os outros roles retornam `false`. Precisa consultar a tabela `user_roles` via `has_role()` RPC para todos os roles.
2. **`useConectaAccess` usa `user_subscriptions`** para determinar nível "membro", mas deveria usar a role `business_owner` (Associada) como critério principal, alinhado à nova definição.
3. **Não existe atribuição automática de `community_member`** no cadastro -- todo novo usuário deveria receber essa role.
4. **Newsletter opt-in inexistente** nos formulários de cadastro.
5. **`profiles` ainda tem `is_admin`, `can_edit_blog`, `roles`** -- dados legados que duplicam `user_roles`.
6. **"Meu Painel" é superficial** -- não tem edição de perfil integrada nem abas condicionais por role.

### Sugestões de melhoria

- Criar uma **função de banco `assign_default_role`** trigger que atribua `community_member` automaticamente a todo novo usuário.
- Criar uma **tabela `user_socioeconomic_data`** para armazenar os dados do formulário socioeconômico (vinculada por `user_id`, acessível pelo CRM).
- Unificar `useRoles.hasRole()` para usar RPC `has_role()` com cache via React Query, eliminando verificações parciais.

---

## Etapa 1: Atribuição Automática de Role no Cadastro

### Banco de dados
- Criar trigger `on_auth_user_created` que insere `community_member` na tabela `user_roles` para todo novo usuário.
- Criar função `assign_newsletter_subscriber` que adiciona role `subscriber` quando `newsletter_subscribed = true` no `profiles`.

### Frontend
- Nenhuma mudança nesta etapa (triggers automáticos).

---

## Etapa 2: Unificar `useRoles.hasRole()` 

### Mudanças em `src/hooks/useRoles.ts`
- Substituir a lógica manual por chamada a `supabase.rpc('has_role', { _user_id, _role })` com cache via React Query.
- Criar hook interno `useUserRoles()` que busca todas as roles do usuário de uma vez (nova RPC `get_user_roles` retornando array).

### Mudanças em `src/hooks/useAuth.ts`
- Adicionar `isAssociate` (business_owner) e `isStudent` aos estados retornados, usando a mesma RPC.

### Mudanças em `src/hooks/useConectaAccess.ts`
- Alterar lógica de `getAccessLevel()`:
  - `admin` → role `admin`
  - `membro` → role `business_owner` (Associada)
  - `convidado` → qualquer outro usuário logado

---

## Etapa 3: Newsletter Opt-in nos Formulários de Cadastro

### Formulários a alterar
1. **`src/pages/Auth.tsx`** (cadastro principal) -- adicionar checkbox "Desejo receber a newsletter"
2. **`src/pages/Planos.tsx`** (cadastro via planos) -- adicionar checkbox
3. **Formulários de inscrição em eventos** (se existirem) -- adicionar checkbox

### Lógica
- Ao cadastrar, se opt-in marcado: `profiles.newsletter_subscribed = true` + adicionar role `subscriber` via trigger.
- Sincronização com Mailrelay segue fluxo existente (já implementado).

---

## Etapa 4: Tabela de Dados Socioeconômicos

### Banco de dados
Criar tabela `user_socioeconomic_data` com campos baseados no formulário enviado:

```text
user_socioeconomic_data
├── id (uuid, PK)
├── user_id (uuid, FK → profiles.id)
├── race_ethnicity (text)
├── education_level (text)
├── monthly_income (text)
├── housing_situation (text)
├── household_size (integer)
├── employment_status (text)
├── has_business (boolean)
├── business_sector (text)
├── business_formalization (text)
├── main_challenges (text[])
├── how_discovered (text)
├── motivation (text)
├── created_at / updated_at
└── RLS: usuário lê/edita os próprios, admin lê todos
```

---

## Etapa 5: Remodelar "Meu Painel" (`UserDashboard.tsx`)

### Nova estrutura com abas

```text
Meu Painel
├── [Header] Avatar + Nome + Badges de roles ativas
├── [Tab] Visão Geral (dashboard atual, cards de acesso rápido)
├── [Tab] Meus Dados (merge de ConfiguracoesContaPage + DadosPessoaisPage)
├── [Tab] Dados Socioeconômicos (formulário da Etapa 4) ← todos
├── [Tab] Meu Negócio ← só business_owner
├── [Tab] Embaixadora ← só ambassador
├── [Tab] CONECTA+ ← só business_owner (membro) / link para convidados
├── [Tab] Academy ← só student/business_owner/ambassador
└── [Tab] Assinaturas ← quem tem subscription ativa
```

- Abas aparecem/desaparecem conforme roles do usuário.
- Consolidar `ConfiguracoesContaPage` e `DadosPessoaisPage` dentro do painel.
- Formulário socioeconômico integrado ao CRM via `social_impact_metrics`.

---

## Etapa 6: Validação de Consistência de Roles

### Banco de dados
- Criar função `validate_role_consistency(user_id)` que verifica e corrige inconsistências:
  - Se tem `business_owner` → garantir `community_member` também existe
  - Se tem `ambassador` → garantir `community_member` também existe
  - Se tem `student` → garantir `community_member` também existe
  - Não permitir remover `community_member` se existem roles dependentes

### Trigger
- Executar `validate_role_consistency` em `AFTER INSERT/DELETE` na `user_roles`.

---

## Etapa 7: Documentação

- Criar `docs/_active/04-usuarios/matriz-roles-permissoes.md` com a tabela completa de roles × acessos.
- Atualizar `docs/_active/12-conecta/conecta-access-levels.md` com nova lógica de determinação.
- Atualizar `docs/_active/04-usuarios/sistema-roles-seguro.md` com novos roles e triggers.

---

## Matriz de Roles × Acessos (Referência)

| Funcionalidade | community_member | subscriber | ambassador | business_owner | student | admin |
|---|---|---|---|---|---|---|
| Portal básico | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Newsletter | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Painel Embaixadora | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Diretório de Negócios | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| CONECTA+ (membro) | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| CONECTA+ (convidado) | ✅ | ✅ | ✅ | - | ✅ | - |
| MeC Academy | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Admin completo | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Ordem de Implementação

1. **Etapa 1** - Triggers de atribuição automática de roles (banco)
2. **Etapa 6** - Validação de consistência (banco) -- junto com Etapa 1
3. **Etapa 2** - Unificar `useRoles` / `useAuth` / `useConectaAccess`
4. **Etapa 3** - Newsletter opt-in nos formulários
5. **Etapa 4** - Tabela socioeconômica (banco)
6. **Etapa 5** - Remodelar Meu Painel com abas e perfil completo
7. **Etapa 7** - Documentação

