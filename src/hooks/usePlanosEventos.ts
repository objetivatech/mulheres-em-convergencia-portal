/**
 * Planos e eventos — banco novo (MeC-v6).
 * Vagas ocupadas vêm da visão v_evento_vagas (contagem, nunca contador gravado).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Plano = {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  tipo: string;
  valor_centavos: number;
  periodicidade: string;
  beneficios: string[];
  destaque: boolean;
  ordem: number;
};

export type Evento = {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  descricao: string | null;
  capa_url: string | null;
  online: boolean;
  link_online: string | null;
  local_nome: string | null;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  inicio_em: string;
  fim_em: string | null;
  vagas: number | null;
  gratuito: boolean;
  destaque: boolean;
};

export type Lote = {
  id: string;
  nome: string;
  valor_centavos: number;
  vagas: number | null;
  inicio_em: string | null;
  fim_em: string | null;
  ordem: number;
  ativo: boolean;
};

export const dinheiro = (centavos: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((centavos ?? 0) / 100);

export const dataLonga = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const CAMPOS_EVENTO =
  'id, slug, titulo, resumo, descricao, capa_url, online, link_online, local_nome, endereco, cidade, uf, inicio_em, fim_em, vagas, gratuito, destaque';

export function usePlanos() {
  return useQuery({
    queryKey: ['planos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planos')
        .select('id, slug, nome, descricao, tipo, valor_centavos, periodicidade, beneficios, destaque, ordem')
        .eq('ativo', true)
        .order('ordem');
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        ...p,
        beneficios: Array.isArray(p.beneficios) ? p.beneficios : [],
      })) as Plano[];
    },
  });
}

export function useEventos(opcoes: { futuros?: boolean } = {}) {
  const { futuros = true } = opcoes;
  return useQuery({
    queryKey: ['eventos', futuros],
    queryFn: async () => {
      let q = supabase
        .from('eventos')
        .select(CAMPOS_EVENTO)
        .eq('publicado', true)
        .order('inicio_em', { ascending: futuros });
      if (futuros) q = q.gte('inicio_em', new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString());
      else q = q.lt('inicio_em', new Date().toISOString());
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Evento[];
    },
  });
}

export function useEvento(slug?: string) {
  return useQuery({
    queryKey: ['evento', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select(
          `${CAMPOS_EVENTO}, lotes:evento_lotes(id, nome, valor_centavos, vagas, inicio_em, fim_em, ordem, ativo), palestrantes:evento_palestrantes(id, nome, minibio, foto_url, ordem)`
        )
        .eq('slug', slug!)
        .eq('publicado', true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const { data: vagas } = await supabase
        .from('v_evento_vagas')
        .select('ocupadas, disponiveis')
        .eq('evento_id', (data as any).id)
        .maybeSingle();

      return {
        ...(data as any),
        lotes: ((data as any).lotes ?? []).sort((a: Lote, b: Lote) => a.ordem - b.ordem),
        palestrantes: ((data as any).palestrantes ?? []).sort((a: any, b: any) => a.ordem - b.ordem),
        ocupadas: Number(vagas?.ocupadas ?? 0),
        disponiveis: vagas?.disponiveis === null || vagas?.disponiveis === undefined ? null : Number(vagas.disponiveis),
      } as Evento & {
        lotes: Lote[];
        palestrantes: { id: string; nome: string; minibio: string | null; foto_url: string | null }[];
        ocupadas: number;
        disponiveis: number | null;
      };
    },
  });
}

/** Lote em vendas agora: janela de datas + ativo. */
export function loteVigente(lotes: Lote[] = []) {
  const agora = Date.now();
  return (
    lotes.find(
      (l) =>
        l.ativo &&
        (!l.inicio_em || new Date(l.inicio_em).getTime() <= agora) &&
        (!l.fim_em || new Date(l.fim_em).getTime() > agora)
    ) ?? null
  );
}

export function useMinhasInscricoes() {
  return useQuery({
    queryKey: ['minhas-inscricoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evento_inscricoes')
        .select('id, situacao, valor_centavos, criado_em, evento:eventos(slug, titulo, inicio_em, local_nome, cidade, online)')
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}
