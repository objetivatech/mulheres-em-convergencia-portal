import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReplyRequest {
  message_id: string;
  reply_text: string;
  admin_email?: string;
  admin_name?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mailrelayApiKey = Deno.env.get('MAILRELAY_API_KEY')!;
    const mailrelayHost = Deno.env.get('MAILRELAY_HOST')!;
    const adminEmailFrom = Deno.env.get('ADMIN_EMAIL_FROM')!;

    if (!mailrelayApiKey || !mailrelayHost || !adminEmailFrom) {
      throw new Error('MailRelay configuration missing');
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: ReplyRequest = await req.json();
    const { message_id, reply_text, admin_email, admin_name } = body;

    if (!message_id || !reply_text) {
      return new Response(
        JSON.stringify({ error: 'message_id and reply_text are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[REPLY-CONTACT-MESSAGE] Processing reply for message: ${message_id}`);

    // Get original message from database
    const { data: originalMessage, error: fetchError } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('id', message_id)
      .single();

    if (fetchError || !originalMessage) {
      console.error('[REPLY-CONTACT-MESSAGE] Error fetching message:', fetchError);
      throw new Error('Message not found');
    }

    // Build reply email HTML
    const emailHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Resposta - Mulheres em Convergência</title>
</head>
<body style="margin:0; padding:0; background-color:#f7f7f7; font-family:Arial, Helvetica, sans-serif; color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f7f7f7; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#C75A92; padding:20px;">
              <img src="https://mulheresemconvergencia.com.br/assets/logo-horizontal-DLnM2X_1.png" width="200" alt="Mulheres em Convergência">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:40px 30px;">
              <p style="color:#333; font-size:16px; line-height:1.6; margin-bottom:20px; white-space:pre-wrap;">${reply_text}</p>
              
              <hr style="border:none; border-top:1px solid #e0e0e0; margin:30px 0;">
              
              <div style="background-color:#f9f9f9; padding:20px; border-radius:8px; margin-top:20px;">
                <p style="color:#666; font-size:14px; margin:0 0 10px 0;"><strong>Mensagem original:</strong></p>
                <p style="color:#666; font-size:14px; margin:0 0 5px 0;"><strong>De:</strong> ${originalMessage.name} (${originalMessage.email})</p>
                <p style="color:#666; font-size:14px; margin:0 0 5px 0;"><strong>Assunto:</strong> ${originalMessage.subject}</p>
                <p style="color:#666; font-size:14px; margin:0 0 15px 0;"><strong>Data:</strong> ${new Date(originalMessage.created_at).toLocaleString('pt-BR')}</p>
                <p style="color:#666; font-size:14px; line-height:1.6; margin:0; white-space:pre-wrap;">${originalMessage.message}</p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#f0f0f0; padding:20px; text-align:center; color:#909090; font-size:13px;">
              Esta é uma resposta à sua mensagem enviada através do formulário de contato.<br>
              © ${new Date().getFullYear()} Mulheres em Convergência
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send email via MailRelay API
    const mailrelayPayload = {
      "from": {
        "email": admin_email || adminEmailFrom,
        "name": admin_name || "Mulheres em Convergência"
      },
      "to": [
        {
          "email": originalMessage.email,
          "name": originalMessage.name
        }
      ],
      "subject": `Re: ${originalMessage.subject}`,
      "html_part": emailHtml
    };

    console.log(`[REPLY-CONTACT-MESSAGE] Sending reply email to: ${originalMessage.email}`);

    const mailrelayResponse = await fetch(`https://${mailrelayHost}/api/v1/send_emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AUTH-TOKEN': mailrelayApiKey,
      },
      body: JSON.stringify(mailrelayPayload),
    });

    // Check if response is JSON before parsing
    const contentType = mailrelayResponse.headers.get('content-type');
    let mailrelayResult: any;
    
    if (contentType && contentType.includes('application/json')) {
      mailrelayResult = await mailrelayResponse.json();
    } else {
      const textResponse = await mailrelayResponse.text();
      console.error('[REPLY-CONTACT-MESSAGE] MailRelay returned non-JSON response:', textResponse.substring(0, 200));
      throw new Error(`MailRelay API error: Invalid response format. Check MAILRELAY_HOST and MAILRELAY_API_KEY configuration.`);
    }

    if (!mailrelayResponse.ok) {
      console.error('[REPLY-CONTACT-MESSAGE] MailRelay error:', mailrelayResult);
      throw new Error(`MailRelay API error: ${JSON.stringify(mailrelayResult)}`);
    }

    console.log(`[REPLY-CONTACT-MESSAGE] Reply sent successfully to ${originalMessage.email}`);

    // Update message status to 'replied'
    const { error: updateError } = await supabase
      .from('contact_messages')
      .update({ 
        status: 'replied',
        updated_at: new Date().toISOString()
      })
      .eq('id', message_id);

    if (updateError) {
      console.error('[REPLY-CONTACT-MESSAGE] Error updating message status:', updateError);
      // Don't throw, email was sent successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reply sent successfully via MailRelay',
        sent_to: originalMessage.email
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[REPLY-CONTACT-MESSAGE] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send reply',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

