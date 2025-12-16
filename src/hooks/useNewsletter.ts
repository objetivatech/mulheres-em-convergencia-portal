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
    campaigns_count?: number;
  };
}

const FUNCTIONS_URL = 'https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1';

async function getAuthHeaders() {
  const session = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session.data.session?.access_token}`,
    'Content-Type': 'application/json',
  };
}

export function useNewsletter() {
  const queryClient = useQueryClient();

  // ============ SUBSCRIBERS ============
  
  const useSubscriberStats = () => {
    return useQuery({
      queryKey: ['newsletter', 'subscriber-stats'],
      queryFn: async () => {
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-subscribers?action=stats`,
          { headers }
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
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-subscribers?action=list&page=${page}&per_page=${perPage}`,
          { headers }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
    });
  };

  const useMailrelaySubscriber = (id: number | null) => {
    return useQuery({
      queryKey: ['newsletter', 'mailrelay-subscriber', id],
      queryFn: async () => {
        if (!id) return null;
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-subscribers?action=get&id=${id}`,
          { headers }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      enabled: !!id,
    });
  };

  const useGroups = () => {
    return useQuery({
      queryKey: ['newsletter', 'groups'],
      queryFn: async () => {
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-subscribers?action=groups`,
          { headers }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
    });
  };

  const useCreateSubscriber = () => {
    return useMutation({
      mutationFn: async (subscriber: { email: string; name?: string; status?: string; group_ids?: number[] }) => {
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-subscribers?action=create`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(subscriber),
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

  const useUpdateSubscriber = () => {
    return useMutation({
      mutationFn: async ({ id, data }: { id: number; data: { email?: string; name?: string; status?: string; group_ids?: number[] } }) => {
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-subscribers?action=update&id=${id}`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
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

  const useDeleteSubscriber = () => {
    return useMutation({
      mutationFn: async (id: number) => {
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-subscribers?action=delete&id=${id}`,
          {
            method: 'POST',
            headers,
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

  const useSyncToMailrelay = () => {
    return useMutation({
      mutationFn: async () => {
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-subscribers?action=sync_to_mailrelay`,
          {
            method: 'POST',
            headers,
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
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-subscribers?action=import_from_mailrelay`,
          {
            method: 'POST',
            headers,
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
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-campaigns?action=list&page=${page}`,
          { headers }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
    });
  };

  const useCampaign = (id: number | null) => {
    return useQuery({
      queryKey: ['newsletter', 'campaign', id],
      queryFn: async () => {
        if (!id) return null;
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-campaigns?action=get&id=${id}`,
          { headers }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      enabled: !!id,
    });
  };

  const useSentCampaigns = (page = 1) => {
    return useQuery({
      queryKey: ['newsletter', 'sent-campaigns', page],
      queryFn: async () => {
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-campaigns?action=list_sent&page=${page}`,
          { headers }
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
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-campaigns?action=senders`,
          { headers }
        );
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
    });
  };

  const useCreateCampaign = () => {
    return useMutation({
      mutationFn: async (campaign: { 
        subject: string; 
        sender_id?: number; 
        html_part: string; 
        text_part?: string;
        preview_text?: string;
        reply_to?: string;
        target?: { group_ids?: number[] };
        url_token?: boolean;
        analytics_utm_campaign?: string;
      }) => {
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-campaigns?action=create`,
          {
            method: 'POST',
            headers,
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

  const useUpdateCampaign = () => {
    return useMutation({
      mutationFn: async ({ id, data }: { id: number; data: any }) => {
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-campaigns?action=update&id=${id}`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
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

  const useDeleteCampaign = () => {
    return useMutation({
      mutationFn: async (id: number) => {
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-campaigns?action=delete&id=${id}`,
          {
            method: 'POST',
            headers,
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
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-campaigns?action=send&id=${campaignId}`,
          {
            method: 'POST',
            headers,
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
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-campaigns?action=send_test&id=${campaignId}`,
          {
            method: 'POST',
            headers,
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
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-analytics?action=dashboard`,
          { headers }
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
        
        const headers = await getAuthHeaders();
        const response = await fetch(
          `${FUNCTIONS_URL}/mailrelay-analytics?action=campaign_full_report&id=${campaignId}`,
          { headers }
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
    useMailrelaySubscriber,
    useGroups,
    useCreateSubscriber,
    useUpdateSubscriber,
    useDeleteSubscriber,
    useSyncToMailrelay,
    useImportFromMailrelay,
    useLocalSubscribers,
    
    // Campaigns
    useCampaigns,
    useCampaign,
    useSentCampaigns,
    useSenders,
    useCreateCampaign,
    useUpdateCampaign,
    useDeleteCampaign,
    useSendCampaign,
    useSendTestCampaign,
    
    // Analytics
    useDashboard,
    useCampaignReport,
  };
}
