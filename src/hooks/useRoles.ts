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
          new_role: role as any  // Tipo temporário até atualizar o banco
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
          old_role: role as any  // Tipo temporário até atualizar o banco
        });
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
  };
};