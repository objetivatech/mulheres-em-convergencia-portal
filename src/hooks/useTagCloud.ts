import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PopularTag {
  id: string;
  name: string;
  slug: string;
  post_count: number;
}

export const usePopularTags = (limit = 20) => {
  return useQuery({
    queryKey: ['popular-blog-tags', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_popular_blog_tags', { limit_count: limit });

      if (error) throw error;
      return data as PopularTag[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};