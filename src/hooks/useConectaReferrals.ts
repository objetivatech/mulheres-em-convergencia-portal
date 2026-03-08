import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useConectaAccess } from './useConectaAccess';
import { toast } from 'sonner';

export function useConectaReferrals() {
  const { user } = useConectaAccess();
  const queryClient = useQueryClient();

  const fetchProfiles = async (ids: string[]) => {
    if (!ids.length) return {};
    const { data } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', ids);
    const map: Record<string, any> = {};
    data?.forEach(p => { map[p.id] = p; });
    return map;
  };

  const { data: sentReferrals, isLoading: ls } = useQuery({
    queryKey: ['conecta-referrals', 'sent', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('conecta_referrals').select('*').eq('from_user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      const profiles = await fetchProfiles(data.map(r => r.to_user_id));
      return data.map(r => ({ ...r, to_user: profiles[r.to_user_id] }));
    },
    enabled: !!user?.id,
  });

  const { data: receivedReferrals, isLoading: lr } = useQuery({
    queryKey: ['conecta-referrals', 'received', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('conecta_referrals').select('*').eq('to_user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      const profiles = await fetchProfiles(data.map(r => r.from_user_id));
      return data.map(r => ({ ...r, from_user: profiles[r.from_user_id] }));
    },
    enabled: !!user?.id,
  });

  const createReferral = useMutation({
    mutationFn: async (input: { to_user_id: string; contact_name: string; contact_phone?: string; contact_email?: string; notes?: string; temperature?: string }) => {
      if (!user?.id) throw new Error('Não autenticada');
      const { error } = await supabase.from('conecta_referrals').insert({
        from_user_id: user.id, to_user_id: input.to_user_id,
        contact_name: input.contact_name, contact_phone: input.contact_phone || null,
        contact_email: input.contact_email || null, notes: input.notes || null,
        temperature: input.temperature || 'warm',
      });
      if (error) throw error;

      // Send email notification
      try {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        await supabase.functions.invoke('send-conecta-email', {
          body: {
            action: 'new_referral',
            to_user_id: input.to_user_id,
            from_user_name: profile?.full_name || 'Uma membro',
            contact_name: input.contact_name,
            temperature: input.temperature || 'warm',
          },
        });
      } catch (e) {
        console.error('Failed to send referral email:', e);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['conecta-referrals'] }); queryClient.invalidateQueries({ queryKey: ['conecta-stats'] }); toast.success('Indicação enviada!'); },
    onError: () => toast.error('Erro ao enviar indicação'),
  });

  const deleteReferral = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('conecta_referrals').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['conecta-referrals'] }); toast.success('Indicação removida'); },
  });

  return { sentReferrals, receivedReferrals, isLoading: ls || lr, createReferral, deleteReferral };
}
