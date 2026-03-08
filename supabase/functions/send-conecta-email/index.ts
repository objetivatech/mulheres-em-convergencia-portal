import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  console.log(`[SEND-CONECTA-EMAIL] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

const mailrelayApiKey = Deno.env.get('MAILRELAY_API_KEY')!;
const mailrelayHost = Deno.env.get('MAILRELAY_HOST')!;
const emailFrom = Deno.env.get('ADMIN_EMAIL_FROM') || 'contato@mulheresemconvergencia.com.br';

const BRAND_COLOR = '#7c3aed';
const LOGO_URL = 'https://storage.mulheresemconvergencia.com.br/branding/logo-mec-horizontal.png';

function emailWrapper(title: string, body: string): string {
  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f1fe;">
    <div style="background: linear-gradient(135deg, ${BRAND_COLOR}, #9333ea); padding: 24px 30px; text-align: center;">
      <img src="${LOGO_URL}" alt="Mulheres em Convergência" style="max-height: 48px; margin-bottom: 8px;" />
      <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 600;">CONECTA+</h1>
    </div>
    <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 12px 12px;">
      <h2 style="color: ${BRAND_COLOR}; margin-top: 0; font-size: 22px;">${title}</h2>
      ${body}
    </div>
    <div style="text-align: center; padding: 20px 30px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">Mulheres em Convergência &bull; CONECTA+</p>
      <p style="margin: 4px 0 0;">Você recebeu este e-mail porque faz parte da comunidade MeC.</p>
    </div>
  </div>`;
}

async function sendEmail(to: string, toName: string, subject: string, htmlContent: string) {
  log('Sending email', { to, subject });
  const response = await fetch(`https://${mailrelayHost}/api/v1/send_emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-AUTH-TOKEN': mailrelayApiKey },
    body: JSON.stringify({
      from: { email: emailFrom, name: 'Mulheres em Convergência' },
      to: [{ email: to, name: toName }],
      subject,
      html_part: htmlContent,
    }),
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(`Mailrelay error: ${JSON.stringify(result)}`);
  }
  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const { action } = body;
    log('Processing', { action });

    if (action === 'invitation') {
      const { guest_name, guest_email, code, inviter_id } = body;
      const { data: inviter } = await supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', inviter_id)
        .single();

      const html = emailWrapper('Você foi convidada! 🎉', `
        <p>Olá <strong>${guest_name}</strong>,</p>
        <p><strong>${inviter?.full_name || 'Uma membro'}</strong> convidou você para conhecer o <strong>CONECTA+</strong>, nossa comunidade de networking do Mulheres em Convergência!</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Seu código de convite:</p>
          <p style="margin: 0; font-size: 28px; font-weight: bold; color: ${BRAND_COLOR}; letter-spacing: 2px;">${code}</p>
        </div>
        <p>Use este código ao se cadastrar no portal para ativar seu acesso como convidada.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://mulheresemconvergencia.lovable.app/auth" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Cadastre-se Agora</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Estamos ansiosas para te conhecer!</p>
      `);
      await sendEmail(guest_email, guest_name, `Convite CONECTA+ de ${inviter?.full_name || 'uma membro'}`, html);

    } else if (action === 'new_referral') {
      const { to_user_id, from_user_name, contact_name, temperature } = body;
      const { data: toUser } = await supabaseClient
        .from('profiles')
        .select('full_name, email')
        .eq('id', to_user_id)
        .single();
      if (!toUser?.email) throw new Error('Destinatário sem email');

      const tempLabel = temperature === 'hot' ? '🔥 Quente' : temperature === 'cold' ? '❄️ Frio' : '🌡️ Morno';
      const tempColor = temperature === 'hot' ? '#EF4444' : temperature === 'cold' ? '#3B82F6' : '#F59E0B';

      const html = emailWrapper('Nova Indicação Recebida! 🤝', `
        <p>Olá <strong>${toUser.full_name}</strong>,</p>
        <p><strong>${from_user_name}</strong> enviou uma indicação de lead para você no CONECTA+!</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Contato:</strong> ${contact_name}</p>
          <p style="margin: 0;"><strong>Temperatura:</strong> <span style="color: ${tempColor}; font-weight: bold;">${tempLabel}</span></p>
        </div>
        <p>Acesse o CONECTA+ para ver todos os detalhes da indicação.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://mulheresemconvergencia.lovable.app/conecta/indicacoes" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ver Indicação</a>
        </div>
      `);
      await sendEmail(toUser.email, toUser.full_name || '', `Nova indicação de ${from_user_name}`, html);

    } else if (action === 'new_testimonial') {
      const { to_user_id, from_user_name } = body;
      const { data: toUser } = await supabaseClient
        .from('profiles')
        .select('full_name, email')
        .eq('id', to_user_id)
        .single();
      if (!toUser?.email) throw new Error('Destinatário sem email');

      const html = emailWrapper('Novo Depoimento Recebido! ⭐', `
        <p>Olá <strong>${toUser.full_name}</strong>,</p>
        <p><strong>${from_user_name}</strong> escreveu um depoimento sobre você no CONECTA+!</p>
        <p>Depoimentos fortalecem sua reputação na comunidade e aumentam sua pontuação no ranking.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://mulheresemconvergencia.lovable.app/conecta/depoimentos" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ver Depoimento</a>
        </div>
      `);
      await sendEmail(toUser.email, toUser.full_name || '', `Novo depoimento de ${from_user_name}`, html);

    } else if (action === 'deal_from_referral') {
      const { referred_by_user_id, closed_by_name, deal_value } = body;
      const { data: referrer } = await supabaseClient
        .from('profiles')
        .select('full_name, email')
        .eq('id', referred_by_user_id)
        .single();
      if (!referrer?.email) throw new Error('Indicador sem email');

      const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal_value);
      const html = emailWrapper('Negócio Fechado! 💰', `
        <p>Olá <strong>${referrer.full_name}</strong>,</p>
        <p>Ótimas notícias! <strong>${closed_by_name}</strong> fechou um negócio a partir de uma indicação sua!</p>
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 1px solid #a7f3d0;">
          <p style="margin: 0 0 4px; color: #065f46; font-size: 14px;">Valor do Negócio</p>
          <p style="margin: 0; font-size: 28px; font-weight: bold; color: #059669;">${formattedValue}</p>
        </div>
        <p>Sua indicação fez a diferença! Continue networking no CONECTA+.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://mulheresemconvergencia.lovable.app/conecta/negocios" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ver Negócios</a>
        </div>
      `);
      await sendEmail(referrer.email, referrer.full_name || '', `Negócio fechado a partir da sua indicação!`, html);

    } else if (action === 'guest_registered') {
      const { inviter_id, guest_name } = body;
      const { data: inviter } = await supabaseClient
        .from('profiles')
        .select('full_name, email')
        .eq('id', inviter_id)
        .single();
      if (!inviter?.email) throw new Error('Convidador sem email');

      const html = emailWrapper('Convidada Cadastrada! 🎊', `
        <p>Olá <strong>${inviter.full_name}</strong>,</p>
        <p>Sua convidada <strong>${guest_name}</strong> se cadastrou no portal!</p>
        <p>Isso mostra o impacto da sua rede e contribui para a comunidade CONECTA+.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://mulheresemconvergencia.lovable.app/conecta/convites" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ver Meus Convites</a>
        </div>
      `);
      await sendEmail(inviter.email, inviter.full_name || '', `${guest_name} se cadastrou no portal!`, html);

    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log('ERROR', { message });
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
