import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PasswordResetRequest {
  email: string;
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
    const body: PasswordResetRequest = await req.json();
    const { email } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[SEND-PASSWORD-RESET] Processing for email: ${email}`);

    // Find user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('[SEND-PASSWORD-RESET] Error listing users:', userError);
      throw new Error('Failed to find user');
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      // For security, don't reveal if user exists or not
      console.log(`[SEND-PASSWORD-RESET] User not found for email: ${email}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Se o email existir em nossa base, você receberá instruções para redefinir sua senha.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate unique token (32 bytes = 64 hex characters)
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Token expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Save token to database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        email: email.toLowerCase(),
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error('[SEND-PASSWORD-RESET] Error saving token:', tokenError);
      throw new Error('Failed to create reset token');
    }

    // Build reset URL
    const resetUrl = `https://mulheresemconvergencia.com.br/reset-password?token=${token}`;

    // Get user's full name from metadata
    const fullName = user.user_metadata?.full_name || '';

    // HTML Email Template (based on 05_redefinir_senha.html)
    const emailHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><title>Redefina sua senha</title></head>
<body style="margin:0; padding:0; background-color:#f7f7f7; font-family:Arial, Helvetica, sans-serif; color:#333;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f7f7f7; padding:40px 0;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
<tr><td align="center" style="background-color:#C75A92; padding:20px;"><img src="https://mulheresemconvergencia.com.br/assets/logo-horizontal-DLnM2X_1.png" width="200" alt="Mulheres em Convergência"></td></tr>
<tr><td style="padding:40px 30px; text-align:center;">
<h2 style="color:#C75A92; font-size:24px; margin-bottom:20px;">Redefina sua senha</h2>
<p style="color:#747474; font-size:16px; line-height:1.6; margin-bottom:30px;">Olá${fullName ? `, ${fullName}` : ''}! Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
<a href="${resetUrl}" style="display:inline-block; background-color:#9191C0; color:#fff; text-decoration:none; padding:14px 32px; border-radius:6px; font-size:16px; font-weight:bold;">Redefinir senha</a>
<p style="color:#909090; font-size:13px; margin-top:30px;">Este link expira em 1 hora.</p>
<p style="color:#909090; font-size:13px; margin-top:10px;">Se o botão não funcionar, copie e cole este link no navegador:<br><span style="color:#9191C0; word-break:break-all;">${resetUrl}</span></p>
<p style="color:#d32f2f; font-size:13px; margin-top:20px; font-weight:bold;">Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanecerá inalterada.</p>
</td></tr>
<tr><td style="background-color:#f0f0f0; padding:20px; text-align:center; color:#909090; font-size:13px;">© ${new Date().getFullYear()} Mulheres em Convergência</td></tr>
</table></td></tr></table>
</body></html>`;

    // Send email via MailRelay API
    const mailrelayPayload = {
      function: "sendMail",
      apiKey: mailrelayApiKey,
      from: adminEmailFrom,
      from_name: "Mulheres em Convergência",
      to: email,
      subject: "Redefinição de senha - Mulheres em Convergência",
      html: emailHtml,
    };

    console.log(`[SEND-PASSWORD-RESET] Sending email to: ${email}`);

    const mailrelayResponse = await fetch(`https://${mailrelayHost}/api/v1/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mailrelayPayload),
    });

    const mailrelayResult = await mailrelayResponse.json();

    if (!mailrelayResponse.ok) {
      console.error('[SEND-PASSWORD-RESET] MailRelay error:', mailrelayResult);
      throw new Error(`MailRelay API error: ${JSON.stringify(mailrelayResult)}`);
    }

    console.log(`[SEND-PASSWORD-RESET] Email sent successfully to ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Se o email existir em nossa base, você receberá instruções para redefinir sua senha.',
        token_expires_at: expiresAt.toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[SEND-PASSWORD-RESET] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send password reset email',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

