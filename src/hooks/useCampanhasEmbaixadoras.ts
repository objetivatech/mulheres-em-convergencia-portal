/**
 * Campanhas de divulgação para embaixadoras.
 * Equipe (admin) cria/edita; embaixadoras com acesso vigente leem só as ativas no período (RLS).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export type Campanha = {
  id: string; titulo: string; descricao: string | null; mensagem: string; link_url: string | null;
  imagens: string[]; inicio_em: string | null; fim_em: string | null; ativo: boolean; ordem: number;
};

export function useCampanhas() {
  return useQuery({
    queryKey: ['campanhas-embaixadoras'],
    queryFn: async () => {
      const { data, error } = await db.from('embaixadora_campanhas').select('*')
        .order('ordem').order('criado_em', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Campanha[];
    },
  });
}

export function useSalvarCampanha() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, valores }: { id?: string; valores: Partial<Campanha> }) => {
      const r = id
        ? await db.from('embaixadora_campanhas').update(valores).eq('id', id)
        : await db.from('embaixadora_campanhas').insert(valores);
      if (r.error) throw r.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campanhas-embaixadoras'] }),
  });
}

export function useExcluirCampanha() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('embaixadora_campanhas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campanhas-embaixadoras'] }),
  });
}

/**
 * Coloca o código da embaixadora no link da campanha (?indicacao=codigo).
 * Links de fora do portal ficam como estão.
 */
export function linkComIndicacao(url: string | null | undefined, codigo?: string | null) {
  const base = url?.trim() || '/planos';
  try {
    const u = new URL(base, window.location.origin);
    if (codigo && u.origin === window.location.origin) u.searchParams.set('indicacao', codigo);
    return u.toString();
  } catch {
    return base;
  }
}

/** Troca {link} e {nome} na mensagem; se não houver {link}, coloca no fim. */
export function montarMensagem(mensagem: string, link: string, nome?: string) {
  let t = (mensagem || '').replace(/\{nome\}/g, nome ?? '');
  t = t.includes('{link}') ? t.replace(/\{link\}/g, link) : `${t.trim()}\n\n${link}`;
  return t.trim();
}
