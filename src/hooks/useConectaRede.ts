/**
 * Conecta+ — conexões entre associadas e mensagens diretas (banco novo MeC-v6).
 * Tudo é fato gravado: convites em conecta_conexoes, mensagens em conecta_mensagens.
 */
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMinhaPessoa } from '@/hooks/useMinhaArea';

const db = supabase as any;

export type Conexao = {
  id: string;
  de_pessoa_id: string;
  para_pessoa_id: string;
  situacao: 'pendente' | 'aceita' | 'recusada';
  mensagem: string | null;
  criado_em: string;
  respondido_em: string | null;
};

export type Mensagem = {
  id: string;
  de_pessoa_id: string;
  para_pessoa_id: string;
  conteudo: string;
  lida_em: string | null;
  criado_em: string;
};

/** Todas as conexões em que a associada participa (pendentes, aceitas e recusadas). */
export function useMinhasConexoes() {
  const { data: pessoaId } = useMinhaPessoa();
  return useQuery({
    queryKey: ['conecta', 'conexoes', pessoaId],
    enabled: !!pessoaId,
    queryFn: async () => {
      const { data, error } = await db
        .from('conecta_conexoes')
        .select('id, de_pessoa_id, para_pessoa_id, situacao, mensagem, criado_em, respondido_em')
        .order('criado_em', { ascending: false });
      if (error) throw error;
      const linhas = (data ?? []) as Conexao[];
      return {
        todas: linhas,
        aceitas: linhas.filter((c) => c.situacao === 'aceita'),
        recebidasPendentes: linhas.filter((c) => c.situacao === 'pendente' && c.para_pessoa_id === pessoaId),
        enviadasPendentes: linhas.filter((c) => c.situacao === 'pendente' && c.de_pessoa_id === pessoaId),
      };
    },
  });
}

export function useConvidarConexao() {
  const qc = useQueryClient();
  const { data: pessoaId } = useMinhaPessoa();
  return useMutation({
    mutationFn: async ({ paraPessoaId, mensagem }: { paraPessoaId: string; mensagem?: string }) => {
      const { error } = await db.from('conecta_conexoes').insert({
        de_pessoa_id: pessoaId,
        para_pessoa_id: paraPessoaId,
        mensagem: mensagem?.trim() || null,
        situacao: 'pendente',
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conecta', 'conexoes'] }),
  });
}

export function useResponderConexao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, situacao }: { id: string; situacao: 'aceita' | 'recusada' }) => {
      const { error } = await db
        .from('conecta_conexoes')
        .update({ situacao, respondido_em: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conecta', 'conexoes'] }),
  });
}

export function useDesfazerConexao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('conecta_conexoes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conecta', 'conexoes'] }),
  });
}

/** Todas as mensagens da associada, já em tempo real. */
export function useMinhasMensagens() {
  const qc = useQueryClient();
  const { data: pessoaId } = useMinhaPessoa();

  const consulta = useQuery({
    queryKey: ['conecta', 'mensagens', pessoaId],
    enabled: !!pessoaId,
    queryFn: async () => {
      const { data, error } = await db
        .from('conecta_mensagens')
        .select('id, de_pessoa_id, para_pessoa_id, conteudo, lida_em, criado_em')
        .order('criado_em', { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Mensagem[];
    },
  });

  useEffect(() => {
    if (!pessoaId) return;
    const canal = supabase
      .channel('conecta-mensagens')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'conecta_mensagens' },
        () => {
          qc.invalidateQueries({ queryKey: ['conecta', 'mensagens'] });
        },
      )
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'conecta_conexoes' },
        () => {
          qc.invalidateQueries({ queryKey: ['conecta', 'conexoes'] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [pessoaId, qc]);

  return consulta;
}

export function useEnviarMensagem() {
  const qc = useQueryClient();
  const { data: pessoaId } = useMinhaPessoa();
  return useMutation({
    mutationFn: async ({ paraPessoaId, conteudo }: { paraPessoaId: string; conteudo: string }) => {
      const { error } = await db.from('conecta_mensagens').insert({
        de_pessoa_id: pessoaId,
        para_pessoa_id: paraPessoaId,
        conteudo: conteudo.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conecta', 'mensagens'] }),
  });
}

export function useMarcarConversaLida() {
  const qc = useQueryClient();
  const { data: pessoaId } = useMinhaPessoa();
  return useMutation({
    mutationFn: async (dePessoaId: string) => {
      const { error } = await db
        .from('conecta_mensagens')
        .update({ lida_em: new Date().toISOString() })
        .eq('para_pessoa_id', pessoaId)
        .eq('de_pessoa_id', dePessoaId)
        .is('lida_em', null);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conecta', 'mensagens'] }),
  });
}
