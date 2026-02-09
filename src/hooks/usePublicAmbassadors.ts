import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicAmbassador {
  id: string;
  referral_code: string;
  tier: string;
  display_order: number;
  profile: {
    full_name: string;
    avatar_url: string | null;
    city: string | null;
    state: string | null;
    public_bio: string | null;
    instagram_url: string | null;
    linkedin_url: string | null;
    website_url: string | null;
  };
}

export function usePublicAmbassadors() {
  return useQuery({
    queryKey: ['public-ambassadors'],
    queryFn: async (): Promise<PublicAmbassador[]> => {
      const { data, error } = await supabase
        .from('ambassadors')
        .select(`
          id,
          referral_code,
          tier,
          display_order,
          profiles:user_id (
            full_name,
            avatar_url,
            city,
            state,
            public_bio,
            instagram_url,
            linkedin_url,
            website_url
          )
        `)
        .eq('active', true)
        .eq('show_on_public_page', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Transform the data to flatten profiles
      return (data || []).map((ambassador: any) => ({
        id: ambassador.id,
        referral_code: ambassador.referral_code,
        tier: ambassador.tier,
        display_order: ambassador.display_order,
        profile: ambassador.profiles || {
          full_name: 'Embaixadora',
          avatar_url: null,
          city: null,
          state: null,
          public_bio: null,
          instagram_url: null,
          linkedin_url: null,
          website_url: null,
        },
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
