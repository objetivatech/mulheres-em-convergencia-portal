import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Depoimento = {
  id: string; nome: string; texto: string; descricao: string | null; foto_url: string | null;
  nota: number | null; origem: 'manual' | 'google'; link_origem: string | null; ordem: number; ativo: boolean;
};

export function useDepoimentos(todos = false) {
  return useQuery({
    queryKey: ['depoimentos', todos],
    queryFn: async () => {
      let q = supabase.from('depoimentos').select('*').order('ordem').order('criado_em', { ascending: false });
      if (!todos) q = q.eq('ativo', true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Depoimento[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSalvarDepoimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, valores }: { id?: string; valores: Partial<Depoimento> }) => {
      const { error } = id
        ? await supabase.from('depoimentos').update(valores).eq('id', id)
        : await supabase.from('depoimentos').insert(valores);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['depoimentos'] }),
  });
}

export function useExcluirDepoimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('depoimentos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['depoimentos'] }),
  });
}
