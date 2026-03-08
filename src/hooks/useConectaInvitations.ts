import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useConectaInvitations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invitationsQuery = useQuery({
    queryKey: ['conecta-invitations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conecta_invitations')
        .select('*')
        .eq('invited_by', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createInvitation = useMutation({
    mutationFn: async ({ guestName, guestEmail, meetingId }: { guestName: string; guestEmail?: string; meetingId?: string }) => {
      const code = `CONECTA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const { error } = await supabase
        .from('conecta_invitations')
        .insert({
          invited_by: user!.id,
          guest_name: guestName,
          guest_email: guestEmail || null,
          meeting_id: meetingId || null,
          code,
          status: 'pending',
        });
      if (error) throw error;
      return code;
    },
    onSuccess: (code) => {
      toast.success(`Convite criado! Código: ${code}`);
      queryClient.invalidateQueries({ queryKey: ['conecta-invitations'] });
    },
    onError: () => toast.error('Erro ao criar convite'),
  });

  return {
    invitations: invitationsQuery.data || [],
    isLoading: invitationsQuery.isLoading,
    createInvitation,
  };
}
