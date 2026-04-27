import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  token: string;
}

const PORTAL_URL = 'https://mulheresemconvergencia.com.br';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mailrelayApiKey = Deno.env.get('MAILRELAY_API_KEY')!;
    const mailrelayHost = Deno.env.get('MAILRELAY_HOST')!;
    const adminEmailFrom = Deno.env.get('ADMIN_EMAIL_FROM')!;

    const { token }: RequestBody = await req.json();
    if (!token || token.length < 32) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the request
    const { data: request, error: fetchError } = await supabase
      .from('email_change_requests')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (fetchError || !request) {
      return new Response(JSON.stringify({ error: 'Token não encontrado' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (request.status !== 'pending') {
      return new Response(JSON.stringify({ error: `Solicitação já ${request.status === 'confirmed' ? 'confirmada' : 'inválida'}` }), {
        status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (new Date(request.expires_at) < new Date()) {
      await supabase.from('email_change_requests').update({ status: 'expired' }).eq('id', request.id);
      return new Response(JSON.stringify({ error: 'Token expirado. Solicite uma nova troca.' }), {
        status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const newEmail = request.new_email.toLowerCase();
    const oldEmail = request.current_email.toLowerCase();

    // 1) Update auth.users via admin API
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(request.user_id, {
      email: newEmail,
      email_confirm: true, // mark as already confirmed since we verified via our own link
    });
    if (authUpdateError) {
      console.error('[CONFIRM-EMAIL-CHANGE] auth.admin update failed:', authUpdateError);
      return new Response(JSON.stringify({ error: 'Falha ao atualizar email na autenticação: ' + authUpdateError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2) Update profiles.email
    await supabase.from('profiles').update({ email: newEmail }).eq('id', request.user_id);

    // 3) Update user_contacts: mark old as non-primary; upsert new as primary+verified
    await supabase.from('user_contacts')
      .update({ is_primary: false })
      .eq('user_id', request.user_id)
      .eq('contact_type', 'email');

    await supabase.from('user_contacts').upsert({
      user_id: request.user_id,
      contact_type: 'email',
      contact_value: newEmail,
      is_primary: true,
      verified: true,
    }, { onConflict: 'user_id,contact_type,contact_value' });

    // 4) Update CRM leads (by user CPF or email match) - best effort
    try {
      const { data: profile } = await supabase.from('profiles').select('cpf').eq('id', request.user_id).maybeSingle();
      if (profile?.cpf) {
        await supabase.from('crm_leads').update({ email: newEmail }).eq('cpf', profile.cpf);
      }
      await supabase.from('crm_leads').update({ email: newEmail }).eq('email', oldEmail);
    } catch (e) {
      console.error('[CONFIRM-EMAIL-CHANGE] CRM update warn:', e);
    }

    // 5) Update Mailrelay subscriber if exists - best effort
    try {
      const findRes = await fetch(`https://${mailrelayHost}/api/v1/subscribers?email=${encodeURIComponent(oldEmail)}`, {
        headers: { 'X-AUTH-TOKEN': mailrelayApiKey },
      });
      if (findRes.ok) {
        const data = await findRes.json();
        const sub = Array.isArray(data) ? data[0] : data?.data?.[0];
        if (sub?.id) {
          await fetch(`https://${mailrelayHost}/api/v1/subscribers/${sub.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'X-AUTH-TOKEN': mailrelayApiKey },
            body: JSON.stringify({ email: newEmail }),
          });
        }
      }
    } catch (e) {
      console.error('[CONFIRM-EMAIL-CHANGE] Mailrelay sync warn:', e);
    }

    // 6) Mark request as confirmed
    await supabase.from('email_change_requests')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', request.id);

    // 7) Notify both addresses
    const { data: profile2 } = await supabase.from('profiles').select('full_name').eq('id', request.user_id).maybeSingle();
    const fullName = profile2?.full_name || '';

    const successHtml = (toAddr: string) => `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:Arial,sans-serif;color:#333;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:40px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td align="center" style="background:#C75A92;padding:20px;"><img src="${PORTAL_URL}/assets/logo-horizontal-DLnM2X_1.png" width="200" alt="MeC"></td></tr>
<tr><td style="padding:40px 30px;">
<h2 style="color:#C75A92;">Email atualizado com sucesso</h2>
<p>Olá${fullName ? `, ${fullName}` : ''}!</p>
<p>O email da sua conta no portal Mulheres em Convergência foi atualizado de <strong>${oldEmail}</strong> para <strong>${newEmail}</strong>.</p>
<p>A partir de agora, use o novo endereço para acessar o portal e receber comunicações.</p>
<p style="color:#d32f2f;font-size:13px;">Se você não reconhece esta alteração, entre em contato imediatamente com nossa equipe.</p>
</td></tr></table></td></tr></table></body></html>`;

    for (const addr of [oldEmail, newEmail]) {
      fetch(`https://${mailrelayHost}/api/v1/send_emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-AUTH-TOKEN': mailrelayApiKey },
        body: JSON.stringify({
          from: { email: adminEmailFrom, name: 'Mulheres em Convergência' },
          to: [{ email: addr, name: fullName || addr }],
          subject: 'Email da sua conta foi atualizado',
          html_part: successHtml(addr),
        }),
      }).catch(e => console.error('[CONFIRM-EMAIL-CHANGE] Notify error:', e));
    }

    return new Response(JSON.stringify({
      success: true,
      new_email: newEmail,
      message: 'Email atualizado com sucesso. Faça login novamente com o novo endereço.',
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[CONFIRM-EMAIL-CHANGE] Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Erro interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});