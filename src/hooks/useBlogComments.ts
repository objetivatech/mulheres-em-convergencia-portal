import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BlogComment {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  user_id: string | null;
  parent_id: string | null;
  created_at: string;
}

// Approved comments for a post (public)
export const useBlogComments = (postId: string) => {
  return useQuery({
    queryKey: ['blog-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('post_id', postId)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as BlogComment[];
    },
    enabled: !!postId,
  });
};

// All comments for admin moderation
export const useAllBlogComments = (status?: string) => {
  return useQuery({
    queryKey: ['blog-comments-admin', status],
    queryFn: async () => {
      let query = supabase
        .from('blog_comments')
        .select(`
          *,
          blog_posts:post_id (title, slug)
        `)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status as 'pending' | 'approved' | 'rejected');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

// Pending comments count
export const usePendingCommentsCount = () => {
  return useQuery({
    queryKey: ['blog-comments-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('blog_comments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count || 0;
    },
  });
};

export const useSubmitComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (comment: Pick<BlogComment, 'post_id' | 'author_name' | 'author_email' | 'content' | 'parent_id'>) => {
      const { data, error } = await supabase
        .from('blog_comments')
        .insert([{ ...comment, status: 'pending' as const }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Comentário enviado!', description: 'Seu comentário será exibido após aprovação.' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: 'Erro ao enviar comentário: ' + error.message, variant: 'destructive' });
    },
  });
};

export const useModerateComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('blog_comments')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['blog-comments'] });
      queryClient.invalidateQueries({ queryKey: ['blog-comments-admin'] });
      queryClient.invalidateQueries({ queryKey: ['blog-comments-pending-count'] });
      toast({ title: 'Sucesso', description: status === 'approved' ? 'Comentário aprovado!' : 'Comentário rejeitado.' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: 'Erro ao moderar comentário: ' + error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_comments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-comments'] });
      queryClient.invalidateQueries({ queryKey: ['blog-comments-admin'] });
      queryClient.invalidateQueries({ queryKey: ['blog-comments-pending-count'] });
      toast({ title: 'Sucesso', description: 'Comentário excluído!' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: 'Erro ao excluir comentário: ' + error.message, variant: 'destructive' });
    },
  });
};
