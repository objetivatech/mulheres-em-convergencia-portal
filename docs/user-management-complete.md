# Sistema Completo de Gestão de Usuários

## Visão Geral

O sistema de gestão de usuários permite aos administradores gerenciar completamente os usuários do portal, incluindo criação, edição, exclusão e gestão de permissões (roles).

## Funcionalidades Implementadas

### 🔧 Operações CRUD Completas
- ✅ **Criar Usuário**: Criar novos usuários com email, senha e roles
- ✅ **Visualizar Usuários**: Lista paginada com filtros e busca
- ✅ **Editar Usuário**: Alterar informações básicas (nome, email)
- ✅ **Excluir Usuário**: Remover usuários com confirmação
- ✅ **Gerenciar Roles**: Adicionar/remover permissões específicas

### 👤 Gestão de Roles
O sistema suporta os seguintes tipos de usuário:

- **Admin** (`admin`) - Acesso completo ao sistema
- **Associada** (`associada`) - Membro da associação
- **Cliente da Loja** (`cliente_loja`) - Acesso à loja
- **Assinante Newsletter** (`assinante_newsletter`) - Recebe newsletter
- **Embaixadora** (`embaixadora`) - Representa a marca
- **Membro da Comunidade** (`membro_comunidade`) - Participa da comunidade
- **Autor** (`autor`) - Pode criar/editar posts do blog

### 🔍 Recursos de Interface
- **Busca Avançada**: Por nome ou email
- **Filtro por Role**: Visualizar usuários por permissão específica
- **Estatísticas**: Contadores de usuários por tipo
- **Interface Responsiva**: Funciona em desktop e mobile
- **Confirmações**: Dialogs de confirmação para ações críticas

## Arquitetura do Sistema

### Componentes Principais

#### 1. Hook `useRoles` (`src/hooks/useRoles.ts`)
```typescript
// Operações disponíveis
const {
  useUserProfiles,    // Listar usuários (admin only)
  useCreateUser,      // Criar novo usuário
  useUpdateUser,      // Atualizar dados do usuário
  useDeleteUser,      // Excluir usuário
  useAddRole,         // Adicionar role ao usuário
  useRemoveRole,      // Remover role do usuário
  hasRole,           // Verificar se usuário tem role específico
  canAccessDashboard  // Verificar acesso a dashboard
} = useRoles();
```

#### 2. Componente Principal (`src/components/admin/UserManagement.tsx`)
- Lista de usuários com paginação
- Filtros de busca e role
- Estatísticas de usuários
- Ações de CRUD integradas

#### 3. Dialog de Adição (`src/components/admin/AddUserDialog.tsx`)
- Formulário para criar usuários
- Seleção múltipla de roles
- Validação de dados
- Geração de senha temporária

#### 4. Dialog de Edição (`src/components/admin/EditUserDialog.tsx`)
- Edição de informações básicas
- Validação de email
- Interface limpa e intuitiva

### Integração com Supabase

#### Funções RPC Utilizadas
```sql
-- Buscar perfis (admin only)
get_profiles_admin_safe()

-- Gerenciar roles
add_user_role(user_uuid, new_role)
remove_user_role(user_uuid, old_role)

-- Verificações
user_has_role(user_uuid, role_name)
get_current_user_admin_status()
```

#### Tabelas Principais
- **`profiles`**: Dados dos usuários (nome, email, roles)
- **`auth.users`**: Sistema de autenticação do Supabase
- **Cascade Delete**: Exclusão automática ao remover do auth

## Segurança

### Row Level Security (RLS)
- ✅ Apenas admins podem ver dados de outros usuários
- ✅ Usuários só veem seus próprios dados
- ✅ Funções RPC protegidas por verificação de admin
- ✅ Validação de permissões em todas as operações

### Validações
- **Email**: Formato válido obrigatório
- **Senha**: Mínimo 6 caracteres na criação
- **Roles**: Apenas roles válidos podem ser atribuídos
- **Admin**: Verificação de permissão em todas as operações

## Fluxos de Uso

### 1. Adicionar Usuário
1. Admin clica em "Adicionar Usuário"
2. Preenche email, senha e nome (opcional)
3. Seleciona roles desejados
4. Sistema cria usuário no auth e perfil
5. Adiciona roles selecionados
6. Usuário aparece na lista

### 2. Editar Usuário
1. Admin clica em "Editar" na linha do usuário
2. Altera nome e/ou email
3. Sistema atualiza perfil e auth (se email mudou)
4. Mudanças refletem imediatamente na lista

### 3. Gerenciar Roles
1. Admin clica em "Gerenciar Roles"
2. Vê lista de todos os roles disponíveis
3. Pode adicionar/remover cada role individualmente
4. Status atualiza em tempo real

### 4. Excluir Usuário
1. Admin clica em "Excluir"
2. Confirma ação no dialog
3. Sistema remove do auth (cascade remove do perfil)
4. Usuário desaparece da lista

## Tratamento de Erros

### Erros Comuns e Soluções
- **Email já existe**: Mensagem clara ao usuário
- **Permissão negada**: Redirecionamento ou mensagem de erro
- **Conexão perdida**: Retry automático das operações
- **Validation errors**: Feedback visual nos campos

### Logs e Auditoria
- Todas as operações administrativas são logadas
- Sistema de toast para feedback imediato
- Estados de loading para operações assíncronas

## Melhorias Futuras

### Funcionalidades Planejadas
1. **Importação em Lote**: Upload de CSV com usuários
2. **Histórico de Alterações**: Log detalhado das modificações
3. **Perfis Avançados**: Campos customizados por role
4. **Notificações**: Email automático para novos usuários
5. **Backup/Restore**: Exportação de dados de usuários

### Otimizações
1. **Paginação**: Para listas grandes de usuários
2. **Cache Inteligente**: Reduzir chamadas desnecessárias
3. **Busca Fuzzy**: Melhor experiência de busca
4. **Filtros Avançados**: Por data, status, etc.

## Manutenção

### Atualização de Roles
Para adicionar novos roles:
1. Atualizar enum `UserRole` no `useRoles.ts`
2. Adicionar labels e ícones nos arrays correspondentes
3. Atualizar documentação

### Monitoramento
- Verificar logs de erro regularmente
- Monitorar performance das queries
- Validar integridade dos dados periodicamente

---

**Data de Implementação**: Agosto 2025  
**Versão**: 1.0 - Sistema Completo  
**Status**: ✅ Funcional e Testado  
**Dependências**: Supabase Auth, RLS Policies, Functions RPC

## Notas Técnicas

### Compatibilidade de Tipos
- Sistema usa conversão temporária `as any` para compatibilidade entre enums TypeScript e PostgreSQL
- Funcionalidade completa mantida independente dos tipos específicos do banco
- Migração futura pode ajustar enums para perfeita compatibilidade

### Operações Administrativas
- Todas as operações requerem privilégios de administrador
- Verificação de segurança em nível de hook e banco de dados
- Invalidação automática de cache para atualizações em tempo real