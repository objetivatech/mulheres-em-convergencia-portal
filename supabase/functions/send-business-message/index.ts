import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'
import { corsHeaders } from '../_shared/cors.ts'
import { enviarEmail } from '../_shared/enviar-email.ts'

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

    // Aviso para a dona do negócio pelo canal oficial de e-mail
    let emailSent = false;
    try {
      if (business.profiles?.email) {
        const ownerEmail = business.profiles.email;
        const ownerName = business.profiles.full_name || 'Proprietário(a)';

        // Prepare email content
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #C75A92; padding: 20px; text-align: center;">
              <img src="https://mulheresemconvergencia.com.br/assets/logo-horizontal-DLnM2X_1.png" width="200" alt="Mulheres em Convergência">
            </div>
            <div style="padding: 30px; background-color: #ffffff;">
              <h2 style="color: #C75A92; margin-top: 0;">Nova Mensagem para ${business.name}</h2>
              <p style="color: #555;">Olá, ${ownerName}!</p>
              <p style="color: #555;">Você recebeu uma nova mensagem através do seu perfil no Mulheres em Convergência:</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>De:</strong> ${body.sender_name}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${body.sender_email}</p>
                <p style="margin: 5px 0;"><strong>Assunto:</strong> ${body.subject}</p>
                <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
              </div>
              
              <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h3 style="color: #333; margin-top: 0;">Mensagem:</h3>
                <p style="white-space: pre-wrap; color: #555;">${body.message}</p>
              </div>
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="https://mulheresemconvergencia.com.br/dashboard-empresa" 
                   style="display: inline-block; background-color: #9191C0; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">
                  Ver no Painel
                </a>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  💡 <strong>Dica:</strong> Responda diretamente para ${body.sender_email} ou acesse seu painel para gerenciar mensagens.
                </p>
              </div>
            </div>
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; color: #909090; font-size: 13px;">
              © ${new Date().getFullYear()} Mulheres em Convergência
            </div>
          </div>
        `;

        await enviarEmail(
          { email: ownerEmail, nome: ownerName },
          `Nova mensagem para ${business.name}: ${body.subject}`,
          emailHtml,
        );
        emailSent = true;
        console.log(`[SEND-BUSINESS-MESSAGE] Email sent to business owner: ${ownerEmail}`);
      }
    } catch (emailError) {
      console.error('[SEND-BUSINESS-MESSAGE] Error sending notification email:', emailError);
      // Don't fail the request if email fails
    }

    console.log(`[SEND-BUSINESS-MESSAGE] Message saved, email sent: ${emailSent}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: emailSent ? 'Mensagem enviada com sucesso! O proprietário da empresa foi notificado por email.' : 'Mensagem enviada com sucesso! O proprietário da empresa será notificado.',
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