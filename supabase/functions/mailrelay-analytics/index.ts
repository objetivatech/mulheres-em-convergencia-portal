import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAILRELAY_HOST = Deno.env.get('MAILRELAY_HOST');
const MAILRELAY_API_KEY = Deno.env.get('MAILRELAY_API_KEY');

async function mailrelayRequest(endpoint: string, method = 'GET', body?: any) {
  const url = `https://${MAILRELAY_HOST}/api/v1${endpoint}`;
  console.log(`Mailrelay API: ${method} ${url}`);
  
  const options: RequestInit = {
    method,
    headers: {
      'X-Auth-Token': MAILRELAY_API_KEY!,
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    console.error('Mailrelay API error:', data);
    throw new Error(data.error || 'Mailrelay API error');
  }
  
  return data;
}

// Estatísticas gerais
async function getAccountStats() {
  return await mailrelayRequest('/stats');
}

// Detalhes de pacote/conta
async function getPackages() {
  return await mailrelayRequest('/packages');
}

// Estatísticas de campanhas enviadas
async function getSentCampaignsWithStats(page = 1, perPage = 10) {
  const campaigns = await mailrelayRequest(`/sent_campaigns?page=${page}&per_page=${perPage}`);
  
  // Adicionar estatísticas para cada campanha
  const campaignsWithStats = await Promise.all(
    (campaigns.data || campaigns || []).map(async (campaign: any) => {
      try {
        const stats = await mailrelayRequest(`/sent_campaigns/${campaign.id}/stats`);
        return { ...campaign, stats };
      } catch {
        return { ...campaign, stats: null };
      }
    })
  );
  
  return {
    data: campaignsWithStats,
    meta: campaigns.meta,
  };
}

// Cliques de uma campanha específica
async function getCampaignClicks(campaignId: number) {
  return await mailrelayRequest(`/sent_campaigns/${campaignId}/clicks`);
}

// Aberturas de uma campanha específica  
async function getCampaignOpens(campaignId: number) {
  return await mailrelayRequest(`/sent_campaigns/${campaignId}/opens`);
}

// Bounces
async function getCampaignBounces(campaignId: number) {
  return await mailrelayRequest(`/sent_campaigns/${campaignId}/bounces`);
}

// Unsubscribes de uma campanha
async function getCampaignUnsubscribes(campaignId: number) {
  return await mailrelayRequest(`/sent_campaigns/${campaignId}/unsubscribes`);
}

// Dashboard completo
async function getDashboard() {
  const [stats, packages, recentCampaigns] = await Promise.all([
    getAccountStats().catch(() => ({})),
    getPackages().catch(() => []),
    getSentCampaignsWithStats(1, 5).catch(() => ({ data: [] })),
  ]);
  
  // Calcular métricas agregadas
  const campaignsData = recentCampaigns.data || [];
  let totalSent = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  let totalBounced = 0;
  
  for (const campaign of campaignsData) {
    if (campaign.stats) {
      totalSent += campaign.stats.sent || 0;
      totalOpened += campaign.stats.opened || 0;
      totalClicked += campaign.stats.clicked || 0;
      totalBounced += campaign.stats.bounced || 0;
    }
  }
  
  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(2) : '0';
  const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(2) : '0';
  
  return {
    account: stats,
    packages: packages,
    recent_campaigns: campaignsData,
    summary: {
      total_sent: totalSent,
      total_opened: totalOpened,
      total_clicked: totalClicked,
      total_bounced: totalBounced,
      open_rate: openRate,
      click_rate: clickRate,
    },
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!MAILRELAY_HOST || !MAILRELAY_API_KEY) {
      throw new Error('Mailrelay configuration missing');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'dashboard';

    let result;

    switch (action) {
      case 'dashboard': {
        result = await getDashboard();
        break;
      }
      
      case 'stats': {
        result = await getAccountStats();
        break;
      }
      
      case 'packages': {
        result = await getPackages();
        break;
      }
      
      case 'sent_campaigns': {
        const page = parseInt(url.searchParams.get('page') || '1');
        const perPage = parseInt(url.searchParams.get('per_page') || '10');
        result = await getSentCampaignsWithStats(page, perPage);
        break;
      }
      
      case 'campaign_clicks': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('Campaign ID is required');
        result = await getCampaignClicks(id);
        break;
      }
      
      case 'campaign_opens': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('Campaign ID is required');
        result = await getCampaignOpens(id);
        break;
      }
      
      case 'campaign_bounces': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('Campaign ID is required');
        result = await getCampaignBounces(id);
        break;
      }
      
      case 'campaign_unsubscribes': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('Campaign ID is required');
        result = await getCampaignUnsubscribes(id);
        break;
      }
      
      case 'campaign_full_report': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('Campaign ID is required');
        
        const [stats, clicks, opens, bounces, unsubscribes] = await Promise.all([
          mailrelayRequest(`/sent_campaigns/${id}/stats`).catch(() => null),
          getCampaignClicks(id).catch(() => []),
          getCampaignOpens(id).catch(() => []),
          getCampaignBounces(id).catch(() => []),
          getCampaignUnsubscribes(id).catch(() => []),
        ]);
        
        result = {
          stats,
          clicks,
          opens,
          bounces,
          unsubscribes,
        };
        break;
      }
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Action ${action} completed successfully`);
    
    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
    
  } catch (error: any) {
    console.error('Error in mailrelay-analytics:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
