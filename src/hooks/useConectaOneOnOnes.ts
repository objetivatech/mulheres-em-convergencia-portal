import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useConectaAccess } from './useConectaAccess';
import { toast } from 'sonner';

export interface ConectaOneOnOne {
  id: string;
  user_id: string;
  partner_id: string | null;
  meeting_type: string;
  guest_name: string | null;
  guest_company: string | null;
  notes: string | null;
  meeting_date: string;
  photo_url: string | null;
  created_at: string;
  partner?: { full_name: string; company: string | null; avatar_url: string | null } | null;
}

export function useConectaOneOnOnes() {
  const { user } = useConectaAccess();
  const queryClient = useQueryClient();

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['conecta-one-on-ones', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('conecta_one_on_ones')
        .select('*')
        .eq('user_id', user.id)
        .order('meeting_date', { ascending: false });
      if (error) throw error;

      // Fetch partner profiles
      const partnerIds = data.filter(m => m.partner_id).map(m => m.partner_id!);
      const partnersMap: Record<string, { full_name: string; company: string | null; avatar_url: string | null }> = {};
      if (partnerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', partnerIds);
        // Get company from conecta_profiles
        const { data: conectaProfiles } = await supabase
          .from('conecta_profiles')
          .select('id, company')
          .in('id', partnerIds);
        const companyMap: Record<string, string | null> = {};
        conectaProfiles?.forEach(cp => { companyMap[cp.id] = cp.company; });
        profiles?.forEach(p => {
          partnersMap[p.id] = { full_name: p.full_name, company: companyMap[p.id] || null, avatar_url: p.avatar_url };
        });
      }

      return data.map(m => ({
        ...m,
        partner: m.partner_id ? partnersMap[m.partner_id] || null : null,
      })) as ConectaOneOnOne[];
    },
    enabled: !!user?.id,
  });

  const createOneOnOne = useMutation({
    mutationFn: async (input: {
      meeting_type: string;
      partner_id?: string;
      guest_name?: string;
      guest_company?: string;
      notes?: string;
      meeting_date: string;
      photo_url?: string;
    }) => {
      if (!user?.id) throw new Error('Não autenticada');
      const { error } = await supabase.from('conecta_one_on_ones').insert({
        user_id: user.id,
        meeting_type: input.meeting_type,
        partner_id: input.meeting_type === 'membro' ? input.partner_id || null : null,
        guest_name: input.meeting_type === 'convidado' ? input.guest_name || null : null,
        guest_company: input.meeting_type === 'convidado' ? input.guest_company || null : null,
        notes: input.notes || null,
        meeting_date: input.meeting_date,
        photo_url: input.photo_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-one-on-ones'] });
      queryClient.invalidateQueries({ queryKey: ['conecta-stats'] });
      queryClient.invalidateQueries({ queryKey: ['conecta-activity-feed'] });
      toast.success('Reunião 1-a-1 registrada!');
    },
    onError: () => toast.error('Erro ao registrar reunião'),
  });

  const deleteOneOnOne = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('conecta_one_on_ones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-one-on-ones'] });
      queryClient.invalidateQueries({ queryKey: ['conecta-stats'] });
      toast.success('Reunião removida');
    },
  });

  return { meetings, isLoading, createOneOnOne, deleteOneOnOne };
}
