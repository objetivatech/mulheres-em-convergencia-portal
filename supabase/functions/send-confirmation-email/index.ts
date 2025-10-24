import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConfirmationEmailRequest {
  user_id: string;
  email: string;
  full_name: string;
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
    const body: ConfirmationEmailRequest = await req.json();
    const { user_id, email, full_name } = body;

    if (!user_id || !email) {
      return new Response(
        JSON.stringify({ error: 'user_id and email are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[SEND-CONFIRMATION-EMAIL] Processing for user: ${email}`);

    // Generate unique token (32 bytes = 64 hex characters)
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Token expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Save token to database
    const { error: tokenError } = await supabase
      .from('email_confirmation_tokens')
      .insert({
        user_id,
        token,
        email,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error('[SEND-CONFIRMATION-EMAIL] Error saving token:', tokenError);
      throw new Error('Failed to create confirmation token');
    }

    // Build confirmation URL
    const confirmationUrl = `https://mulheresemconvergencia.com.br/confirm-email?token=${token}`;

    // HTML Email Template (based on 01_confirmar_cadastro.html)
    const emailHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><title>Confirme seu cadastro</title></head>
<body style="margin:0; padding:0; background-color:#f7f7f7; font-family:Arial, Helvetica, sans-serif; color:#333;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f7f7f7; padding:40px 0;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
<tr><td align="center" style="background-color:#C75A92; padding:20px;"><img src="https://mulheresemconvergencia.com.br/assets/logo-horizontal-DLnM2X_1.png" width="200" alt="Mulheres em Convergência"></td></tr>
<tr><td style="padding:40px 30px; text-align:center;">
<h2 style="color:#C75A92; font-size:24px; margin-bottom:20px;">Confirme seu cadastro</h2>
<p style="color:#747474; font-size:16px; line-height:1.6; margin-bottom:30px;">Olá${full_name ? `, ${full_name}` : ''}! Para ativar sua conta, confirme seu endereço de e-mail clicando no botão abaixo:</p>
<a href="${confirmationUrl}" style="display:inline-block; background-color:#9191C0; color:#fff; text-decoration:none; padding:14px 32px; border-radius:6px; font-size:16px; font-weight:bold;">Confirmar e-mail</a>
<p style="color:#909090; font-size:13px; margin-top:30px;">Este link expira em 24 horas.</p>
<p style="color:#909090; font-size:13px; margin-top:10px;">Se o botão não funcionar, copie e cole este link no navegador:<br><span style="color:#9191C0; word-break:break-all;">${confirmationUrl}</span></p>
</td></tr>
<tr><td style="background-color:#f0f0f0; padding:20px; text-align:center; color:#909090; font-size:13px;">Caso não tenha solicitado este cadastro, ignore este e-mail.<br>© ${new Date().getFullYear()} Mulheres em Convergência</td></tr>
</table></td></tr></table>
</body></html>`;

    // Send email via MailRelay API
    const mailrelayPayload = {
      function: "sendMail",
      apiKey: mailrelayApiKey,
      from: adminEmailFrom,
      from_name: "Mulheres em Convergência",
      to: email,
      subject: "Confirme seu cadastro - Mulheres em Convergência",
      html: emailHtml,
    };

    console.log(`[SEND-CONFIRMATION-EMAIL] Sending email to: ${email}`);

    const mailrelayResponse = await fetch(`https://${mailrelayHost}/api/v1/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mailrelayPayload),
    });

    const mailrelayResult = await mailrelayResponse.json();

    if (!mailrelayResponse.ok) {
      console.error('[SEND-CONFIRMATION-EMAIL] MailRelay error:', mailrelayResult);
      throw new Error(`MailRelay API error: ${JSON.stringify(mailrelayResult)}`);
    }

    console.log(`[SEND-CONFIRMATION-EMAIL] Email sent successfully to ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Confirmation email sent successfully',
        token_expires_at: expiresAt.toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[SEND-CONFIRMATION-EMAIL] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send confirmation email',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

