/**
 * Administração do programa de embaixadoras no banco novo (MeC-v6).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export function useEmbaixadorasAdmin() {
  return useQuery({
    queryKey: ['painel', 'embaixadoras'],
    queryFn: async () => {
      const [fichas, niveis, materiais, repasses, resumo] = await Promise.all([
        db
          .from('embaixadoras')
          .select('*, pessoa:pessoas(id, nome, nome_social), nivel:embaixadora_niveis(id, nome, comissao_percentual)')
          .order('criado_em', { ascending: false }),
        db.from('embaixadora_niveis').select('*').order('ordem'),
        db.from('embaixadora_materiais').select('*').order('ordem'),
        db.from('embaixadora_repasses').select('*').order('competencia', { ascending: false }),
        db.from('v_embaixadora_resumo').select('*'),
      ]);
      return {
        fichas: (fichas.data ?? []) as any[],
        niveis: (niveis.data ?? []) as any[],
        materiais: (materiais.data ?? []) as any[],
        repasses: (repasses.data ?? []) as any[],
        resumo: (resumo.data ?? []) as any[],
      };
    },
  });
}

function usarMutacao<T>(fn: (valores: T) => Promise<void>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['painel', 'embaixadoras'] });
      qc.invalidateQueries({ queryKey: ['minha-area', 'embaixadora'] });
    },
  });
}

export function useSalvarEmbaixadora() {
  return usarMutacao(async (ficha: Record<string, any>) => {
    const { id, ...resto } = ficha;
    if (id) {
      const { error } = await db.from('embaixadoras').update(resto).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await db.from('embaixadoras').insert(resto);
      if (error) throw error;
    }
  });
}

export function useSalvarNivel() {
  return usarMutacao(async (nivel: Record<string, any>) => {
    const { id, ...resto } = nivel;
    if (id) {
      const { error } = await db.from('embaixadora_niveis').update(resto).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await db.from('embaixadora_niveis').insert(resto);
      if (error) throw error;
    }
  });
}

export function useSalvarMaterial() {
  return usarMutacao(async (material: Record<string, any>) => {
    const { id, ...resto } = material;
    if (id) {
      const { error } = await db.from('embaixadora_materiais').update(resto).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await db.from('embaixadora_materiais').insert(resto);
      if (error) throw error;
    }
  });
}

export function useExcluirMaterial() {
  return usarMutacao(async (id: string) => {
    const { error } = await db.from('embaixadora_materiais').delete().eq('id', id);
    if (error) throw error;
  });
}

export function useSalvarRepasse() {
  return usarMutacao(async (repasse: Record<string, any>) => {
    const { id, ...resto } = repasse;
    if (id) {
      const { error } = await db.from('embaixadora_repasses').update(resto).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await db.from('embaixadora_repasses').insert(resto);
      if (error) throw error;
    }
  });
}

export function useBuscarPessoas(termo: string) {
  return useQuery({
    queryKey: ['painel', 'buscar-pessoas', termo],
    enabled: termo.trim().length >= 3,
    queryFn: async () => {
      const { data, error } = await db.rpc('buscar_pessoas', { _termo: termo.trim(), _limite: 10 });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}
