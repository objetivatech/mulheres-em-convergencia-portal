# Sistema de Gestão de Usuários

Este documento descreve o sistema completo de gestão de usuários implementado no portal Mulheres em Convergência.

## Visão Geral

O sistema permite gerenciar diferentes tipos de usuários com permissões específicas, cada um com acesso a dashboards personalizados conforme suas necessidades e roles.

## Tipos de Usuários e Dashboards

### 👑 Administrador
- **Acesso**: Irrestrito a todos os setores do site
- **Dashboard**: Painel administrativo completo (`/admin`)
- **Responsabilidades**:
  - Cadastro e ativação de Embaixadoras e Membros da Comunidade
  - Gerenciamento de permissões de todos os usuários
  - Acesso a todas as funcionalidades do sistema

### 🏪 Associada
- **Acesso**: Dashboard de Gestão do Perfil de Negócios (`/dashboard/associada`)
- **Permissões**:
  - Gerenciar apenas o próprio perfil de usuário
  - Gerenciar o perfil do negócio que cadastrou
- **Funcionalidades**:
  - Edição de informações empresariais
  - Estatísticas de visualizações e contatos
  - Configurações da conta

### 🛒 Cliente da Loja
- **Acesso**: Dashboard do Cliente (`/dashboard/cliente`)
- **Permissões**:
  - Acesso ao próprio cadastro de usuário
  - Visualização do histórico de compras
- **Funcionalidades**:
  - Acompanhamento de pedidos
  - Gerenciamento de favoritos
  - Configurações pessoais

### 📧 Assinante da Newsletter
- **Status**: Usuário que existe apenas no mailing da plataforma MailRelay
- **Acesso**: Nenhum dashboard ou permissões adicionais no portal
- **Observação**: Não possui conta no sistema principal

### 👑 Embaixadora
- **Criação**: Exclusivamente pelo Administrador (não há cadastro público)
- **Acesso**: Dashboard da Embaixadora (`/dashboard/embaixadora`)
- **Privacidade**: Perfil, dashboard e links não são públicos
- **Funcionalidades** (a serem implementadas):
  - Gerenciamento de indicações
  - Relatórios de ganhos e comissões
  - Material promocional

### 👥 Membro da Comunidade
- **Acesso**: Dashboard da Comunidade (`/dashboard/comunidade`)
- **Funcionalidades**:
  - Gerenciar conexões com outros membros
  - Participar de grupos
  - Editar perfil de membro

### ✍️ Autor
- **Criação**: Exclusivamente pelo Administrador (não há cadastro público)
- **Acesso**: Dashboard Convergência - Blog (`/dashboard/blog`)
- **Permissões**:
  - Criar novos posts
  - Editar apenas os próprios posts
  - Não pode editar posts de outros usuários
  - Não pode excluir posts

## Estrutura Técnica

### Banco de Dados

#### Tipos ENUM
```sql
-- Roles de usuário
CREATE TYPE user_role AS ENUM (
  'admin', 
  'associada', 
  'cliente_loja', 
  'assinante_newsletter', 
  'embaixadora', 
  'membro_comunidade', 
  'autor'
);

-- Tipos de usuário para categorização
CREATE TYPE user_type AS ENUM (
  'individual', 
  'business', 
  'community'
);

-- Tipos de subscription
CREATE TYPE subscription_type AS ENUM (
  'newsletter', 
  'loja', 
  'comunidade', 
  'negocio', 
  'embaixadora'
);
```

#### Tabela profiles (atualizada)
```sql
ALTER TABLE profiles 
ADD COLUMN roles user_role[] DEFAULT '{}',
ADD COLUMN user_types user_type[] DEFAULT '{}',
ADD COLUMN subscription_types subscription_type[] DEFAULT '{}',
ADD COLUMN onboarding_completed boolean DEFAULT false;
```

#### Tabela user_permissions
```sql
CREATE TABLE user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  permission_name text NOT NULL,
  granted_by uuid REFERENCES profiles(id),
  granted_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  active boolean DEFAULT true
);
```

### Componentes Principais

#### 1. useRoles Hook (`/src/hooks/useRoles.ts`)
- Gerenciamento de roles e permissões
- Verificação de acesso a dashboards
- Mutações para adicionar/remover roles

#### 2. RoleProtectedRoute (`/src/components/auth/RoleProtectedRoute.tsx`)
- Proteção de rotas baseada em roles
- Redirecionamento automático para usuários não autorizados

#### 3. UserManagement (`/src/components/admin/UserManagement.tsx`)
- Interface administrativa para gestão de usuários
- Filtros por nome, email e role
- Adição/remoção de roles por usuário

#### 4. Dashboard (`/src/pages/Dashboard.tsx`)
- Dashboard dinâmico baseado no tipo de usuário
- Configuração específica para cada role
- Módulos personalizados por tipo de acesso

### Rotas do Sistema

```typescript
// Rotas administrativas
/admin                 // Painel administrativo (só admins)
/admin/users          // Gestão de usuários (só admins)

// Dashboards por tipo de usuário
/dashboard/associada   // Dashboard de Associada
/dashboard/cliente     // Dashboard de Cliente
/dashboard/embaixadora // Dashboard de Embaixadora (privado)
/dashboard/comunidade  // Dashboard da Comunidade
/dashboard/blog        // Dashboard do Autor (privado)
```

### Funções do Banco de Dados

#### Verificação de Roles
```sql
-- Verificar se usuário tem role específico
SELECT user_has_role(user_uuid, 'admin');

-- Verificar permissão específica
SELECT user_has_permission(user_uuid, 'edit_posts');
```

#### Gerenciamento de Roles
```sql
-- Adicionar role ao usuário
SELECT add_user_role(user_uuid, 'associada');

-- Remover role do usuário
SELECT remove_user_role(user_uuid, 'cliente_loja');
```

## Regras de Negócio

### 1. Criação de Usuários Especiais
- **Embaixadoras** e **Autores** só podem ser criados por Administradores
- Não existem formulários públicos de cadastro para estes roles
- Links e perfis de Embaixadoras não são públicos

### 2. Segregação de Acesso
- Cada tipo de usuário acessa somente sua respectiva dashboard
- Não há sobreposição de permissões entre diferentes roles
- Administradores têm acesso total a todas as funcionalidades

### 3. Hierarquia de Permissões
```
Administrador (acesso total)
├── Embaixadora (dashboard privado)
├── Autor (dashboard privado) 
├── Associada (dashboard de negócios)
├── Membro da Comunidade (dashboard de comunidade)
├── Cliente da Loja (dashboard de cliente)
└── Assinante Newsletter (sem dashboard)
```

## Próximos Passos

### Fase 1: Funcionalidades Básicas ✅
- [x] Sistema de roles e permissões
- [x] Dashboards básicos por tipo de usuário
- [x] Proteção de rotas
- [x] Interface de gestão de usuários

### Fase 2: Funcionalidades Específicas (Em Desenvolvimento)
- [ ] Gestão completa de perfis de negócios (Associadas)
- [ ] Sistema de indicações e comissões (Embaixadoras)
- [ ] Histórico de compras e pedidos (Clientes)
- [ ] Grupos e conexões (Comunidade)
- [ ] Editor de posts completo (Autores)

### Fase 3: Funcionalidades Avançadas (Planejado)
- [ ] Notificações em tempo real
- [ ] Sistema de mensagens internas
- [ ] Relatórios e analytics avançados
- [ ] Integração com sistemas de pagamento

## Observações Importantes

1. **Segurança**: Todas as rotas são protegidas por RLS (Row Level Security) no Supabase
2. **Escalabilidade**: O sistema suporta múltiplos roles por usuário
3. **Flexibilidade**: Novas permissões podem ser adicionadas sem alterar a estrutura base
4. **Auditoria**: Todas as mudanças de roles são registradas com autor e timestamp

## Links Úteis

- [Documentação do Supabase Auth](https://supabase.com/docs/guides/auth)
- [React Router Protected Routes](https://reactrouter.com/en/main/start/tutorial)
- [Tailwind CSS Components](https://tailwindcss.com/docs)