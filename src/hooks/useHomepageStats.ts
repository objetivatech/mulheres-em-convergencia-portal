import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HomepageStats {
  totalMembers: number;
  totalBusinesses: number;
  totalCourses: number;
  totalEvents: number;
}

export const useHomepageStats = () => {
  return useQuery({
    queryKey: ['homepage-stats'],
    queryFn: async (): Promise<HomepageStats> => {
      const [profiles, businesses, courses, events] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('businesses').select('id', { count: 'exact', head: true }),
        supabase.from('academy_courses').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      ]);

      return {
        totalMembers: profiles.count || 0,
        totalBusinesses: businesses.count || 0,
        totalCourses: courses.count || 0,
        totalEvents: events.count || 0,
      };
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ['subscription-plans-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name, display_name, price_monthly, is_featured, features, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
};
