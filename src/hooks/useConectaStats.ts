import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useConectaAccess } from './useConectaAccess';

export interface ConectaStats {
  oneOnOnes: { total: number; withMembers: number; withGuests: number };
  testimonials: { sent: number; received: number };
  businessDeals: { total: number; value: number };
  referrals: { sent: number; received: number };
  attendances: number;
}

export function useConectaStats() {
  const { user } = useConectaAccess();

  return useQuery({
    queryKey: ['conecta-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const [oneOnOnes, testimonialsSent, testimonialsReceived, myDeals, sentReferrals, receivedReferrals, attendances] = await Promise.all([
        supabase.from('conecta_one_on_ones').select('id, meeting_type').eq('user_id', user.id),
        supabase.from('conecta_testimonials').select('id').eq('from_user_id', user.id),
        supabase.from('conecta_testimonials').select('id').eq('to_user_id', user.id),
        supabase.from('conecta_business_deals').select('id, value').eq('closed_by_user_id', user.id),
        supabase.from('conecta_referrals').select('id').eq('from_user_id', user.id),
        supabase.from('conecta_referrals').select('id').eq('to_user_id', user.id),
        supabase.from('conecta_attendances').select('id').eq('user_id', user.id),
      ]);

      const oo = oneOnOnes.data || [];
      const deals = myDeals.data || [];

      return {
        oneOnOnes: {
          total: oo.length,
          withMembers: oo.filter(g => g.meeting_type === 'membro').length,
          withGuests: oo.filter(g => g.meeting_type === 'convidado').length,
        },
        testimonials: { sent: testimonialsSent.data?.length || 0, received: testimonialsReceived.data?.length || 0 },
        businessDeals: {
          total: deals.length,
          value: deals.reduce((sum, d) => sum + Number(d.value), 0),
        },
        referrals: { sent: sentReferrals.data?.length || 0, received: receivedReferrals.data?.length || 0 },
        attendances: attendances.data?.length || 0,
      } as ConectaStats;
    },
    enabled: !!user?.id,
  });
}
