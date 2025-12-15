import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SubscriberStats {
  mailrelay: {
    total_subscribers: number;
    total_groups: number;
  };
  local: {
    total_subscribers: number;
    pending_sync: number;
  };
}

interface DashboardData {
  account: any;
  packages: any[];
  recent_campaigns: any[];
  summary: {
    total_sent: number;
    total_opened: number;
    total_clicked: number;
    total_bounced: number;
    open_rate: string;
    click_rate: string;
  };
}

export function useNewsletter() {
  const queryClient = useQueryClient();

  // ============ SUBSCRIBERS ============
  
  const useSubscriberStats = () => {
    return useQuery({
      queryKey: ['newsletter', 'subscriber-stats'],
      queryFn: async () => {
        const { data, error } = await supabase.functions.invoke('mailrelay-subscribers', {
          body: {},
        });
        
        // Parse query params in URL
        const response = await fetch(
          `https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/mailrelay-subscribers?action=stats`,
          {
            headers: {
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
          }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data as SubscriberStats;
      },
    });
  };

  const useMailrelaySubscribers = (page = 1, perPage = 50) => {
    return useQuery({
      queryKey: ['newsletter', 'mailrelay-subscribers', page, perPage],
      queryFn: async () => {
        const session = await supabase.auth.getSession();
        const response = await fetch(
          `https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/mailrelay-subscribers?action=list&page=${page}&per_page=${perPage}`,
          {
            headers: {
              'Authorization': `Bearer ${session.data.session?.access_token}`,
            },
          }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
    });
  };

  const useGroups = () => {
    return useQuery({
      queryKey: ['newsletter', 'groups'],
      queryFn: async () => {
        const session = await supabase.auth.getSession();
        const response = await fetch(
          `https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/mailrelay-subscribers?action=groups`,
          {
            headers: {
              'Authorization': `Bearer ${session.data.session?.access_token}`,
            },
          }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
    });
  };

  const useSyncToMailrelay = () => {
    return useMutation({
      mutationFn: async () => {
        const session = await supabase.auth.getSession();
        const response = await fetch(
          `https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/mailrelay-subscribers?action=sync_to_mailrelay`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.data.session?.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['newsletter'] });
      },
    });
  };

  const useImportFromMailrelay = () => {
    return useMutation({
      mutationFn: async () => {
        const session = await supabase.auth.getSession();
        const response = await fetch(
          `https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/mailrelay-subscribers?action=import_from_mailrelay`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.data.session?.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['newsletter'] });
      },
    });
  };

  // ============ CAMPAIGNS ============

  const useCampaigns = (page = 1) => {
    return useQuery({
      queryKey: ['newsletter', 'campaigns', page],
      queryFn: async () => {
        const session = await supabase.auth.getSession();
        const response = await fetch(
          `https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/mailrelay-campaigns?action=list&page=${page}`,
          {
            headers: {
              'Authorization': `Bearer ${session.data.session?.access_token}`,
            },
          }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
    });
  };

  const useSentCampaigns = (page = 1) => {
    return useQuery({
      queryKey: ['newsletter', 'sent-campaigns', page],
      queryFn: async () => {
        const session = await supabase.auth.getSession();
        const response = await fetch(
          `https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/mailrelay-campaigns?action=list_sent&page=${page}`,
          {
            headers: {
              'Authorization': `Bearer ${session.data.session?.access_token}`,
            },
          }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
    });
  };

  const useSenders = () => {
    return useQuery({
      queryKey: ['newsletter', 'senders'],
      queryFn: async () => {
        const session = await supabase.auth.getSession();
        const response = await fetch(
          `https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/mailrelay-campaigns?action=senders`,
          {
            headers: {
              'Authorization': `Bearer ${session.data.session?.access_token}`,
            },
          }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
    });
  };

  const useCreateCampaign = () => {
    return useMutation({
      mutationFn: async (campaign: { subject: string; sender_id?: number; html_part: string; text_part?: string }) => {
        const session = await supabase.auth.getSession();
        const response = await fetch(
          `https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/mailrelay-campaigns?action=create`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.data.session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(campaign),
          }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['newsletter', 'campaigns'] });
      },
    });
  };

  const useSendCampaign = () => {
    return useMutation({
      mutationFn: async (campaignId: number) => {
        const session = await supabase.auth.getSession();
        const response = await fetch(
          `https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/mailrelay-campaigns?action=send&id=${campaignId}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.data.session?.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['newsletter'] });
      },
    });
  };

  const useSendTestCampaign = () => {
    return useMutation({
      mutationFn: async ({ campaignId, emails }: { campaignId: number; emails: string[] }) => {
        const session = await supabase.auth.getSession();
        const response = await fetch(
          `https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/mailrelay-campaigns?action=send_test&id=${campaignId}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.data.session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ emails }),
          }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
    });
  };

  // ============ ANALYTICS ============

  const useDashboard = () => {
    return useQuery({
      queryKey: ['newsletter', 'dashboard'],
      queryFn: async () => {
        const session = await supabase.auth.getSession();
        const response = await fetch(
          `https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/mailrelay-analytics?action=dashboard`,
          {
            headers: {
              'Authorization': `Bearer ${session.data.session?.access_token}`,
            },
          }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data as DashboardData;
      },
    });
  };

  const useCampaignReport = (campaignId: number | null) => {
    return useQuery({
      queryKey: ['newsletter', 'campaign-report', campaignId],
      queryFn: async () => {
        if (!campaignId) return null;
        
        const session = await supabase.auth.getSession();
        const response = await fetch(
          `https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/mailrelay-analytics?action=campaign_full_report&id=${campaignId}`,
          {
            headers: {
              'Authorization': `Bearer ${session.data.session?.access_token}`,
            },
          }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      enabled: !!campaignId,
    });
  };

  // ============ LOCAL SUBSCRIBERS ============

  const useLocalSubscribers = () => {
    return useQuery({
      queryKey: ['newsletter', 'local-subscribers'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('newsletter_subscribers')
          .select('*')
          .order('subscribed_at', { ascending: false })
          .limit(100);
        
        if (error) throw error;
        return data;
      },
    });
  };

  return {
    // Subscribers
    useSubscriberStats,
    useMailrelaySubscribers,
    useGroups,
    useSyncToMailrelay,
    useImportFromMailrelay,
    useLocalSubscribers,
    
    // Campaigns
    useCampaigns,
    useSentCampaigns,
    useSenders,
    useCreateCampaign,
    useSendCampaign,
    useSendTestCampaign,
    
    // Analytics
    useDashboard,
    useCampaignReport,
  };
}
