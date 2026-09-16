/**
 * Conecta+ no banco novo (MeC-v6).
 * Nada de estado derivado: participação em grupos e indicações são fatos gravados.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMinhaPessoa } from '@/hooks/useMinhaArea';

const db = supabase as any;

export type ConectaMembro = {
  pessoa_id: string;
  nome: string;
  foto_url: string | null;
  empresa: string | null;
  cargo: string | null;
  apresentacao: string | null;
  interesses: string[] | null;
  aceita_contato: boolean | null;
  instagram: string | null;
  linkedin: string | null;
  site: string | null;
};

export function useConectaMembrosRede() {
  return useQuery({
    queryKey: ['conecta', 'membros'],
    queryFn: async () => {
      const { data, error } = await db.rpc('conecta_membros');
      if (error) throw error;
      return (data ?? []) as ConectaMembro[];
    },
  });
}

export function useConectaGrupos() {
  const { data: pessoaId } = useMinhaPessoa();
  return useQuery({
    queryKey: ['conecta', 'grupos', pessoaId],
    enabled: !!pessoaId,
    queryFn: async () => {
      const [grupos, meus] = await Promise.all([
        db.from('conecta_grupos').select('id, slug, nome, descricao, ativo').eq('ativo', true).order('nome'),
        db.from('conecta_grupo_membros').select('id, grupo_id').eq('pessoa_id', pessoaId),
      ]);
      const meusIds = new Set(((meus.data ?? []) as any[]).map((m) => m.grupo_id));
      return ((grupos.data ?? []) as any[]).map((g) => ({ ...g, participo: meusIds.has(g.id) }));
    },
  });
}

export function useAlternarGrupo() {
  const qc = useQueryClient();
  const { data: pessoaId } = useMinhaPessoa();
  return useMutation({
    mutationFn: async ({ grupoId, participar }: { grupoId: string; participar: boolean }) => {
      if (participar) {
        const { error } = await db
          .from('conecta_grupo_membros')
          .insert({ grupo_id: grupoId, pessoa_id: pessoaId });
        if (error) throw error;
      } else {
        const { error } = await db
          .from('conecta_grupo_membros')
          .delete()
          .eq('grupo_id', grupoId)
          .eq('pessoa_id', pessoaId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conecta', 'grupos'] }),
  });
}

export function useMinhasIndicacoes() {
  const { data: pessoaId } = useMinhaPessoa();
  return useQuery({
    queryKey: ['conecta', 'indicacoes', pessoaId],
    enabled: !!pessoaId,
    queryFn: async () => {
      const { data, error } = await db
        .from('conecta_indicacoes')
        .select('id, descricao, situacao, criado_em, de_pessoa_id, para_pessoa_id')
        .order('criado_em', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useCriarIndicacao() {
  const qc = useQueryClient();
  const { data: pessoaId } = useMinhaPessoa();
  return useMutation({
    mutationFn: async ({ paraPessoaId, descricao }: { paraPessoaId: string | null; descricao: string }) => {
      const { error } = await db.from('conecta_indicacoes').insert({
        de_pessoa_id: pessoaId,
        para_pessoa_id: paraPessoaId,
        descricao,
        situacao: 'aberta',
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conecta', 'indicacoes'] }),
  });
}

export function useAtualizarIndicacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, situacao }: { id: string; situacao: string }) => {
      const { error } = await db.from('conecta_indicacoes').update({ situacao }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conecta', 'indicacoes'] }),
  });
}

/* ------------------------------------------------------------ Administração */

export function useConectaAdminDados() {
  return useQuery({
    queryKey: ['painel', 'conecta'],
    queryFn: async () => {
      const [grupos, membros, indicacoes, perfis] = await Promise.all([
        db.from('conecta_grupos').select('*').order('nome'),
        db.from('conecta_grupo_membros').select('id, grupo_id, pessoa_id, entrou_em'),
        db
          .from('conecta_indicacoes')
          .select('id, descricao, situacao, criado_em, de_pessoa_id, para_pessoa_id')
          .order('criado_em', { ascending: false })
          .limit(200),
        db.rpc('conecta_membros'),
      ]);
      return {
        grupos: (grupos.data ?? []) as any[],
        membros: (membros.data ?? []) as any[],
        indicacoes: (indicacoes.data ?? []) as any[],
        pessoas: (perfis.data ?? []) as ConectaMembro[],
      };
    },
  });
}

export function useSalvarGrupo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (grupo: { id?: string; slug: string; nome: string; descricao?: string | null; ativo: boolean }) => {
      if (grupo.id) {
        const { id, ...resto } = grupo;
        const { error } = await db.from('conecta_grupos').update(resto).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await db.from('conecta_grupos').insert(grupo);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['painel', 'conecta'] });
      qc.invalidateQueries({ queryKey: ['conecta', 'grupos'] });
    },
  });
}

export function useExcluirGrupo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('conecta_grupos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['painel', 'conecta'] });
      qc.invalidateQueries({ queryKey: ['conecta', 'grupos'] });
    },
  });
}
