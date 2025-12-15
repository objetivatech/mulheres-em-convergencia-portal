import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAILRELAY_HOST = Deno.env.get('MAILRELAY_HOST');
const MAILRELAY_API_KEY = Deno.env.get('MAILRELAY_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface MailrelaySubscriber {
  id?: number;
  email: string;
  name?: string;
  status?: string;
  group_ids?: number[];
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
  const data = await response.json();
  
  if (!response.ok) {
    console.error('Mailrelay API error:', data);
    throw new Error(data.error || 'Mailrelay API error');
  }
  
  return data;
}

async function getSubscribers(page = 1, perPage = 50) {
  return await mailrelayRequest(`/subscribers?page=${page}&per_page=${perPage}`);
}

async function getSubscriber(id: number) {
  return await mailrelayRequest(`/subscribers/${id}`);
}

async function createSubscriber(subscriber: MailrelaySubscriber) {
  return await mailrelayRequest('/subscribers', 'POST', subscriber);
}

async function updateSubscriber(id: number, subscriber: Partial<MailrelaySubscriber>) {
  return await mailrelayRequest(`/subscribers/${id}`, 'PATCH', subscriber);
}

async function deleteSubscriber(id: number) {
  return await mailrelayRequest(`/subscribers/${id}`, 'DELETE');
}

async function getGroups() {
  return await mailrelayRequest('/groups');
}

async function createGroup(name: string, description?: string) {
  return await mailrelayRequest('/groups', 'POST', { name, description });
}

async function syncSubscribersFromSupabase(supabase: any) {
  console.log('Starting sync from Supabase to Mailrelay...');
  
  // Buscar assinantes locais que precisam ser sincronizados
  const { data: localSubscribers, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('active', true)
    .is('synced_at', null);
  
  if (error) throw error;
  
  const results = { synced: 0, failed: 0, errors: [] as string[] };
  
  for (const subscriber of localSubscribers || []) {
    try {
      // Criar no Mailrelay
      const mailrelayData = await createSubscriber({
        email: subscriber.email,
        name: subscriber.name || '',
      });
      
      // Atualizar registro local com ID do Mailrelay
      await supabase
        .from('newsletter_subscribers')
        .update({
          mailrelay_id: String(mailrelayData.id),
          synced_at: new Date().toISOString(),
          last_sync_error: null,
        })
        .eq('id', subscriber.id);
      
      results.synced++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(`${subscriber.email}: ${err.message}`);
      
      // Registrar erro
      await supabase
        .from('newsletter_subscribers')
        .update({ last_sync_error: err.message })
        .eq('id', subscriber.id);
    }
  }
  
  // Log da sincronização
  await supabase.from('mailrelay_sync_log').insert({
    operation_type: 'sync_to_mailrelay',
    entity_type: 'subscriber',
    operation: 'bulk_sync',
    status: results.failed > 0 ? 'partial' : 'success',
    request_data: { total: localSubscribers?.length, synced: results.synced, failed: results.failed },
    response_data: results,
    processed_at: new Date().toISOString(),
  });
  
  return results;
}

async function importFromMailrelay(supabase: any) {
  console.log('Importing subscribers from Mailrelay...');
  
  let page = 1;
  let hasMore = true;
  const results = { imported: 0, updated: 0, errors: [] as string[] };
  
  while (hasMore) {
    const response = await getSubscribers(page, 100);
    const subscribers = response.data || response;
    
    if (!subscribers || subscribers.length === 0) {
      hasMore = false;
      break;
    }
    
    for (const sub of subscribers) {
      try {
        // Verificar se já existe
        const { data: existing } = await supabase
          .from('newsletter_subscribers')
          .select('id')
          .eq('email', sub.email)
          .single();
        
        if (existing) {
          // Atualizar
          await supabase
            .from('newsletter_subscribers')
            .update({
              mailrelay_id: String(sub.id),
              synced_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          results.updated++;
        } else {
          // Inserir novo
          await supabase
            .from('newsletter_subscribers')
            .insert({
              email: sub.email,
              name: sub.name || null,
              mailrelay_id: String(sub.id),
              origin: 'mailrelay_import',
              synced_at: new Date().toISOString(),
            });
          results.imported++;
        }
      } catch (err: any) {
        results.errors.push(`${sub.email}: ${err.message}`);
      }
    }
    
    page++;
    if (subscribers.length < 100) hasMore = false;
  }
  
  return results;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!MAILRELAY_HOST || !MAILRELAY_API_KEY) {
      throw new Error('Mailrelay configuration missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';

    let result;

    switch (action) {
      case 'list': {
        const page = parseInt(url.searchParams.get('page') || '1');
        const perPage = parseInt(url.searchParams.get('per_page') || '50');
        result = await getSubscribers(page, perPage);
        break;
      }
      
      case 'get': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('ID is required');
        result = await getSubscriber(id);
        break;
      }
      
      case 'create': {
        const body = await req.json();
        result = await createSubscriber(body);
        break;
      }
      
      case 'update': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('ID is required');
        const body = await req.json();
        result = await updateSubscriber(id, body);
        break;
      }
      
      case 'delete': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('ID is required');
        result = await deleteSubscriber(id);
        break;
      }
      
      case 'groups': {
        result = await getGroups();
        break;
      }
      
      case 'create_group': {
        const body = await req.json();
        result = await createGroup(body.name, body.description);
        break;
      }
      
      case 'sync_to_mailrelay': {
        result = await syncSubscribersFromSupabase(supabase);
        break;
      }
      
      case 'import_from_mailrelay': {
        result = await importFromMailrelay(supabase);
        break;
      }
      
      case 'stats': {
        // Obter estatísticas básicas
        const [subscribers, groups] = await Promise.all([
          getSubscribers(1, 1), // Para pegar o total
          getGroups(),
        ]);
        
        // Também pegar stats locais
        const { count: localCount } = await supabase
          .from('newsletter_subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('active', true);
        
        const { count: pendingSyncCount } = await supabase
          .from('newsletter_subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('active', true)
          .is('synced_at', null);
        
        result = {
          mailrelay: {
            total_subscribers: subscribers.meta?.total || 0,
            total_groups: groups.length || 0,
          },
          local: {
            total_subscribers: localCount || 0,
            pending_sync: pendingSyncCount || 0,
          },
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
    console.error('Error in mailrelay-subscribers:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
