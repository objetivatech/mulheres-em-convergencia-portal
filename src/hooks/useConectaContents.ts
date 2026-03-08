import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useConectaContents() {
  const { user } = useAuth();

  const contentsQuery = useQuery({
    queryKey: ['conecta-contents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conecta_contents')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return {
    contents: contentsQuery.data || [],
    isLoading: contentsQuery.isLoading,
  };
}
