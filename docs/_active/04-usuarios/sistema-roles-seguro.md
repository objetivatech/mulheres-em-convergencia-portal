# Sistema de Roles Seguro

## Visão Geral
Implementação completa de um sistema de roles seguro usando tabela separada `user_roles` com função SECURITY DEFINER para prevenir ataques de escalação de privilégios.

## ⚠️ SEGURANÇA CRÍTICA

**NUNCA** armazenar roles diretamente na tabela `profiles` ou `auth.users`:
- ✅ Roles em tabela separada `user_roles`
- ✅ Verificação via função `has_role()` com SECURITY DEFINER
- ❌ NUNCA usar arrays de roles em `profiles`
- ❌ NUNCA verificar roles no client-side

## Estrutura do Banco de Dados

### Enum `app_role`
```sql
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'blog_editor',
  'business_owner',
  'subscriber',
  'ambassador',
  'author'
);
```

### Tabela `user_roles`
```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);
```

### Função `has_role()` - SECURITY DEFINER
```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  );
$$;
```

## Como Verificar Roles

### No Frontend (useAuth.ts)
```typescript
const { isAdmin, canEditBlog } = useAuth();

// isAdmin e canEditBlog são calculados via RPC:
const { data: adminStatus } = await supabase.rpc('get_current_user_admin_status');
```

### Em RLS Policies
```sql
-- Exemplo: Apenas admins podem ver todos os negócios
CREATE POLICY "Admins can view all businesses"
ON public.businesses
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
```

### Em Edge Functions
```typescript
const { data: isAdmin } = await supabaseClient
  .rpc('has_role', {
    _user_id: userId,
    _role: 'admin'
  });
```

## Adicionar/Remover Roles (Admin Only)

### Função Segura para Adicionar Role
```sql
SELECT public.add_user_role_secure(
  'user-uuid-here',
  'admin'::app_role
);
```

### Função Segura para Remover Role
```sql
SELECT public.remove_user_role_secure(
  'user-uuid-here',
  'blog_editor'::app_role
);
```

## Proteção do Header

O componente `Header.tsx` agora verifica `isAdmin` antes de mostrar menus administrativos:

```tsx
{isAdmin && (
  <>
    <DropdownMenuItem asChild>
      <Link to="/admin">Administração</Link>
    </DropdownMenuItem>
    {/* Outros itens admin */}
  </>
)}
```

## Migração de Dados

A migração automática migrou:
- `profiles.is_admin = true` → `user_roles` com role `'admin'`
- `profiles.can_edit_blog = true` → `user_roles` com role `'blog_editor'`

## Auditoria

Todas as mudanças de roles são auditadas automaticamente na tabela `admin_audit_log`.

## Roles Disponíveis

1. **admin**: Acesso total ao sistema
2. **blog_editor**: Pode criar/editar posts do blog
3. **business_owner**: Dono de um ou mais negócios
4. **subscriber**: Assinante com acesso premium
5. **ambassador**: Embaixador com comissões
6. **author**: Autor de conteúdo (futuro)

## Testes de Segurança

Para testar se as permissões estão corretas:

1. Criar usuário de teste sem roles
2. Tentar acessar `/admin` - deve ser bloqueado
3. Adicionar role `admin` ao usuário
4. Verificar que agora tem acesso completo

## Boas Práticas

1. ✅ Sempre usar `has_role()` em RLS policies
2. ✅ Verificar roles no backend, não no frontend
3. ✅ Usar funções SECURITY DEFINER para gerenciar roles
4. ✅ Auditar mudanças de permissões
5. ❌ NUNCA confiar em verificações client-side
6. ❌ NUNCA permitir usuários modificarem suas próprias roles
