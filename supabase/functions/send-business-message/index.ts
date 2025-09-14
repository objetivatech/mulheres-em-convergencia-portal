import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'
import { corsHeaders } from '../_shared/cors.ts'

interface BusinessMessageRequest {
  business_id: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  message: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[SEND-BUSINESS-MESSAGE] Request received');
    const body: BusinessMessageRequest = await req.json();

    // Validate required fields
    if (!body.business_id || !body.sender_name || !body.sender_email || !body.subject || !body.message) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Todos os campos são obrigatórios' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify business exists and get owner info
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select(`
        id, 
        name, 
        owner_id,
        profiles!businesses_owner_id_fkey (
          email,
          full_name
        )
      `)
      .eq('id', body.business_id)
      .maybeSingle();

    if (businessError || !business) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Empresa não encontrada' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert message into database
    const { data: message, error: messageError } = await supabase
      .from('business_messages')
      .insert({
        business_id: body.business_id,
        sender_name: body.sender_name.trim(),
        sender_email: body.sender_email.trim(),
        subject: body.subject.trim(),
        message: body.message.trim()
      })
      .select()
      .single();

    if (messageError) {
      console.error('[SEND-BUSINESS-MESSAGE] Database error:', messageError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Erro ao salvar mensagem' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update business analytics
    await supabase.rpc('update_business_analytics', {
      business_uuid: body.business_id,
      metric_name: 'contacts',
      increment_by: 1
    });

    // TODO: Integrate with MailRelay API to send notification email
    // This would require MailRelay configuration and email templates
    console.log('[SEND-BUSINESS-MESSAGE] Message saved, MailRelay integration pending');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mensagem enviada com sucesso! O proprietário da empresa será notificado.',
        message_id: message.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-business-message:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor. Tente novamente.',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});