import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Roles alinhados com app_role enum do banco de dados
// NOTA: 'author' foi removido pois 'blog_editor' é o role efetivo para edição de blog
export type UserRole = 
  | 'admin' 
  | 'blog_editor'       // Editor de Blog (role principal para edição de conteúdo)
  | 'business_owner'    // Associada/Dona de Negócio
  | 'customer'          // Cliente da Loja
  | 'subscriber'        // Assinante Newsletter
  | 'ambassador'        // Embaixadora
  | 'community_member'; // Membro da Comunidade

export type UserType = 'individual' | 'business' | 'community';
export type SubscriptionType = 'newsletter' | 'loja' | 'comunidade' | 'negocio' | 'embaixadora';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  roles: UserRole[];
  user_types: UserType[];
  subscription_types: SubscriptionType[];
  is_admin: boolean;
  can_edit_blog: boolean;
  newsletter_subscribed: boolean;
  created_at: string;
}

export const useRoles = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Verificar se usuário tem role específico
  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    // Para compatibilidade com o sistema atual
    if (role === 'admin') return isAdmin;
    // TODO: Implementar verificação completa quando os dados estiverem disponíveis
    return false;
  };

  // Verificar se usuário pode acessar dashboard específico
  const canAccessDashboard = (dashboardType: string): boolean => {
    if (!user) return false;
    
    switch (dashboardType) {
      case 'admin':
        return hasRole('admin');
      case 'business':
      case 'associada':
        return hasRole('business_owner') || hasRole('admin');
      case 'customer':
      case 'cliente':
        return hasRole('customer') || hasRole('admin');
      case 'ambassador':
      case 'embaixadora':
        return hasRole('ambassador') || hasRole('admin');
      case 'community':
      case 'comunidade':
        return hasRole('community_member') || hasRole('admin');
      case 'blog':
        return hasRole('blog_editor') || hasRole('admin');
      default:
        return false;
    }
  };

  // Buscar perfis de usuários (só para admins)
  const useUserProfiles = () => {
    return useQuery({
      queryKey: ['user-profiles'],
      queryFn: async () => {
        if (!isAdmin) throw new Error('Acesso negado');
        
        const { data, error } = await supabase.rpc('get_profiles_admin_safe');
        if (error) throw error;
        
        return data as UserProfile[];
      },
      enabled: isAdmin,
    });
  };

  // Adicionar role a usuário (usando função segura)
  const useAddRole = () => {
    return useMutation({
      mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
        if (!isAdmin) throw new Error('Acesso negado');
        const { error } = await supabase.rpc('add_user_role_secure', {
          target_user_id: userId,
          new_role: role
        });
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      },
    });
  };

  // Remover role de usuário (usando função segura)
  const useRemoveRole = () => {
    return useMutation({
      mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
        if (!isAdmin) throw new Error('Acesso negado');
        const { error } = await supabase.rpc('remove_user_role_secure', {
          target_user_id: userId,
          old_role: role
        });
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      },
    });
  };

  // Alternar status de admin (coluna is_admin)
  const useToggleAdmin = () => {
    return useMutation({
      mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: boolean }) => {
        if (!isAdmin) throw new Error('Acesso negado');
        const { error } = await supabase.rpc('secure_toggle_admin_status', {
          target_user_id: userId,
          new_admin_status: newStatus,
        });
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      },
    });
  };

  // Alternar status de editor de blog (coluna can_edit_blog)
  const useToggleBlogEditor = () => {
    return useMutation({
      mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: boolean }) => {
        if (!isAdmin) throw new Error('Acesso negado');
        const { error } = await supabase.rpc('secure_toggle_blog_editor', {
          target_user_id: userId,
          new_editor_status: newStatus,
        });
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      },
    });
  };
  // Criar novo usuário
  const useCreateUser = () => {
    return useMutation({
      mutationFn: async ({ 
        email, 
        password, 
        fullName, 
        roles = [] 
      }: { 
        email: string; 
        password: string; 
        fullName?: string; 
        roles?: UserRole[] 
      }) => {
        if (!isAdmin) throw new Error('Acesso negado');
        
        // Usar Edge Function para criar usuário com segurança
        const { data, error } = await supabase.functions.invoke('create-admin-user', {
          body: { 
            email, 
            password, 
            fullName, 
            roles 
          }
        });
        
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Erro ao criar usuário');
        
        return data.user;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      },
    });
  };
  const useUpdateUser = () => {
    return useMutation({
      mutationFn: async ({ 
        userId, 
        fullName, 
        email 
      }: { 
        userId: string; 
        fullName?: string; 
        email?: string; 
      }) => {
        if (!isAdmin) throw new Error('Acesso negado');
        
        // Atualizar perfil
        const updateData: any = {};
        if (fullName !== undefined) updateData.full_name = fullName;
        if (email !== undefined) updateData.email = email;
        
        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId);
          
          if (error) throw error;
        }
        
        // Se email foi atualizado, atualizar também no auth
        if (email) {
          const { error: authError } = await supabase.auth.admin.updateUserById(userId, { email });
          if (authError) throw authError;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      },
    });
  };

  // Remover usuário (via Edge Function com service_role)
  const useDeleteUser = () => {
    return useMutation({
      mutationFn: async (userId: string) => {
        if (!isAdmin) throw new Error('Acesso negado');
        
        // Chamar Edge Function com privilégios de service_role
        const { data, error } = await supabase.functions.invoke('delete-user', {
          body: { userId }
        });
        
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Erro ao deletar usuário');
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      },
    });
  };

  return {
    hasRole,
    canAccessDashboard,
    useUserProfiles,
    useAddRole,
    useRemoveRole,
    useToggleAdmin,
    useToggleBlogEditor,
    useCreateUser,
    useUpdateUser,
    useDeleteUser,
  };
};