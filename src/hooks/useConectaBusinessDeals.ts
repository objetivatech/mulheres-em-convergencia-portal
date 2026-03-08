import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useConectaAccess } from './useConectaAccess';
import { toast } from 'sonner';

export function useConectaBusinessDeals() {
  const { user } = useConectaAccess();
  const queryClient = useQueryClient();

  const fetchProfiles = async (ids: string[]) => {
    if (!ids.length) return {};
    const { data } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', ids.filter(Boolean));
    const map: Record<string, any> = {};
    data?.forEach(p => { map[p.id] = p; });
    return map;
  };

  const { data: myDeals, isLoading: lm } = useQuery({
    queryKey: ['conecta-deals', 'my', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('conecta_business_deals').select('*').eq('closed_by_user_id', user!.id).order('deal_date', { ascending: false });
      if (error) throw error;
      const profiles = await fetchProfiles(data.map(d => d.referred_by_user_id).filter(Boolean) as string[]);
      return data.map(d => ({ ...d, referred_by: d.referred_by_user_id ? profiles[d.referred_by_user_id] : null }));
    },
    enabled: !!user?.id,
  });

  const { data: referredDeals, isLoading: lr } = useQuery({
    queryKey: ['conecta-deals', 'referred', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('conecta_business_deals').select('*').eq('referred_by_user_id', user!.id).order('deal_date', { ascending: false });
      if (error) throw error;
      const profiles = await fetchProfiles(data.map(d => d.closed_by_user_id));
      return data.map(d => ({ ...d, closed_by: profiles[d.closed_by_user_id] }));
    },
    enabled: !!user?.id,
  });

  const createDeal = useMutation({
    mutationFn: async (input: { referred_by_user_id?: string; client_name?: string; description?: string; value: number; deal_date: string }) => {
      if (!user?.id) throw new Error('Não autenticada');
      const { error } = await supabase.from('conecta_business_deals').insert({
        closed_by_user_id: user.id, referred_by_user_id: input.referred_by_user_id || null,
        client_name: input.client_name || null, description: input.description || null,
        value: input.value, deal_date: input.deal_date,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['conecta-deals'] }); queryClient.invalidateQueries({ queryKey: ['conecta-stats'] }); toast.success('Negócio registrado!'); },
    onError: () => toast.error('Erro ao registrar negócio'),
  });

  const deleteDeal = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('conecta_business_deals').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['conecta-deals'] }); toast.success('Negócio removido'); },
  });

  return { myDeals, referredDeals, isLoading: lm || lr, createDeal, deleteDeal };
}
