import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type UserRole = 
  | 'admin' 
  | 'associada' 
  | 'cliente_loja' 
  | 'assinante_newsletter' 
  | 'embaixadora' 
  | 'membro_comunidade' 
  | 'autor';

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
      case 'associada':
        return hasRole('associada') || hasRole('admin');
      case 'cliente':
        return hasRole('cliente_loja') || hasRole('admin');
      case 'embaixadora':
        return hasRole('embaixadora') || hasRole('admin');
      case 'comunidade':
        return hasRole('membro_comunidade') || hasRole('admin');
      case 'blog':
        return hasRole('autor') || hasRole('admin');
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

  // Adicionar role a usuário
  const useAddRole = () => {
    return useMutation({
      mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
        if (!isAdmin) throw new Error('Acesso negado');
        
        const { error } = await supabase.rpc('add_user_role', {
          user_uuid: userId,
          new_role: role as any // Conversão temporária até ajustar enum no banco
        });
        
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      },
    });
  };

  // Remover role de usuário
  const useRemoveRole = () => {
    return useMutation({
      mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
        if (!isAdmin) throw new Error('Acesso negado');
        
        const { error } = await supabase.rpc('remove_user_role', {
          user_uuid: userId,
          old_role: role as any // Conversão temporária até ajustar enum no banco
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
        
        // Criar usuário via auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          user_metadata: { full_name: fullName }
        });
        
        if (authError) throw authError;
        if (!authData.user) throw new Error('Erro ao criar usuário');
        
        // Adicionar roles se fornecidos
        for (const role of roles) {
          await supabase.rpc('add_user_role', {
            user_uuid: authData.user.id,
            new_role: role as any // Conversão temporária até ajustar enum no banco
          });
        }
        
        return authData.user;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      },
    });
  };

  // Atualizar usuário
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

  // Remover usuário
  const useDeleteUser = () => {
    return useMutation({
      mutationFn: async (userId: string) => {
        if (!isAdmin) throw new Error('Acesso negado');
        
        // Deletar usuário via auth (isso deletará automaticamente o perfil devido ao cascade)
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) throw error;
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
    useCreateUser,
    useUpdateUser,
    useDeleteUser,
  };
};