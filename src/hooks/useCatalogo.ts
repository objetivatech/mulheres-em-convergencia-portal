/**
 * Catálogo de produtos/serviços e avaliações dos negócios (banco novo).
 * Permissão no banco: leitura pública; escrita só da dona do negócio ou admin.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export type Produto = {
  id: string; negocio_id: string; nome: string; descricao: string; valor_centavos: number | null;
  categoria: string | null; link_compra: string | null; fotos: string[]; destaque_tag: string | null;
  ordem: number; ativo: boolean;
};

export const TAGS_DESTAQUE: Record<string, { rotulo: string; emoji: string }> = {
  destaque: { rotulo: 'Destaque', emoji: '🌟' },
  promocao: { rotulo: 'Promoção', emoji: '🔥' },
  oferta: { rotulo: 'Oferta', emoji: '🏷️' },
  mais_vendido: { rotulo: 'Mais vendido', emoji: '👑' },
};

export const reais = (c?: number | null) =>
  c == null ? null : (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function useProdutos(negocioId?: string, todos = false) {
  return useQuery({
    queryKey: ['catalogo', 'produtos', negocioId, todos],
    enabled: !!negocioId,
    queryFn: async () => {
      let q = db.from('negocio_produtos').select('*').eq('negocio_id', negocioId).order('ordem').order('criado_em');
      if (!todos) q = q.eq('ativo', true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Produto[];
    },
  });
}

export function useSalvarProduto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, valores }: { id?: string; valores: Partial<Produto> }) => {
      const r = id
        ? await db.from('negocio_produtos').update(valores).eq('id', id)
        : await db.from('negocio_produtos').insert(valores);
      if (r.error) throw r.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogo'] }),
  });
}

export function useExcluirProduto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('negocio_produtos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogo'] }),
  });
}

/* ------------------------------------------------------------- Avaliações */

export type ResumoNota = { media: number; total: number };

/** Média e total de avaliações aprovadas por negócio (calculado na hora, nada gravado). */
export function useResumoAvaliacoes() {
  return useQuery({
    queryKey: ['catalogo', 'resumo-avaliacoes'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await db.from('negocio_avaliacoes').select('negocio_id, nota').eq('status', 'aprovado').limit(10000);
      if (error) throw error;
      const soma = new Map<string, { s: number; n: number }>();
      (data ?? []).forEach((a: any) => {
        const x = soma.get(a.negocio_id) ?? { s: 0, n: 0 };
        x.s += a.nota; x.n += 1; soma.set(a.negocio_id, x);
      });
      const mapa = new Map<string, ResumoNota>();
      soma.forEach((v, k) => mapa.set(k, { media: v.s / v.n, total: v.n }));
      return mapa;
    },
  });
}

export function useAvaliacoes(negocioId?: string, todas = false) {
  return useQuery({
    queryKey: ['catalogo', 'avaliacoes', negocioId, todas],
    enabled: !!negocioId,
    queryFn: async () => {
      let q = db.from('negocio_avaliacoes').select('*').eq('negocio_id', negocioId).order('criado_em', { ascending: false });
      if (!todas) q = q.eq('status', 'aprovado');
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as { id: string; avaliador_nome: string; nota: number; comentario: string | null; status: string; criado_em: string }[];
    },
  });
}

export function useEnviarAvaliacao() {
  return useMutation({
    mutationFn: async (v: { negocio_id: string; avaliador_nome: string; nota: number; comentario?: string }) => {
      const { error } = await db.from('negocio_avaliacoes').insert({ ...v, status: 'pendente' });
      if (error) throw error;
    },
  });
}

export function useModerarAvaliacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'aprovado' | 'rejeitado' }) => {
      const { error } = await db.from('negocio_avaliacoes').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogo'] }),
  });
}
