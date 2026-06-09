import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useConectaAccess } from './useConectaAccess';
import { toast } from 'sonner';

export function useConectaProfile() {
  const { user } = useConectaAccess();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['conecta-profile-full', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get conecta profile + main profile data
      const [{ data: conecta }, { data: main }] = await Promise.all([
        supabase.from('conecta_profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('profiles').select('full_name, email, avatar_url').eq('id', user.id).single(),
      ]);

      if (!conecta) return null;
      return { ...conecta, full_name: main?.full_name, email: main?.email, avatar_url: main?.avatar_url };
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!user?.id) throw new Error('Não autenticada');
      const { error } = await supabase
        .from('conecta_profiles')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conecta-profile-full', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['conecta-profile', user?.id] });
      // Profile is the SSOT — invalidate so Meu Painel reflects changes
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Perfil CONECTA+ atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar perfil');
    },
  });

  return {
    profile,
    isLoading,
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
  };
}
