/**
 * Painel de conteúdo — banco novo (MeC-v6).
 * Escrita em: negocios (+mídias, áreas, comodidades), posts, post_categorias,
 * autores, paginas e blocos_site. Toda permissão é resolvida por RLS
 * (`e_admin()` ou papel `editora`); aqui só consultamos para esconder a interface.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type Situacao = 'rascunho' | 'agendado' | 'publicado' | 'arquivado';

export function useSouEditora() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['painel', 'permissao', user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [admin, pessoa] = await Promise.all([
        supabase.rpc('e_admin'),
        supabase.rpc('pessoa_atual'),
      ]);
      if (admin.data === true) return { admin: true, editora: true };
      const pessoaId = pessoa.data as string | null;
      if (!pessoaId) return { admin: false, editora: false };
      const { data } = await supabase.rpc('tem_papel', {
        _pessoa_id: pessoaId,
        _papel: 'editora',
      });
      return { admin: false, editora: data === true };
    },
  });
}

function invalidar(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['painel'] });
  qc.invalidateQueries({ queryKey: ['site'] });
}

/* ---------------------------------------------------------------- Negócios */

export function usePainelNegocios(busca = '') {
  return useQuery({
    queryKey: ['painel', 'negocios', busca],
    queryFn: async () => {
      let q = supabase
        .from('negocios')
        .select('id, slug, nome, categoria, cidade, uf, publicado, destaque, criado_em')
        .order('criado_em', { ascending: false })
        .limit(500);
      if (busca.trim()) q = q.ilike('nome', `%${busca.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function usePainelNegocio(id?: string) {
  return useQuery({
    queryKey: ['painel', 'negocio', id],
    enabled: !!id && id !== 'novo',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('negocios')
        .select(
          '*, midias:negocio_midias(id, tipo, url, legenda, ordem), areas:negocio_areas_atendimento(id, cidade, uf, bairro), comodidades:negocio_comodidades(id, nome)'
        )
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
}

export function useSalvarNegocio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, valores }: { id?: string; valores: Record<string, any> }) => {
      if (id && id !== 'novo') {
        const { error } = await supabase.from('negocios').update(valores).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase
        .from('negocios')
        .insert(valores)
        .select('id')
        .single();
      if (error) throw error;
      return (data as any).id as string;
    },
    onSuccess: () => invalidar(qc),
  });
}

export function useExcluirNegocio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('negocios').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(qc),
  });
}

export function useFilhosNegocio() {
  const qc = useQueryClient();
  const adicionar = useMutation({
    mutationFn: async ({ tabela, valores }: { tabela: string; valores: Record<string, any> }) => {
      const { error } = await supabase.from(tabela).insert(valores);
      if (error) throw error;
    },
    onSuccess: () => invalidar(qc),
  });
  const remover = useMutation({
    mutationFn: async ({ tabela, id }: { tabela: string; id: string }) => {
      const { error } = await supabase.from(tabela).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(qc),
  });
  return { adicionar, remover };
}

/* ------------------------------------------------------------------- Blog */

export function usePainelPosts(busca = '') {
  return useQuery({
    queryKey: ['painel', 'posts', busca],
    queryFn: async () => {
      let q = supabase
        .from('posts')
        .select('id, slug, titulo, situacao, publicado_em, destaque, atualizado_em, autor:autores(nome)')
        .order('atualizado_em', { ascending: false })
        .limit(500);
      if (busca.trim()) q = q.ilike('titulo', `%${busca.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function usePainelPost(id?: string) {
  return useQuery({
    queryKey: ['painel', 'post', id],
    enabled: !!id && id !== 'novo',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, categorias:post_categoria_vinculo(categoria_id)')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
}

export function useSalvarPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      valores,
      categorias,
    }: {
      id?: string;
      valores: Record<string, any>;
      categorias: string[];
    }) => {
      let postId = id && id !== 'novo' ? id : undefined;
      if (postId) {
        const { error } = await supabase.from('posts').update(valores).eq('id', postId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('posts').insert(valores).select('id').single();
        if (error) throw error;
        postId = (data as any).id as string;
      }
      await supabase.from('post_categoria_vinculo').delete().eq('post_id', postId);
      if (categorias.length) {
        const { error } = await supabase
          .from('post_categoria_vinculo')
          .insert(categorias.map((c) => ({ post_id: postId, categoria_id: c })));
        if (error) throw error;
      }
      return postId as string;
    },
    onSuccess: () => invalidar(qc),
  });
}

export function useExcluirPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(qc),
  });
}

export function usePainelAutores() {
  return useQuery({
    queryKey: ['painel', 'autores'],
    queryFn: async () => {
      const { data, error } = await supabase.from('autores').select('id, nome, slug').order('nome');
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function usePainelCategorias() {
  return useQuery({
    queryKey: ['painel', 'categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_categorias')
        .select('id, nome, slug, ordem')
        .order('ordem');
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useSalvarSimples(tabela: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, valores }: { id?: string; valores: Record<string, any> }) => {
      if (id) {
        const { error } = await supabase.from(tabela).update(valores).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase.from(tabela).insert(valores).select('id').single();
      if (error) throw error;
      return (data as any).id as string;
    },
    onSuccess: () => invalidar(qc),
  });
}

export function useExcluirSimples(tabela: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tabela).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(qc),
  });
}

/* ---------------------------------------------------------------- Páginas */

export function usePainelPaginas() {
  return useQuery({
    queryKey: ['painel', 'paginas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('paginas')
        .select('id, slug, titulo, situacao, publicado_em, atualizado_em')
        .order('titulo');
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function usePainelPagina(id?: string) {
  return useQuery({
    queryKey: ['painel', 'pagina', id],
    enabled: !!id && id !== 'nova',
    queryFn: async () => {
      const { data, error } = await supabase.from('paginas').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
}

/* -------------------------------------------------------- Blocos da home */

export function usePainelBlocos() {
  return useQuery({
    queryKey: ['painel', 'blocos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocos_site')
        .select('id, chave, tipo, conteudo, ordem, ativo')
        .order('ordem');
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useSalvarBloco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, valores }: { id: string; valores: Record<string, any> }) => {
      const { error } = await supabase
        .from('blocos_site')
        .update({ ...valores, atualizado_em: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(qc),
  });
}
