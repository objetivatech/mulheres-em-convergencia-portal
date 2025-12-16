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
  custom_fields?: Record<string, any>;
}

function formatErrorMessage(data: any): string {
  if (typeof data.error === 'string') return data.error;
  if (Array.isArray(data.errors)) return data.errors.join(', ');
  if (typeof data.errors === 'object' && data.errors !== null) {
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
  if (data.message) return data.message;
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

async function getSubscribers(page = 1, perPage = 50, search?: string) {
  let endpoint = `/subscribers?page=${page}&per_page=${perPage}`;
  if (search) {
    endpoint += `&q[email_cont]=${encodeURIComponent(search)}`;
  }
  return await mailrelayRequest(endpoint);
}

async function getSubscriber(id: number) {
  return await mailrelayRequest(`/subscribers/${id}`);
}

async function getSubscriberByEmail(email: string) {
  const result = await mailrelayRequest(`/subscribers?q[email_eq]=${encodeURIComponent(email)}`);
  const subscribers = result.data || result || [];
  return subscribers.length > 0 ? subscribers[0] : null;
}

async function createSubscriber(subscriber: MailrelaySubscriber) {
  if (!subscriber.email) {
    throw new Error('Email é obrigatório');
  }
  
  const payload: any = {
    email: subscriber.email,
    status: subscriber.status || 'active',
  };
  
  if (subscriber.name) payload.name = subscriber.name;
  if (subscriber.group_ids && subscriber.group_ids.length > 0) {
    payload.group_ids = subscriber.group_ids;
  }
  if (subscriber.custom_fields) payload.custom_fields = subscriber.custom_fields;
  
  return await mailrelayRequest('/subscribers', 'POST', payload);
}

async function updateSubscriber(id: number, subscriber: Partial<MailrelaySubscriber>) {
  const payload: any = {};
  
  if (subscriber.email) payload.email = subscriber.email;
  if (subscriber.name !== undefined) payload.name = subscriber.name;
  if (subscriber.status) payload.status = subscriber.status;
  if (subscriber.group_ids) payload.group_ids = subscriber.group_ids;
  if (subscriber.custom_fields) payload.custom_fields = subscriber.custom_fields;
  
  return await mailrelayRequest(`/subscribers/${id}`, 'PATCH', payload);
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
  
  // Buscar assinantes locais que precisam ser sincronizados (limite de 50 por execução)
  const { data: localSubscribers, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('active', true)
    .is('synced_at', null)
    .limit(50);
  
  if (error) throw error;
  
  const results = { synced: 0, failed: 0, errors: [] as string[], remaining: 0 };
  
  for (const subscriber of localSubscribers || []) {
    try {
      // Check if already exists in Mailrelay
      const existing = await getSubscriberByEmail(subscriber.email).catch(() => null);
      
      if (existing) {
        // Update local record with Mailrelay ID
        await supabase
          .from('newsletter_subscribers')
          .update({
            mailrelay_id: String(existing.id),
            synced_at: new Date().toISOString(),
            last_sync_error: null,
          })
          .eq('id', subscriber.id);
        results.synced++;
      } else {
        // Create in Mailrelay
        const mailrelayData = await createSubscriber({
          email: subscriber.email,
          name: subscriber.name || '',
          status: subscriber.active ? 'active' : 'inactive',
        });
        
        // Update local record with Mailrelay ID
        await supabase
          .from('newsletter_subscribers')
          .update({
            mailrelay_id: String(mailrelayData.id),
            synced_at: new Date().toISOString(),
            last_sync_error: null,
          })
          .eq('id', subscriber.id);
        
        results.synced++;
      }
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
  
  // Check if there are more to sync
  const { count } = await supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('active', true)
    .is('synced_at', null);
  
  results.remaining = (count || 0) - results.synced;
  
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

async function importFromMailrelay(supabase: any, maxPages = 3) {
  console.log('Importing subscribers from Mailrelay...');
  
  let page = 1;
  let hasMore = true;
  const results = { imported: 0, updated: 0, errors: [] as string[] };
  
  while (hasMore && page <= maxPages) {
    const response = await getSubscribers(page, 50);
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
              name: sub.name || null,
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
              active: sub.status === 'active',
              synced_at: new Date().toISOString(),
            });
          results.imported++;
        }
      } catch (err: any) {
        results.errors.push(`${sub.email}: ${err.message}`);
      }
    }
    
    page++;
    if (subscribers.length < 50) hasMore = false;
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
        const search = url.searchParams.get('search') || undefined;
        result = await getSubscribers(page, perPage, search);
        break;
      }
      
      case 'get': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('ID is required');
        result = await getSubscriber(id);
        break;
      }
      
      case 'get_by_email': {
        const email = url.searchParams.get('email');
        if (!email) throw new Error('Email is required');
        result = await getSubscriberByEmail(email);
        break;
      }
      
      case 'create': {
        const body = await req.json();
        result = await createSubscriber(body);
        
        // Also save to local database
        if (result && result.id) {
          await supabase.from('newsletter_subscribers').upsert({
            email: body.email,
            name: body.name || null,
            mailrelay_id: String(result.id),
            active: body.status !== 'inactive',
            origin: 'admin_portal',
            synced_at: new Date().toISOString(),
          }, { onConflict: 'email' });
        }
        break;
      }
      
      case 'update': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('ID is required');
        const body = await req.json();
        result = await updateSubscriber(id, body);
        
        // Update local database too
        if (body.email) {
          await supabase
            .from('newsletter_subscribers')
            .update({
              name: body.name,
              active: body.status !== 'inactive',
              synced_at: new Date().toISOString(),
            })
            .eq('mailrelay_id', String(id));
        }
        break;
      }
      
      case 'delete': {
        const id = parseInt(url.searchParams.get('id') || '0');
        if (!id) throw new Error('ID is required');
        result = await deleteSubscriber(id);
        
        // Mark as inactive in local database
        await supabase
          .from('newsletter_subscribers')
          .update({ active: false, synced_at: new Date().toISOString() })
          .eq('mailrelay_id', String(id));
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
            total_groups: (groups?.data || groups || []).length,
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
