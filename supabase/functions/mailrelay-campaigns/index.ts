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
  preview_text?: string;
  reply_to?: string;
  target?: {
    group_ids?: number[];
    segment_id?: number;
  };
  scheduled_date?: string;
  url_token?: boolean;
  analytics_utm_campaign?: string;
}

function formatErrorMessage(data: any): string {
  // Handle various error formats from Mailrelay API
  if (typeof data.error === 'string') {
    return data.error;
  }
  if (Array.isArray(data.errors)) {
    return data.errors.join(', ');
  }
  if (typeof data.errors === 'object' && data.errors !== null) {
    // Handle object errors like { field: ["error message"] }
    const errorMessages: string[] = [];
    for (const [field, messages] of Object.entries(data.errors)) {
      if (Array.isArray(messages)) {
        errorMessages.push(`${field}: ${messages.join(', ')}`);
      } else if (typeof messages === 'string') {
        errorMessages.push(`${field}: ${messages}`);
      }
    }
    return errorMessages.length > 0 ? errorMessages.join('; ') : JSON.stringify(data.errors);
  }
  if (data.message) {
    return data.message;
  }
  return 'Mailrelay API error';
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
    console.log('Request body:', JSON.stringify(body, null, 2));
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
    throw new Error(formatErrorMessage(data));
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
  // Validate required fields
  if (!campaign.subject) {
    throw new Error('Assunto é obrigatório');
  }
  if (!campaign.html_part) {
    throw new Error('Conteúdo HTML é obrigatório');
  }
  
  // Build campaign payload
  const payload: any = {
    subject: campaign.subject,
    html_part: campaign.html_part,
  };
  
  if (campaign.sender_id) payload.sender_id = campaign.sender_id;
  if (campaign.text_part) payload.text_part = campaign.text_part;
  if (campaign.preview_text) payload.preview_text = campaign.preview_text;
  if (campaign.reply_to) payload.reply_to = campaign.reply_to;
  if (campaign.target) payload.target = campaign.target;
  if (campaign.url_token !== undefined) payload.url_token = campaign.url_token;
  if (campaign.analytics_utm_campaign) payload.analytics_utm_campaign = campaign.analytics_utm_campaign;
  
  return await mailrelayRequest('/campaigns', 'POST', payload);
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
  if (!emails || emails.length === 0) {
    throw new Error('Pelo menos um email é obrigatório para envio de teste');
  }
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

// Groups
async function getGroups() {
  return await mailrelayRequest('/groups');
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
      
      case 'groups': {
        result = await getGroups();
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
