/**
 * Meu negócio — banco novo (MeC-v6), visão da dona.
 * As regras de acesso ficam no banco: `negocios` e suas tabelas filhas só
 * aceitam leitura/edição de quem é dona (`pessoa_id = pessoa_atual()`) ou admin.
 * A vitrine pública depende ainda da liberação do Diretório estar vigente.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMinhaPessoa } from '@/hooks/useMinhaArea';

const db = supabase as any;

const CAMPOS =
  'id, slug, nome, descricao, categoria, cidade, uf, bairro, telefone, whatsapp, email, site, instagram, logo_url, capa_url, publicado, destaque';

export type NegocioFilhos = {
  midias: any[];
  areas: any[];
  comodidades: any[];
};

export function useMeuNegocioCompleto() {
  const { data: pessoaId } = useMinhaPessoa();
  return useQuery({
    queryKey: ['meu-negocio', pessoaId],
    enabled: !!pessoaId,
    queryFn: async () => {
      const { data, error } = await db
        .from('negocios')
        .select(CAMPOS)
        .eq('pessoa_id', pessoaId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const [midias, areas, comodidades] = await Promise.all([
        db.from('negocio_midias').select('id, tipo, url, legenda, ordem').eq('negocio_id', data.id).order('ordem'),
        db.from('negocio_areas_atendimento').select('id, cidade, uf, bairro').eq('negocio_id', data.id),
        db.from('negocio_comodidades').select('id, nome').eq('negocio_id', data.id),
      ]);

      return {
        ...data,
        midias: midias.data ?? [],
        areas: areas.data ?? [],
        comodidades: comodidades.data ?? [],
      } as any;
    },
  });
}

export function useSalvarMeuNegocio() {
  const qc = useQueryClient();
  const { data: pessoaId } = useMinhaPessoa();
  return useMutation({
    mutationFn: async ({ id, valores }: { id?: string; valores: Record<string, any> }) => {
      if (id) {
        const { error } = await db.from('negocios').update(valores).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await db
        .from('negocios')
        .insert({ ...valores, pessoa_id: pessoaId })
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meu-negocio'] });
      qc.invalidateQueries({ queryKey: ['minha-area', 'negocio'] });
    },
  });
}

export function useFilhosMeuNegocio() {
  const qc = useQueryClient();
  const recarregar = () => qc.invalidateQueries({ queryKey: ['meu-negocio'] });

  const adicionar = useMutation({
    mutationFn: async ({ tabela, valores }: { tabela: string; valores: Record<string, any> }) => {
      const { error } = await db.from(tabela).insert(valores);
      if (error) throw error;
    },
    onSuccess: recarregar,
  });

  const remover = useMutation({
    mutationFn: async ({ tabela, id }: { tabela: string; id: string }) => {
      const { error } = await db.from(tabela).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: recarregar,
  });

  return { adicionar, remover };
}
