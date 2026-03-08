# Matriz de Roles e Permissões

## Visão Geral

O sistema de permissões do portal MeC é baseado na tabela `user_roles` com o enum `app_role`. As roles são **cumulativas** — um usuário pode ter múltiplas roles simultaneamente.

## Roles Principais

| Role | Descrição | Atribuição |
|------|-----------|------------|
| `community_member` | Acesso básico ao portal | Automática (trigger no cadastro) |
| `subscriber` | Assinante da newsletter | Automática (trigger via `newsletter_subscribed`) |
| `ambassador` | Embaixadora com acesso ao painel de indicações | Manual (admin) |
| `business_owner` | Associada com negócio no diretório | Manual (admin) |
| `student` | Aluna do MeC Academy | Manual (admin) |
| `blog_editor` | Editora de conteúdo do blog | Manual (admin) |
| `admin` | Acesso administrativo total | Manual (admin) |

## Matriz de Acessos

| Funcionalidade | community_member | subscriber | ambassador | business_owner | student | admin |
|---|---|---|---|---|---|---|
| Portal básico | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Newsletter (Mailrelay) | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Painel Embaixadora | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Diretório de Negócios (gestão) | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| CONECTA+ (membro) | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| CONECTA+ (convidado) | ✅ | ✅ | ✅ | — | ✅ | — |
| MeC Academy | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Edição Blog | ❌ | ❌ | ❌ | ❌ | ❌ | ✅* |
| Admin completo | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

*`blog_editor` também tem acesso à edição do blog.

## Regras de Consistência

### Roles Dependentes
Roles como `business_owner`, `ambassador`, `student`, `blog_editor` e `admin` sempre garantem que `community_member` exista. Isso é enforçado pelo trigger `validate_role_consistency`.

### Proteção contra Remoção
Não é possível remover `community_member` se o usuário possui roles dependentes. O trigger bloqueia a operação com uma exceção.

## Atribuição Automática

### No Cadastro
- **Trigger `assign_default_role`**: Ao criar um profile, insere `community_member` automaticamente.

### Newsletter
- **Trigger `sync_newsletter_subscriber_role`**: Quando `profiles.newsletter_subscribed` muda para `true`, insere role `subscriber`. Quando muda para `false`, remove a role.

## Verificação no Frontend

### Hook Centralizado: `useUserRoles`
```typescript
import { useUserRoles } from '@/hooks/useUserRoles';

const { roles, hasRole, isAdmin, isBusinessOwner, isAmbassador, isStudent } = useUserRoles();

// Verificar role específica
if (hasRole('business_owner')) { ... }
```

### Hook Legado: `useRoles`
O `useRoles` agora usa `useUserRoles` internamente. `hasRole()` consulta a RPC `get_user_roles` com cache de 5 minutos.

### CONECTA+ Access
O `useConectaAccess` determina o nível baseado em:
- `admin` → role `admin`
- `membro` → role `business_owner`
- `convidado` → qualquer usuário logado

## Meu Painel (UserDashboard)

O painel exibe abas condicionais por role:
- **Visão Geral**: Sempre visível
- **Meus Dados**: Sempre visível
- **Socioeconômico**: Sempre visível (tabela `user_socioeconomic_data`)
- **Meu Negócio**: Apenas `business_owner`
- **Embaixadora**: Apenas `ambassador`
- **CONECTA+**: Todos (com mensagem diferente para membros vs convidados)
- **Academy**: `student`, `business_owner`, `ambassador`, `admin`
- **Blog**: `blog_editor` ou `admin`
- **Assinatura**: Quem tem subscription ativa

## Segurança

- Roles são verificadas via RPC `has_role()` com SECURITY DEFINER
- Nunca verificar roles no client-side sem RPC
- Todas as mudanças de roles são auditadas em `admin_audit_log`
- Gerenciamento de roles apenas via funções seguras `add_user_role_secure` / `remove_user_role_secure`
