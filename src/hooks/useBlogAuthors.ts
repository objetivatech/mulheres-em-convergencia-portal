import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BlogAuthor {
  id: string;
  user_id: string | null;
  display_name: string;
  photo_url: string | null;
  bio: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useBlogAuthors = () => {
  return useQuery({
    queryKey: ['blog-authors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_authors')
        .select('*')
        .order('display_name');
      if (error) throw error;
      return data as BlogAuthor[];
    },
  });
};

export const useBlogAuthor = (id: string) => {
  return useQuery({
    queryKey: ['blog-author', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_authors')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as BlogAuthor;
    },
    enabled: !!id,
  });
};

export const useCreateBlogAuthor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (authorData: Omit<BlogAuthor, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('blog_authors')
        .insert([authorData])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-authors'] });
      toast({ title: 'Sucesso', description: 'Autor criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: 'Erro ao criar autor: ' + error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateBlogAuthor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, authorData }: { id: string; authorData: Partial<BlogAuthor> }) => {
      const { data, error } = await supabase
        .from('blog_authors')
        .update(authorData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-authors'] });
      toast({ title: 'Sucesso', description: 'Autor atualizado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: 'Erro ao atualizar autor: ' + error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteBlogAuthor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_authors')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-authors'] });
      toast({ title: 'Sucesso', description: 'Autor excluído com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: 'Erro ao excluir autor: ' + error.message, variant: 'destructive' });
    },
  });
};
