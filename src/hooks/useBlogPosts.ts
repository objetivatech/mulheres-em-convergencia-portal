import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import slugify from 'slugify';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  featured_image_url?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  published_at?: string;
  scheduled_for?: string;
  views_count: number;
  author_id: string;
  category_id?: string;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export const useBlogPosts = (status?: string, limit?: number) => {
  return useQuery({
    queryKey: ['blog-posts', status, limit],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(id, name, slug),
          tags:blog_post_tags(
            tag:blog_tags(id, name, slug)
          )
        `)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status as 'draft' | 'published' | 'archived');
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return data?.map(post => ({
        ...post,
        tags: post.tags?.map((t: any) => t.tag).filter(Boolean) || []
      })) as BlogPost[];
    },
  });
};

export const useBlogPost = (id: string) => {
  return useQuery({
    queryKey: ['blog-post', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(id, name, slug),
          tags:blog_post_tags(
            tag:blog_tags(id, name, slug)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        tags: data.tags?.map((t: any) => t.tag).filter(Boolean) || []
      } as BlogPost;
    },
    enabled: !!id && id !== 'new',
  });
};

export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (postData: Partial<BlogPost> & { tagIds?: string[] }) => {
      const { tagIds, ...postFields } = postData;
      
      // Generate slug if not provided
      if (!postFields.slug && postFields.title) {
        postFields.slug = slugify(postFields.title, { lower: true, strict: true });
      }

      // Ensure required fields have values
      const post = {
        title: postFields.title || '',
        slug: postFields.slug || '',
        content: postFields.content || '',
        status: postFields.status || 'draft' as const,
        views_count: 0,
        author_id: postFields.author_id,
        ...postFields,
      };

      const { data, error } = await supabase
        .from('blog_posts')
        .insert([post])
        .select()
        .single();

      if (error) throw error;

      // Associate tags if provided
      if (tagIds && tagIds.length > 0) {
        const tagAssociations = tagIds.map(tagId => ({
          post_id: data.id,
          tag_id: tagId
        }));

        const { error: tagError } = await supabase
          .from('blog_post_tags')
          .insert(tagAssociations);

        if (tagError) throw tagError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({
        title: 'Sucesso',
        description: 'Post criado com sucesso!'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar post: ' + error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, postData, tagIds }: { 
      id: string; 
      postData: Partial<BlogPost>; 
      tagIds?: string[] 
    }) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update tags if provided
      if (tagIds !== undefined) {
        // Remove existing tag associations
        await supabase
          .from('blog_post_tags')
          .delete()
          .eq('post_id', id);

        // Add new tag associations
        if (tagIds.length > 0) {
          const tagAssociations = tagIds.map(tagId => ({
            post_id: id,
            tag_id: tagId
          }));

          const { error: tagError } = await supabase
            .from('blog_post_tags')
            .insert(tagAssociations);

          if (tagError) throw tagError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post'] });
      toast({
        title: 'Sucesso',
        description: 'Post atualizado com sucesso!'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar post: ' + error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({
        title: 'Sucesso',
        description: 'Post excluído com sucesso!'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir post: ' + error.message,
        variant: 'destructive'
      });
    }
  });
};