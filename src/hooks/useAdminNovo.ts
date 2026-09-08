/**
 * Administração — banco novo (MeC-v6).
 * Pessoas, financeiro, CRM e automações. Toda permissão é resolvida por RLS
 * (`e_admin()`); as consultas aqui apenas montam a interface.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

/* --------------------------------------------------------------- Pessoas */

export function useBuscarPessoas(termo: string) {
  return useQuery({
    queryKey: ['admin', 'pessoas', termo],
    queryFn: async () => {
      const { data, error } = await db.rpc('buscar_pessoas', { _termo: termo, _limite: 60 });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useFichaPessoa(pessoaId?: string) {
  return useQuery({
    queryKey: ['admin', 'pessoa', pessoaId],
    enabled: !!pessoaId,
    queryFn: async () => {
      const [perfil, acessos, pagamentos, inscricoes, negocios, linha] = await Promise.all([
        db.from('v_meu_perfil').select('*').eq('pessoa_id', pessoaId).maybeSingle(),
        db.from('concessoes_acesso').select('*').eq('pessoa_id', pessoaId).order('inicio_em', { ascending: false }),
        db.from('pagamentos').select('id, descricao, valor_centavos, situacao, vencimento_em, confirmado_em, criado_em').eq('pessoa_id', pessoaId).order('criado_em', { ascending: false }),
        db.from('evento_inscricoes').select('id, situacao, criado_em, evento:eventos(titulo, inicio_em)').eq('pessoa_id', pessoaId).order('criado_em', { ascending: false }),
        db.from('negocios').select('id, nome, slug, publicado').eq('pessoa_id', pessoaId),
        db.from('v_linha_tempo').select('*').eq('pessoa_id', pessoaId).order('ocorrido_em', { ascending: false }).limit(80),
      ]);
      return {
        perfil: perfil.data as any,
        acessos: (acessos.data ?? []) as any[],
        pagamentos: (pagamentos.data ?? []) as any[],
        inscricoes: (inscricoes.data ?? []) as any[],
        negocios: (negocios.data ?? []) as any[],
        linha: (linha.data ?? []) as any[],
      };
    },
  });
}

export function usePapeis() {
  const qc = useQueryClient();
  const conceder = useMutation({
    mutationFn: async ({ pessoaId, papel }: { pessoaId: string; papel: string }) => {
      const { error } = await db.rpc('conceder_papel', { _pessoa_id: pessoaId, _papel: papel });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
  const revogar = useMutation({
    mutationFn: async ({ pessoaId, papel }: { pessoaId: string; papel: string }) => {
      const { error } = await db.rpc('revogar_papel', { _pessoa_id: pessoaId, _papel: papel });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
  return { conceder, revogar };
}

export function useConcederCortesia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pessoaId, tipo, dias, motivo,
    }: { pessoaId: string; tipo: string; dias: number; motivo: string }) => {
      const fim = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await db.from('concessoes_acesso').insert({
        pessoa_id: pessoaId,
        tipo,
        origem: 'cortesia',
        inicio_em: new Date().toISOString(),
        fim_em: fim,
        motivo,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

export function useRevogarAcesso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { error } = await db
        .from('concessoes_acesso')
        .update({ revogado_em: new Date().toISOString(), revogado_motivo: motivo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

/* ------------------------------------------------------------ Financeiro */

export function useFinanceiro(desde: string, ate: string) {
  return useQuery({
    queryKey: ['admin', 'financeiro', desde, ate],
    queryFn: async () => {
      const [pagamentos, mensal, inscricoes] = await Promise.all([
        db
          .from('pagamentos')
          .select('id, descricao, valor_centavos, situacao, vencimento_em, confirmado_em, criado_em, pessoa:pessoas(nome)')
          .gte('criado_em', desde)
          .lte('criado_em', `${ate}T23:59:59`)
          .order('criado_em', { ascending: false })
          .limit(1000),
        db.from('v_financeiro_mensal').select('*').order('mes', { ascending: false }).limit(24),
        db
          .from('evento_inscricoes')
          .select('id, situacao, valor_centavos, evento:eventos(titulo)')
          .gte('criado_em', desde)
          .limit(1000),
      ]);
      return {
        pagamentos: (pagamentos.data ?? []) as any[],
        mensal: (mensal.data ?? []) as any[],
        inscricoes: (inscricoes.data ?? []) as any[],
      };
    },
  });
}

/* ------------------------------------------------------------------ CRM */

export function useFunil() {
  return useQuery({
    queryKey: ['admin', 'funil'],
    queryFn: async () => {
      const { data: funis } = await db.from('funis').select('id, slug, nome').eq('ativo', true).order('ordem');
      const funil = (funis ?? [])[0];
      if (!funil) return { funil: null, estagios: [], negociacoes: [] };
      const [estagios, negociacoes] = await Promise.all([
        db.from('funil_estagios').select('*').eq('funil_id', funil.id).order('ordem'),
        db
          .from('negociacoes')
          .select('id, titulo, valor_centavos, estagio_id, contato_nome, contato_email, criado_em, pessoa:pessoas(nome)')
          .eq('funil_id', funil.id)
          .order('criado_em', { ascending: false })
          .limit(500),
      ]);
      return {
        funil,
        estagios: (estagios.data ?? []) as any[],
        negociacoes: (negociacoes.data ?? []) as any[],
      };
    },
  });
}

export function useSalvarNegociacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, valores }: { id?: string; valores: Record<string, any> }) => {
      if (id) {
        const { error } = await db.from('negociacoes').update(valores).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await db.from('negociacoes').insert(valores);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'funil'] }),
  });
}

export function useExcluirNegociacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('negociacoes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'funil'] }),
  });
}

/* ------------------------------------------------------------ Automações */

export function useAutomacoes() {
  return useQuery({
    queryKey: ['admin', 'automacoes'],
    refetchInterval: 60 * 1000,
    queryFn: async () => {
      const [webhooks, pendentes, campanhas, concessoes] = await Promise.all([
        db
          .from('webhooks_recebidos')
          .select('id, provedor, tipo_evento, recebido_em, processado_em, tentativas, erro')
          .order('recebido_em', { ascending: false })
          .limit(30),
        db
          .from('pagamentos')
          .select('id, descricao, situacao, criado_em')
          .eq('situacao', 'pendente')
          .order('criado_em', { ascending: false })
          .limit(20),
        db
          .from('campanhas_email')
          .select('id, chave, assunto, situacao, disparado_em')
          .order('criado_em', { ascending: false })
          .limit(10),
        db
          .from('concessoes_acesso')
          .select('id, tipo, origem, inicio_em, fim_em, pessoa:pessoas(nome)')
          .order('criado_em', { ascending: false })
          .limit(20),
      ]);
      return {
        webhooks: (webhooks.data ?? []) as any[],
        pendentes: (pendentes.data ?? []) as any[],
        campanhas: (campanhas.data ?? []) as any[],
        concessoes: (concessoes.data ?? []) as any[],
      };
    },
  });
}

export function useReprocessarWebhooks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('asaas-webhook-reprocessar', { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'automacoes'] }),
  });
}
