/**
 * Conteúdos editáveis do site: linha do tempo e parceiros (banco novo MeC-v6).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Marco = {
  id: string;
  ano: number;
  rotulo: string | null;
  titulo: string;
  descricao: string | null;
  imagem_url: string | null;
  ordem: number;
  ativo: boolean;
};

export type Parceiro = {
  id: string;
  nome: string;
  logo_url: string | null;
  site: string | null;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
};

export function useMarcos(somenteAtivos = true) {
  return useQuery({
    queryKey: ['marcos', somenteAtivos],
    queryFn: async () => {
      let q = supabase
        .from('marcos_linha_tempo')
        .select('id, ano, rotulo, titulo, descricao, imagem_url, ordem, ativo')
        .order('ano', { ascending: true })
        .order('ordem', { ascending: true });
      if (somenteAtivos) q = q.eq('ativo', true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Marco[];
    },
  });
}

export function useParceiros(somenteAtivos = true) {
  return useQuery({
    queryKey: ['parceiros', somenteAtivos],
    queryFn: async () => {
      let q = supabase
        .from('parceiros')
        .select('id, nome, logo_url, site, descricao, ordem, ativo')
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true });
      if (somenteAtivos) q = q.eq('ativo', true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Parceiro[];
    },
  });
}

export function useSalvarMarco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: Partial<Marco> & { titulo: string; ano: number }) => {
      const { id, ...campos } = m;
      const { error } = id
        ? await supabase.from('marcos_linha_tempo').update(campos).eq('id', id)
        : await supabase.from('marcos_linha_tempo').insert(campos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marcos'] }),
  });
}

export function useExcluirMarco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('marcos_linha_tempo').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marcos'] }),
  });
}

export function useSalvarParceiro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<Parceiro> & { nome: string }) => {
      const { id, ...campos } = p;
      const { error } = id
        ? await supabase.from('parceiros').update(campos).eq('id', id)
        : await supabase.from('parceiros').insert(campos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parceiros'] }),
  });
}

export function useExcluirParceiro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('parceiros').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parceiros'] }),
  });
}
