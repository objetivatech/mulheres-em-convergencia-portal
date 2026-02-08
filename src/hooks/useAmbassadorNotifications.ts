import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AmbassadorNotification {
  id: string;
  ambassador_id: string;
  type: 'payment_registered' | 'payment_confirmed' | 'commission_earned';
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export const useAmbassadorNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar notificações da embaixadora
  const useNotifications = (ambassadorId?: string) => {
    return useQuery({
      queryKey: ['ambassador-notifications', ambassadorId],
      queryFn: async () => {
        if (!ambassadorId) throw new Error('Ambassador ID não fornecido');
        
        const { data, error } = await supabase
          .from('ambassador_notifications')
          .select('*')
          .eq('ambassador_id', ambassadorId)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        return data as AmbassadorNotification[];
      },
      enabled: !!ambassadorId,
    });
  };

  // Contar notificações não lidas
  const useUnreadCount = (ambassadorId?: string) => {
    return useQuery({
      queryKey: ['ambassador-notifications-unread', ambassadorId],
      queryFn: async () => {
        if (!ambassadorId) throw new Error('Ambassador ID não fornecido');
        
        const { count, error } = await supabase
          .from('ambassador_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('ambassador_id', ambassadorId)
          .eq('read', false);
        
        if (error) throw error;
        return count || 0;
      },
      enabled: !!ambassadorId,
      refetchInterval: 30000, // Refetch every 30 seconds
    });
  };

  // Marcar notificação como lida
  const useMarkAsRead = () => {
    return useMutation({
      mutationFn: async (notificationId: string) => {
        const { error } = await supabase
          .from('ambassador_notifications')
          .update({ 
            read: true, 
            read_at: new Date().toISOString() 
          })
          .eq('id', notificationId);
        
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['ambassador-notifications'] });
        queryClient.invalidateQueries({ queryKey: ['ambassador-notifications-unread'] });
      },
    });
  };

  // Marcar todas como lidas
  const useMarkAllAsRead = () => {
    return useMutation({
      mutationFn: async (ambassadorId: string) => {
        const { error } = await supabase
          .from('ambassador_notifications')
          .update({ 
            read: true, 
            read_at: new Date().toISOString() 
          })
          .eq('ambassador_id', ambassadorId)
          .eq('read', false);
        
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['ambassador-notifications'] });
        queryClient.invalidateQueries({ queryKey: ['ambassador-notifications-unread'] });
      },
    });
  };

  return {
    useNotifications,
    useUnreadCount,
    useMarkAsRead,
    useMarkAllAsRead,
  };
};
