import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Donation {
  id: string;
  donor_id: string | null;
  donor_name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  amount: number;
  type: 'one_time' | 'recurring';
  frequency: string | null;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  payment_method: string | null;
  payment_id: string | null;
  project: string | null;
  campaign: string | null;
  message: string | null;
  anonymous: boolean;
  receipt_sent: boolean;
  receipt_sent_at: string | null;
  cost_center_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Sponsor {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string;
  contact_phone: string | null;
  cnpj: string | null;
  sponsorship_tier: string;
  sponsorship_value: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  logo_url: string | null;
  website_url: string | null;
  benefits: string[];
  cost_center_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export const useDonations = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // ==================== DONATIONS ====================
  const useDonationsList = (filters?: {
    status?: string;
    type?: string;
    project?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    return useQuery({
      queryKey: ['donations', filters],
      queryFn: async () => {
        let query = supabase
          .from('donations')
          .select('*')
          .order('created_at', { ascending: false });

        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.type) {
          query = query.eq('type', filters.type);
        }
        if (filters?.project) {
          query = query.eq('project', filters.project);
        }
        if (filters?.dateFrom) {
          query = query.gte('created_at', filters.dateFrom);
        }
        if (filters?.dateTo) {
          query = query.lte('created_at', filters.dateTo);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as Donation[];
      },
      enabled: isAdmin,
    });
  };

  const useCreateDonation = () => {
    return useMutation({
      mutationFn: async (donation: Partial<Donation>) => {
        const { data, error } = await supabase
          .from('donations')
          .insert({
            donor_name: donation.donor_name || '',
            email: donation.email || '',
            amount: donation.amount || 0,
            type: donation.type || 'one_time',
            status: donation.status || 'pending',
            ...donation,
          } as any)
          .select()
          .single();
        if (error) throw error;
        return data as Donation;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['donations'] });
        queryClient.invalidateQueries({ queryKey: ['donation-stats'] });
      },
    });
  };

  const useUpdateDonation = () => {
    return useMutation({
      mutationFn: async ({ id, ...updates }: Partial<Donation> & { id: string }) => {
        const { data, error } = await supabase
          .from('donations')
          .update(updates as any)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as Donation;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['donations'] });
        queryClient.invalidateQueries({ queryKey: ['donation-stats'] });
      },
    });
  };

  // ==================== SPONSORS ====================
  const useSponsorsList = (filters?: {
    status?: string;
    tier?: string;
  }) => {
    return useQuery({
      queryKey: ['sponsors', filters],
      queryFn: async () => {
        let query = supabase
          .from('sponsors')
          .select('*')
          .order('sponsorship_value', { ascending: false });

        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.tier) {
          query = query.eq('sponsorship_tier', filters.tier);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as unknown as Sponsor[];
      },
      enabled: isAdmin,
    });
  };

  const useCreateSponsor = () => {
    return useMutation({
      mutationFn: async (sponsor: Partial<Sponsor>) => {
        const { data, error } = await supabase
          .from('sponsors')
          .insert({
            company_name: sponsor.company_name || '',
            contact_email: sponsor.contact_email || '',
            sponsorship_tier: sponsor.sponsorship_tier || 'bronze',
            status: sponsor.status || 'pending',
            sponsorship_value: sponsor.sponsorship_value || 0,
            benefits: sponsor.benefits || [],
            ...sponsor,
          } as any)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as Sponsor;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      },
    });
  };

  const useUpdateSponsor = () => {
    return useMutation({
      mutationFn: async ({ id, ...updates }: Partial<Sponsor> & { id: string }) => {
        const { data, error } = await supabase
          .from('sponsors')
          .update(updates as any)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as Sponsor;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      },
    });
  };

  // ==================== STATS ====================
  const useDonationStats = () => {
    return useQuery({
      queryKey: ['donation-stats'],
      queryFn: async () => {
        const { data: donations } = await supabase
          .from('donations')
          .select('amount, status, type, created_at')
          .eq('status', 'completed');

        const { data: sponsors } = await supabase
          .from('sponsors')
          .select('sponsorship_value, status');

        const totalDonations = donations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
        const recurringDonations = donations?.filter(d => d.type === 'recurring').reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
        const oneTimeDonations = donations?.filter(d => d.type === 'one_time').reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
        const donorsCount = donations?.length || 0;

        const sponsorsList = sponsors as unknown as { sponsorship_value: number; status: string }[] | null;
        const totalSponsorship = sponsorsList?.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.sponsorship_value || 0), 0) || 0;
        const activeSponsors = sponsorsList?.filter(s => s.status === 'active').length || 0;

        // Monthly breakdown (last 6 months)
        const now = new Date();
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          const monthDonations = donations?.filter(d => {
            const date = new Date(d.created_at);
            return date >= monthStart && date <= monthEnd;
          }).reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
          
          monthlyData.push({
            month: monthStart.toLocaleString('pt-BR', { month: 'short' }),
            amount: monthDonations,
          });
        }

        return {
          total_donations: totalDonations,
          recurring_donations: recurringDonations,
          one_time_donations: oneTimeDonations,
          donors_count: donorsCount,
          total_sponsorship: totalSponsorship,
          active_sponsors: activeSponsors,
          total_revenue: totalDonations + totalSponsorship,
          monthly_data: monthlyData,
        };
      },
      enabled: isAdmin,
    });
  };

  return {
    useDonationsList,
    useCreateDonation,
    useUpdateDonation,
    useSponsorsList,
    useCreateSponsor,
    useUpdateSponsor,
    useDonationStats,
  };
};
