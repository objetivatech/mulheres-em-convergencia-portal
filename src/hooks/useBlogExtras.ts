/** Extras da página do post: autora (negócio dela), relacionados e comentários públicos. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Comentario = { id: string; nome: string; conteudo: string; criado_em: string; pessoa_id: string | null };

/** Negócio publicado da autora (para o botão "Conhecer o negócio dela"). */
export function useNegocioDaAutora(pessoaId?: string | null) {
  return useQuery({
    queryKey: ['blog', 'negocio-autora', pessoaId],
    enabled: !!pessoaId,
    queryFn: async () => {
      const { data } = await supabase.from('negocios').select('slug, nome').eq('pessoa_id', pessoaId!).eq('publicado', true).limit(1).maybeSingle();
      return data as { slug: string; nome: string } | null;
    },
  });
}

/** Até 3 posts: primeiro da mesma categoria, completando com os mais recentes. */
export function usePostsRelacionados(postId?: string) {
  return useQuery({
    queryKey: ['blog', 'relacionados', postId],
    enabled: !!postId,
    queryFn: async () => {
      const campos = 'id, slug, titulo, capa_url, conteudo, publicado_em';
      const { data: cats } = await supabase.from('post_categoria_vinculo').select('categoria_id').eq('post_id', postId!);
      const ids = (cats ?? []).map((c: any) => c.categoria_id);
      let mesmos: any[] = [];
      if (ids.length) {
        const { data } = await supabase.from('posts').select(`${campos}, post_categoria_vinculo!inner(categoria_id)`)
          .eq('situacao', 'publicado').neq('id', postId!).in('post_categoria_vinculo.categoria_id', ids)
          .order('publicado_em', { ascending: false }).limit(6);
        mesmos = data ?? [];
      }
      const vistos = new Set(mesmos.map((p) => p.id));
      let lista = mesmos.slice(0, 3);
      if (lista.length < 3) {
        const { data } = await supabase.from('posts').select(campos).eq('situacao', 'publicado').neq('id', postId!)
          .order('publicado_em', { ascending: false }).limit(6);
        lista = [...lista, ...(data ?? []).filter((p: any) => !vistos.has(p.id))].slice(0, 3);
      }
      return lista as { id: string; slug: string; titulo: string; capa_url: string | null; conteudo: string | null; publicado_em: string | null }[];
    },
  });
}

export function useComentarios(postId?: string) {
  return useQuery({
    queryKey: ['blog', 'comentarios', postId],
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await supabase.from('post_comentarios').select('id, nome, conteudo, criado_em, pessoa_id')
        .eq('post_id', postId!).is('oculto_em', null).order('criado_em', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Comentario[];
    },
  });
}

export function useEnviarComentario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: { post_id: string; nome: string; conteudo: string; pessoa_id: string | null }) => {
      const { error } = await supabase.from('post_comentarios').insert(c);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['blog', 'comentarios', v.post_id] }),
  });
}

/** Só a equipe: tira o comentário do ar. */
export function useOcultarComentario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; post_id: string }) => {
      const { error } = await supabase.from('post_comentarios').update({ oculto_em: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['blog', 'comentarios', v.post_id] }),
  });
}
