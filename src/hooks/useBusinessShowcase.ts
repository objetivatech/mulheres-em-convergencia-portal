import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  city: string;
  state: string;
  logo_url: string;
  cover_image_url: string;
  slug: string;
  subscription_plan: string;
  views_count: number;
  reviews_count: number;
}

export const useRandomBusinesses = (limit: number = 5) => {
  return useQuery({
    queryKey: ['random-businesses', limit],
    queryFn: async (): Promise<Business[]> => {
      const { data, error } = await supabase.rpc('get_random_businesses', { limit_count: limit });
      
      if (error) {
        console.error('Error fetching random businesses:', error);
        throw error;
      }
      
      return (data || []).map(b => ({ ...b, views_count: 0, reviews_count: 0 }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useFeaturedBusinesses = (limit: number = 5) => {
  return useQuery({
    queryKey: ['featured-businesses', limit],
    queryFn: async (): Promise<Business[]> => {
      const { data, error } = await supabase.rpc('get_featured_businesses', { limit_count: limit });
      
      if (error) {
        console.error('Error fetching featured businesses:', error);
        throw error;
      }
      
      return (data || []).map(b => ({ ...b, views_count: 0, reviews_count: 0 }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};