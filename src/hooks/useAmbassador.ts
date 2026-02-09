import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Ambassador {
  id: string;
  user_id: string;
  referral_code: string;
  commission_rate: number;
  total_earnings: number;
  total_sales: number;
  link_clicks: number;
  active: boolean;
  pix_key: string | null;
  bank_data: BankData | null;
  payment_preference: 'pix' | 'bank_transfer';
  minimum_payout: number;
  pending_commission: number;
  next_payout_date: string | null;
  // Novos campos de gamificação
  tier: 'bronze' | 'silver' | 'gold';
  tier_updated_at: string | null;
  lifetime_sales: number;
  total_points: number;
  created_at: string;
  updated_at: string;
}

export interface BankData {
  bank_name?: string;
  bank_code?: string;
  agency?: string;
  account?: string;
  account_type?: 'corrente' | 'poupanca';
  holder_name?: string;
  holder_cpf?: string;
}

export interface AmbassadorReferral {
  id: string;
  ambassador_id: string;
  referred_user_id: string | null;
  subscription_id: string | null;
  plan_name: string;
  sale_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  payment_confirmed_at: string | null;
  payout_id: string | null;
  payout_eligible_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AmbassadorClick {
  id: string;
  ambassador_id: string;
  referral_code: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
}

export interface AmbassadorPayout {
  id: string;
  ambassador_id: string;
  reference_period: string;
  total_sales: number;
  gross_amount: number;
  net_amount: number;
  status: 'pending' | 'scheduled' | 'paid' | 'cancelled';
  payment_method: string | null;
  scheduled_date: string;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface AmbassadorStats {
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalEarnings: number;
  pendingCommission: number;
  thisMonthClicks: number;
  thisMonthConversions: number;
  thisMonthEarnings: number;
  averageTicket: number;
  nextPayoutDate: string | null;
}

export const useAmbassador = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar dados da embaixadora atual
  const useAmbassadorData = () => {
    return useQuery({
      queryKey: ['ambassador', user?.id],
      queryFn: async () => {
        if (!user?.id) throw new Error('Usuário não autenticado');
        
        const { data, error } = await supabase
          .from('ambassadors')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        return data as Ambassador;
      },
      enabled: !!user?.id,
    });
  };

  // Buscar referências/indicações
  const useReferrals = (ambassadorId?: string) => {
    return useQuery({
      queryKey: ['ambassador-referrals', ambassadorId],
      queryFn: async () => {
        if (!ambassadorId) throw new Error('Ambassador ID não fornecido');
        
        const { data, error } = await supabase
          .from('ambassador_referrals')
          .select('*')
          .eq('ambassador_id', ambassadorId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data as AmbassadorReferral[];
      },
      enabled: !!ambassadorId,
    });
  };

  // Buscar cliques no link
  const useClicks = (ambassadorId?: string, dateRange?: { from: Date; to: Date }) => {
    return useQuery({
      queryKey: ['ambassador-clicks', ambassadorId, dateRange],
      queryFn: async () => {
        if (!ambassadorId) throw new Error('Ambassador ID não fornecido');
        
        let query = supabase
          .from('ambassador_referral_clicks')
          .select('*')
          .eq('ambassador_id', ambassadorId)
          .order('created_at', { ascending: false });
        
        if (dateRange) {
          query = query
            .gte('created_at', dateRange.from.toISOString())
            .lte('created_at', dateRange.to.toISOString());
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data as AmbassadorClick[];
      },
      enabled: !!ambassadorId,
    });
  };

  // Buscar payouts/pagamentos
  const usePayouts = (ambassadorId?: string) => {
    return useQuery({
      queryKey: ['ambassador-payouts', ambassadorId],
      queryFn: async () => {
        if (!ambassadorId) throw new Error('Ambassador ID não fornecido');
        
        const { data, error } = await supabase
          .from('ambassador_payouts')
          .select('*')
          .eq('ambassador_id', ambassadorId)
          .order('scheduled_date', { ascending: false });
        
        if (error) throw error;
        return data as AmbassadorPayout[];
      },
      enabled: !!ambassadorId,
    });
  };

  // Calcular estatísticas
  const useStats = (ambassadorId?: string) => {
    const { data: ambassador } = useAmbassadorData();
    const { data: referrals } = useReferrals(ambassadorId);
    const { data: clicks } = useClicks(ambassadorId);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats: AmbassadorStats = {
      totalClicks: ambassador?.link_clicks || 0,
      totalConversions: ambassador?.total_sales || 0,
      conversionRate: ambassador?.link_clicks 
        ? ((ambassador.total_sales / ambassador.link_clicks) * 100) 
        : 0,
      totalEarnings: ambassador?.total_earnings || 0,
      pendingCommission: ambassador?.pending_commission || 0,
      thisMonthClicks: clicks?.filter(c => new Date(c.created_at) >= startOfMonth).length || 0,
      thisMonthConversions: referrals?.filter(r => 
        new Date(r.created_at) >= startOfMonth && 
        r.status !== 'cancelled'
      ).length || 0,
      thisMonthEarnings: referrals?.filter(r => 
        new Date(r.created_at) >= startOfMonth && 
        r.status !== 'cancelled'
      ).reduce((sum, r) => sum + r.commission_amount, 0) || 0,
      averageTicket: ambassador?.total_sales 
        ? (ambassador.total_earnings / ambassador.total_sales)
        : 0,
      nextPayoutDate: ambassador?.next_payout_date || null,
    };

    return stats;
  };

  // Atualizar dados bancários
  const useUpdatePaymentData = () => {
    return useMutation({
      mutationFn: async (data: {
        pix_key?: string;
        bank_data?: BankData;
        payment_preference?: 'pix' | 'bank_transfer';
      }) => {
        if (!user?.id) throw new Error('Usuário não autenticado');
        
        const updatePayload: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        
        if (data.pix_key !== undefined) updatePayload.pix_key = data.pix_key;
        if (data.payment_preference !== undefined) updatePayload.payment_preference = data.payment_preference;
        if (data.bank_data !== undefined) updatePayload.bank_data = data.bank_data as Record<string, unknown>;
        
        const { error } = await supabase
          .from('ambassadors')
          .update(updatePayload)
          .eq('user_id', user.id);
        
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['ambassador'] });
        toast({
          title: 'Dados atualizados!',
          description: 'Suas informações de pagamento foram salvas.',
        });
      },
      onError: (error) => {
        toast({
          title: 'Erro ao atualizar',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  // Gerar link de convite
  const getInviteLink = (referralCode: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/convite/${referralCode}`;
  };

  // Gerar link com UTM
  const getInviteLinkWithUTM = (
    referralCode: string, 
    utm: { source?: string; medium?: string; campaign?: string }
  ) => {
    const baseLink = getInviteLink(referralCode);
    const params = new URLSearchParams();
    if (utm.source) params.set('utm_source', utm.source);
    if (utm.medium) params.set('utm_medium', utm.medium);
    if (utm.campaign) params.set('utm_campaign', utm.campaign);
    return `${baseLink}?${params.toString()}`;
  };

  return {
    useAmbassadorData,
    useReferrals,
    useClicks,
    usePayouts,
    useStats,
    useUpdatePaymentData,
    getInviteLink,
    getInviteLinkWithUTM,
  };
};
