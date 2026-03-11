import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ConectaContent {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  url: string | null;
  thumbnail_url: string | null;
  created_at: string;
  active: boolean;
}

export function useConectaContents() {
  const { user } = useAuth();

  const contentsQuery = useQuery({
    queryKey: ['conecta-contents-only'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conecta_contents')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ConectaContent[];
    },
    enabled: !!user,
  });

  return {
    contents: contentsQuery.data || [],
    isLoading: contentsQuery.isLoading,
  };
}
