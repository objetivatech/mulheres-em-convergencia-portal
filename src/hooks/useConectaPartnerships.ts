import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useConectaAccess } from './useConectaAccess';
import { toast } from 'sonner';

export interface ConectaPartnership {
  id: string;
  partner_a_id: string;
  partner_b_id: string;
  title: string;
  description: string | null;
  category: string;
  photo_url: string | null;
  created_at: string;
  partner_a?: { full_name: string; avatar_url: string | null };
  partner_b?: { full_name: string; avatar_url: string | null };
}

export function useConectaPartnerships() {
  const { user } = useConectaAccess();
  const queryClient = useQueryClient();

  const { data: partnerships, isLoading } = useQuery({
    queryKey: ['conecta-partnerships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conecta_partnerships')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch profiles for all partners
      const ids = new Set<string>();
      data.forEach(p => { ids.add(p.partner_a_id); ids.add(p.partner_b_id); });
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', Array.from(ids));

      const profileMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
      profiles?.forEach(p => { profileMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url }; });

      return data.map(p => ({
        ...p,
        partner_a: profileMap[p.partner_a_id] || null,
        partner_b: profileMap[p.partner_b_id] || null,
      })) as ConectaPartnership[];
    },
    enabled: !!user?.id,
  });

  const myPartnerships = partnerships?.filter(
    p => p.partner_a_id === user?.id || p.partner_b_id === user?.id
  );

  const createPartnership = useMutation({
    mutationFn: async (input: { partner_b_id: string; title: string; description?: string; category: string }) => {
      if (!user?.id) throw new Error('Não autenticada');
      const { error } = await supabase.from('conecta_partnerships').insert({
        partner_a_id: user.id,
        partner_b_id: input.partner_b_id,
        title: input.title,
        description: input.description || null,
        category: input.category,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-partnerships'] });
      queryClient.invalidateQueries({ queryKey: ['conecta-stats'] });
      toast.success('Parceria registrada!');
    },
    onError: () => toast.error('Erro ao registrar parceria'),
  });

  const deletePartnership = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('conecta_partnerships').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-partnerships'] });
      toast.success('Parceria removida');
    },
  });

  return { partnerships, myPartnerships, isLoading, createPartnership, deletePartnership };
}
