import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useConectaAccess } from './useConectaAccess';
import { toast } from 'sonner';

export function useConectaTestimonials() {
  const { user } = useConectaAccess();
  const queryClient = useQueryClient();

  const fetchProfiles = async (ids: string[]) => {
    if (!ids.length) return {};
    const { data } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', ids);
    const map: Record<string, any> = {};
    data?.forEach(p => { map[p.id] = p; });
    return map;
  };

  const { data: sentTestimonials, isLoading: ls } = useQuery({
    queryKey: ['conecta-testimonials', 'sent', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('conecta_testimonials').select('*').eq('from_user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      const profiles = await fetchProfiles(data.map(t => t.to_user_id));
      return data.map(t => ({ ...t, to_user: profiles[t.to_user_id] }));
    },
    enabled: !!user?.id,
  });

  const { data: receivedTestimonials, isLoading: lr } = useQuery({
    queryKey: ['conecta-testimonials', 'received', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('conecta_testimonials').select('*').eq('to_user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      const profiles = await fetchProfiles(data.map(t => t.from_user_id));
      return data.map(t => ({ ...t, from_user: profiles[t.from_user_id] }));
    },
    enabled: !!user?.id,
  });

  const createTestimonial = useMutation({
    mutationFn: async (input: { to_user_id: string; content: string }) => {
      if (!user?.id) throw new Error('Não autenticada');
      const { error } = await supabase.from('conecta_testimonials').insert({ from_user_id: user.id, to_user_id: input.to_user_id, content: input.content });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['conecta-testimonials'] }); queryClient.invalidateQueries({ queryKey: ['conecta-stats'] }); toast.success('Depoimento enviado!'); },
    onError: () => toast.error('Erro ao enviar depoimento'),
  });

  const deleteTestimonial = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('conecta_testimonials').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['conecta-testimonials'] }); toast.success('Depoimento removido'); },
  });

  return { sentTestimonials, receivedTestimonials, isLoading: ls || lr, createTestimonial, deleteTestimonial };
}
