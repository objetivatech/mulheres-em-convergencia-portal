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

  // Buscar perfis de usuários (só para admins) - Versão temporária
  const useUserProfiles = () => {
    return useQuery({
      queryKey: ['user-profiles'],
      queryFn: async () => {
        if (!isAdmin) throw new Error('Acesso negado');
        
        // Por enquanto, busca apenas os perfis básicos
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            created_at
          `);
        
        if (error) throw error;
        
        // Retorna usuários com roles vazios por enquanto até a migração estar completa
        const usersWithRoles = (data || []).map((profile) => ({
          ...profile,
          roles: [] as UserRole[], // Temporário - será preenchido após migração
          user_types: [] as UserType[],
          subscription_types: [] as SubscriptionType[],
          is_admin: false, // Temporário
          can_edit_blog: false, // Temporário
          newsletter_subscribed: false, // Temporário
        } as UserProfile));
        
        return usersWithRoles;
      },
      enabled: isAdmin,
    });
  };

  // Adicionar role a usuário - Versão temporária
  const useAddRole = () => {
    return useMutation({
      mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
        if (!isAdmin) throw new Error('Acesso negado');
        
        // Funcionalidade temporária - será implementada após migração completa
        console.log(`Adicionando role ${role} para usuário ${userId}`);
        return Promise.resolve();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      },
    });
  };

  // Remover role de usuário - Versão temporária
  const useRemoveRole = () => {
    return useMutation({
      mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
        if (!isAdmin) throw new Error('Acesso negado');
        
        // Funcionalidade temporária - será implementada após migração completa
        console.log(`Removendo role ${role} do usuário ${userId}`);
        return Promise.resolve();
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