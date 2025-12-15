import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAILRELAY_HOST = Deno.env.get('MAILRELAY_HOST');
const MAILRELAY_API_KEY = Deno.env.get('MAILRELAY_API_KEY');

interface Campaign {
  id?: number;
  subject: string;
  sender_id?: number;
  html_part?: string;
  text_part?: string;
  target?: {
    group_ids?: number[];
  };
  scheduled_date?: string;
}

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
  
  // Handle empty responses (like DELETE)
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  
  if (!response.ok) {
    console.error('Mailrelay API error:', data);
    throw new Error(data.error || data.errors?.join(', ') || 'Mailrelay API error');
  }
  
  return data;
}

// Campanhas (drafts)
async function getCampaigns(page = 1, perPage = 20) {
  return await mailrelayRequest(`/campaigns?page=${page}&per_page=${perPage}`);
}

async function getCampaign(id: number) {
  return await mailrelayRequest(`/campaigns/${id}`);
}

async function createCampaign(campaign: Campaign) {
  return await mailrelayRequest('/campaigns', 'POST', campaign);
}

async function updateCampaign(id: number, campaign: Partial<Campaign>) {
  return await mailrelayRequest(`/campaigns/${id}`, 'PATCH', campaign);
}

async function deleteCampaign(id: number) {
  return await mailrelayRequest(`/campaigns/${id}`, 'DELETE');
}

// Envios
async function sendCampaign(id: number) {
  return await mailrelayRequest(`/campaigns/${id}/send_all`, 'POST');
}

async function sendTestCampaign(id: number, emails: string[]) {
  return await mailrelayRequest(`/campaigns/${id}/send_test`, 'POST', { emails });
}

// Campanhas enviadas
async function getSentCampaigns(page = 1, perPage = 20) {
  return await mailrelayRequest(`/sent_campaigns?page=${page}&per_page=${perPage}`);
}

async function getSentCampaign(id: number) {
  return await mailrelayRequest(`/sent_campaigns/${id}`);
}

async function getSentCampaignClicks(id: number) {
  return await mailrelayRequest(`/sent_campaigns/${id}/clicks`);
}

async function getSentCampaignStats(id: number) {
  return await mailrelayRequest(`/sent_campaigns/${id}/stats`);
}

// Senders (remetentes)
async function getSenders() {
  return await mailrelayRequest('/senders');
}

async function getPackages() {
  return await mailrelayRequest('/packages');
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
    const action = url.searchParams.get('action') || 'list';

    let result;

    switch (action) {
      // Campanhas em rascunho
      case 'list': {
        const page = parseInt(url.searchParams.get('page') || '1');
        const perPage = parseInt(url.searchParams.get('per_page') || '20');
        result = await getCampaigns(page, perPage);
        break;
      }
      
      case 'get': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('ID is required');
        result = await getCampaign(id);
        break;
      }
      
      case 'create': {
        const body = await req.json();
        result = await createCampaign(body);
        break;
      }
      
      case 'update': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('ID is required');
        const body = await req.json();
        result = await updateCampaign(id, body);
        break;
      }
      
      case 'delete': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('ID is required');
        result = await deleteCampaign(id);
        break;
      }
      
      // Envio
      case 'send': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('ID is required');
        result = await sendCampaign(id);
        break;
      }
      
      case 'send_test': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('ID is required');
        const body = await req.json();
        if (!body.emails || !Array.isArray(body.emails)) {
          throw new Error('Emails array is required');
        }
        result = await sendTestCampaign(id, body.emails);
        break;
      }
      
      // Campanhas enviadas
      case 'list_sent': {
        const page = parseInt(url.searchParams.get('page') || '1');
        const perPage = parseInt(url.searchParams.get('per_page') || '20');
        result = await getSentCampaigns(page, perPage);
        break;
      }
      
      case 'get_sent': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('ID is required');
        result = await getSentCampaign(id);
        break;
      }
      
      case 'get_clicks': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('ID is required');
        result = await getSentCampaignClicks(id);
        break;
      }
      
      case 'get_stats': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('ID is required');
        result = await getSentCampaignStats(id);
        break;
      }
      
      // Configurações
      case 'senders': {
        result = await getSenders();
        break;
      }
      
      case 'packages': {
        result = await getPackages();
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
    console.error('Error in mailrelay-campaigns:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
