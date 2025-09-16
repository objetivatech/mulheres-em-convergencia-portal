import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BusinessAnalytics {
  business_id: string;
  business_name: string;
  business_category: string;
  business_city: string;
  business_state: string;
  owner_email: string;
  subscription_plan: string;
  subscription_active: boolean;
  total_views: number;
  total_clicks: number;
  total_contacts: number;
  total_reviews: number;
  average_rating: number;
  created_at: string;
}

export const useAdminAnalytics = () => {
  return useQuery({
    queryKey: ['admin-business-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_business_analytics');
      
      if (error) {
        console.error('Error fetching admin analytics:', error);
        throw error;
      }
      
      return data as BusinessAnalytics[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};