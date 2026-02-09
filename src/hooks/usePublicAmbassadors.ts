import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicAmbassador {
  id: string;
  referral_code: string;
  tier: string;
  display_order: number;
  public_name: string;
  public_photo_url: string | null;
  public_bio: string | null;
  public_city: string | null;
  public_state: string | null;
  public_instagram_url: string | null;
  public_linkedin_url: string | null;
  public_website_url: string | null;
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
          public_name,
          public_photo_url,
          public_bio,
          public_city,
          public_state,
          public_instagram_url,
          public_linkedin_url,
          public_website_url
        `)
        .eq('active', true)
        .eq('show_on_public_page', true)
        .not('public_name', 'is', null)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return (data || []).map((ambassador: any) => ({
        id: ambassador.id,
        referral_code: ambassador.referral_code,
        tier: ambassador.tier,
        display_order: ambassador.display_order,
        public_name: ambassador.public_name || 'Embaixadora',
        public_photo_url: ambassador.public_photo_url,
        public_bio: ambassador.public_bio,
        public_city: ambassador.public_city,
        public_state: ambassador.public_state,
        public_instagram_url: ambassador.public_instagram_url,
        public_linkedin_url: ambassador.public_linkedin_url,
        public_website_url: ambassador.public_website_url,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
