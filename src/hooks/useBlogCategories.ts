import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import slugify from 'slugify';

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export const useBlogCategories = () => {
  return useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as BlogCategory[];
    },
  });
};

export const useBlogTags = () => {
  return useQuery({
    queryKey: ['blog-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_tags')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as BlogTag[];
    },
  });
};

export const useCreateBlogCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (categoryData: Omit<BlogCategory, 'id' | 'created_at'> | { name: string; description?: string }) => {
      // Generate slug if not provided
      const dataWithSlug = {
        ...categoryData,
        slug: 'slug' in categoryData && categoryData.slug 
          ? categoryData.slug 
          : slugify(categoryData.name, { lower: true, strict: true })
      };

      const { data, error } = await supabase
        .from('blog_categories')
        .insert([dataWithSlug])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      toast({
        title: 'Sucesso',
        description: 'Categoria criada com sucesso!'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar categoria: ' + error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useUpdateBlogCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, categoryData }: { 
      id: string; 
      categoryData: Partial<BlogCategory> 
    }) => {
      const { data, error } = await supabase
        .from('blog_categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      toast({
        title: 'Sucesso',
        description: 'Categoria atualizada com sucesso!'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar categoria: ' + error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useDeleteBlogCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      toast({
        title: 'Sucesso',
        description: 'Categoria excluída com sucesso!'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir categoria: ' + error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useCreateBlogTag = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tagData: Omit<BlogTag, 'id' | 'created_at'>) => {
      // Generate slug if not provided
      if (!tagData.slug && tagData.name) {
        tagData.slug = slugify(tagData.name, { lower: true, strict: true });
      }

      const { data, error } = await supabase
        .from('blog_tags')
        .insert([tagData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-tags'] });
      queryClient.invalidateQueries({ queryKey: ['popular-blog-tags'] });
      toast({
        title: 'Sucesso',
        description: 'Tag criada com sucesso!'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar tag: ' + error.message,
        variant: 'destructive'
      });
    }
  });
};

// Add hook to check user permissions
export const useUserPermissions = () => {
  return useQuery({
    queryKey: ['user-permissions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { isAdmin: false, isAuthor: false };

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const roles = profile?.roles || [];
      return {
        isAdmin: roles.includes('admin'),
        isAuthor: roles.includes('author'),
        canPublish: roles.includes('admin') || (!roles.includes('author'))
      };
    },
  });
};