import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  new_email: string;
  password: string;
}

const PORTAL_URL = 'https://mulheresemconvergencia.com.br';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mailrelayApiKey = Deno.env.get('MAILRELAY_API_KEY')!;
    const mailrelayHost = Deno.env.get('MAILRELAY_HOST')!;
    const adminEmailFrom = Deno.env.get('ADMIN_EMAIL_FROM')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autenticada' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Auth client (caller context)
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { new_email, password }: RequestBody = await req.json();
    const newEmailNormalized = (new_email || '').trim().toLowerCase();

    // Validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmailNormalized)) {
      return new Response(JSON.stringify({ error: 'Email inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (!password || password.length < 6) {
      return new Response(JSON.stringify({ error: 'Senha obrigatória' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (newEmailNormalized === user.email?.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'O novo email é igual ao atual' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Re-authenticate via password sign-in
    const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: user.email!,
      password,
    });
    if (signInError) {
      return new Response(JSON.stringify({ error: 'Senha incorreta' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Service-role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if new_email already used by another user
    const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers();
    const conflict = existingUsers?.find(u => u.email?.toLowerCase() === newEmailNormalized && u.id !== user.id);
    if (conflict) {
      return new Response(JSON.stringify({ error: 'Este email já está em uso por outra conta' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Cancel previous pending requests for this user
    await supabase.from('email_change_requests')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('status', 'pending');

    // Generate token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error: insertError } = await supabase.from('email_change_requests').insert({
      user_id: user.id,
      current_email: user.email!.toLowerCase(),
      new_email: newEmailNormalized,
      token,
      expires_at: expiresAt.toISOString(),
    });
    if (insertError) {
      console.error('[REQUEST-EMAIL-CHANGE] Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Erro ao registrar solicitação' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const fullName = user.user_metadata?.full_name || '';
    const confirmUrl = `${PORTAL_URL}/confirmar-troca-email?token=${token}`;

    // Email to NEW address (confirmation)
    const confirmHtml = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>Confirme seu novo email</title></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:Arial,sans-serif;color:#333;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:40px 0;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
<tr><td align="center" style="background:#C75A92;padding:20px;"><img src="${PORTAL_URL}/assets/logo-horizontal-DLnM2X_1.png" width="200" alt="Mulheres em Convergência"></td></tr>
<tr><td style="padding:40px 30px;text-align:center;">
<h2 style="color:#C75A92;font-size:24px;margin-bottom:20px;">Confirme seu novo email</h2>
<p style="color:#747474;font-size:16px;line-height:1.6;">Olá${fullName ? `, ${fullName}` : ''}!</p>
<p style="color:#747474;font-size:16px;line-height:1.6;margin-bottom:30px;">Recebemos uma solicitação para alterar o email da sua conta no portal Mulheres em Convergência de <strong>${user.email}</strong> para <strong>${newEmailNormalized}</strong>.</p>
<a href="${confirmUrl}" style="display:inline-block;background:#9191C0;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:bold;">Confirmar novo email</a>
<p style="color:#909090;font-size:13px;margin-top:30px;">Este link expira em 24 horas.</p>
<p style="color:#909090;font-size:13px;">Se o botão não funcionar, copie e cole este link no navegador:<br><span style="color:#9191C0;word-break:break-all;">${confirmUrl}</span></p>
<p style="color:#d32f2f;font-size:13px;margin-top:20px;font-weight:bold;">Se você não solicitou esta alteração, ignore este email. Nenhuma mudança será feita.</p>
</td></tr>
<tr><td style="background:#f0f0f0;padding:20px;text-align:center;color:#909090;font-size:13px;">© ${new Date().getFullYear()} Mulheres em Convergência</td></tr>
</table></td></tr></table></body></html>`;

    const mailrelayPayload = {
      from: { email: adminEmailFrom, name: 'Mulheres em Convergência' },
      to: [{ email: newEmailNormalized, name: fullName || newEmailNormalized }],
      subject: 'Confirme seu novo email - Mulheres em Convergência',
      html_part: confirmHtml,
    };

    const mrRes = await fetch(`https://${mailrelayHost}/api/v1/send_emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-AUTH-TOKEN': mailrelayApiKey },
      body: JSON.stringify(mailrelayPayload),
    });
    if (!mrRes.ok) {
      const errText = await mrRes.text();
      console.error('[REQUEST-EMAIL-CHANGE] Mailrelay error:', errText);
      return new Response(JSON.stringify({ error: 'Erro ao enviar email de confirmação' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Notify OLD email (security alert)
    const alertHtml = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:Arial,sans-serif;color:#333;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:40px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td align="center" style="background:#C75A92;padding:20px;"><img src="${PORTAL_URL}/assets/logo-horizontal-DLnM2X_1.png" width="200" alt="MeC"></td></tr>
<tr><td style="padding:40px 30px;">
<h2 style="color:#C75A92;">Solicitação de troca de email</h2>
<p>Olá${fullName ? `, ${fullName}` : ''}!</p>
<p>Recebemos uma solicitação para trocar o email da sua conta para <strong>${newEmailNormalized}</strong>.</p>
<p>Para concluir, é necessário clicar no link de confirmação enviado para o novo endereço.</p>
<p style="color:#d32f2f;font-weight:bold;">Se você não fez essa solicitação, recomendamos alterar sua senha imediatamente.</p>
</td></tr></table></td></tr></table></body></html>`;

    await fetch(`https://${mailrelayHost}/api/v1/send_emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-AUTH-TOKEN': mailrelayApiKey },
      body: JSON.stringify({
        from: { email: adminEmailFrom, name: 'Mulheres em Convergência' },
        to: [{ email: user.email!, name: fullName || user.email! }],
        subject: 'Aviso de segurança: solicitação de troca de email',
        html_part: alertHtml,
      }),
    }).catch(e => console.error('[REQUEST-EMAIL-CHANGE] Alert email failed:', e));

    return new Response(JSON.stringify({
      success: true,
      message: `Enviamos um link de confirmação para ${newEmailNormalized}. Acesse o link para concluir a troca.`,
      expires_at: expiresAt.toISOString(),
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[REQUEST-EMAIL-CHANGE] Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Erro interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});