import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EVENT-EMAIL-SCHEDULER] ${step}${detailsStr}`);
};

const BRAND_COLOR = '#7c3aed';
const GOLD_COLOR = '#d4a843';
const LOGO_URL = 'https://storage.mulheresemconvergencia.com.br/branding/logo-mec-horizontal.png';

const formatDateBrazil = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const formatTimeBrazil = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatWeekday = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
  }).format(date);
};

function eventEmailTemplate(title: string, body: string): string {
  return `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f7fc;">
    <div style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #9333ea 50%, ${GOLD_COLOR} 100%); padding: 28px 30px; text-align: center;">
      <img src="${LOGO_URL}" alt="Mulheres em Convergência" style="max-height: 44px; margin-bottom: 10px;" />
      <h1 style="color: #ffffff; font-size: 18px; margin: 0; font-weight: 600; letter-spacing: 0.5px;">EVENTOS MeC</h1>
    </div>
    <div style="background-color: #ffffff; padding: 36px 30px;">
      <h2 style="color: ${BRAND_COLOR}; margin-top: 0; font-size: 24px; line-height: 1.3;">${title}</h2>
      ${body}
    </div>
    <div style="text-align: center; padding: 20px 30px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">Mulheres em Convergência &bull; Comunidade de Networking</p>
      <p style="margin: 4px 0 0;">Este é um lembrete automático do evento para o qual você se inscreveu.</p>
    </div>
  </div>`;
}

function buildReminderHtml(
  type: '3d' | '1d' | '2h',
  participantName: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  eventWeekday: string,
  location: string | null,
  locationUrl: string | null,
  format: string | null,
) {
  const emoji = type === '3d' ? '📅' : type === '1d' ? '⏰' : '🚀';
  const titleMap = {
    '3d': 'Faltam 3 dias!',
    '1d': 'É amanhã!',
    '2h': 'Começando em 2 horas!',
  };
  const messageMap = {
    '3d': `Reserve este momento na sua agenda! Em <strong>3 dias</strong>, ${eventWeekday}, acontece o evento que você se inscreveu. Prepare-se para uma experiência incrível de conexão e aprendizado.`,
    '1d': `O evento é <strong>amanhã</strong>! Não esqueça de se preparar. Será um momento especial de networking e crescimento.`,
    '2h': `O evento começa em <strong>2 horas</strong>! Prepare-se para uma experiência incrível de conexão e aprendizado.`,
  };

  const eventInfoBlock = `
    <div style="background: linear-gradient(135deg, #f3f0ff 0%, #fef3c7 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid ${BRAND_COLOR};">
      <h3 style="margin-top: 0; color: ${BRAND_COLOR}; font-size: 18px;">📋 Detalhes do Evento</h3>
      <p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>🎯 Evento:</strong> ${eventTitle}</p>
      <p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>📅 Data:</strong> ${eventDate} (${eventWeekday})</p>
      <p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>🕐 Horário:</strong> ${eventTime}</p>
      ${format ? `<p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>📡 Formato:</strong> ${format === 'online' ? 'Online' : format === 'presencial' ? 'Presencial' : 'Híbrido'}</p>` : ''}
      ${location ? `<p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>📍 Local:</strong> ${location}</p>` : ''}
    </div>
  `;

  const ctaButton = locationUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${locationUrl}" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #6d28d9 100%); color: white; padding: 16px 36px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);">
        ${type === '2h' ? '🚀 Acessar Agora' : '📌 Ver Detalhes'}
      </a>
    </div>
  ` : '';

  return eventEmailTemplate(`${emoji} ${titleMap[type]}`, `
    <p style="font-size: 17px; color: #374151;">Olá <strong>${participantName}</strong>,</p>
    <p style="font-size: 16px; color: #4b5563; line-height: 1.7;">${messageMap[type]}</p>
    ${eventInfoBlock}
    ${ctaButton}
    <p style="font-size: 16px; color: #4b5563; text-align: center; margin-top: 24px;">
      Nos vemos lá! 💜
    </p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        Com carinho,<br>
        <strong style="color: ${BRAND_COLOR};">Equipe Mulheres em Convergência</strong>
      </p>
    </div>
  `);
}

async function sendDirectReminder(
  supabaseClient: any,
  mailrelayApiKey: string,
  mailrelayHost: string,
  adminEmailFrom: string,
  reminderType: '3d' | '1d' | '2h',
  daysAhead: number,
) {
  const now = new Date();
  let rangeStart: Date, rangeEnd: Date;

  if (reminderType === '2h') {
    rangeStart = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    rangeEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  } else {
    const target = new Date(now);
    target.setDate(target.getDate() + daysAhead);
    rangeStart = new Date(target);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd = new Date(target);
    rangeEnd.setHours(23, 59, 59, 999);
  }

  const sentAtColumn = `reminder_${reminderType}_sent_at`;

  logStep(`Checking events for ${reminderType} reminder`, {
    start: rangeStart.toISOString(),
    end: rangeEnd.toISOString(),
  });

  const { data: events, error: eventsError } = await supabaseClient
    .from('events')
    .select('id, title, date_start, location, location_url, format')
    .eq('status', 'published')
    .gte('date_start', rangeStart.toISOString())
    .lte('date_start', rangeEnd.toISOString());

  if (eventsError) throw eventsError;
  logStep(`Found events for ${reminderType} reminder`, { count: events?.length || 0 });

  let totalEmailsSent = 0;

  for (const event of events || []) {
    let query = supabaseClient
      .from('event_registrations')
      .select('*')
      .eq('event_id', event.id)
      .is(sentAtColumn, null)
      .in('status', ['confirmed', 'pending']);

    // For 2h reminder, only send to confirmed participants
    if (reminderType === '2h') {
      query = query.not('presence_confirmed_at', 'is', null);
    }

    const { data: registrations } = await query;

    const eventDateFormatted = formatDateBrazil(event.date_start);
    const eventTimeFormatted = formatTimeBrazil(event.date_start);
    const eventWeekday = formatWeekday(event.date_start);

    for (const reg of registrations || []) {
      try {
        const emailHtml = buildReminderHtml(
          reminderType,
          reg.full_name,
          event.title,
          eventDateFormatted,
          eventTimeFormatted,
          eventWeekday,
          event.location,
          event.location_url,
          event.format,
        );

        const subjectMap = {
          '3d': `📅 Em 3 dias: ${event.title}`,
          '1d': `⏰ É amanhã: ${event.title}`,
          '2h': `🚀 Em 2 horas: ${event.title}`,
        };

        await fetch(`https://${mailrelayHost}/api/v1/send_emails`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-AUTH-TOKEN': mailrelayApiKey,
          },
          body: JSON.stringify({
            from: { email: adminEmailFrom, name: "Mulheres em Convergência" },
            to: [{ email: reg.email, name: reg.full_name }],
            subject: subjectMap[reminderType],
            html_part: emailHtml,
          }),
        });

        // Mark as sent
        await supabaseClient
          .from('event_registrations')
          .update({ [sentAtColumn]: new Date().toISOString() })
          .eq('id', reg.id);

        // Register CRM interaction
        try {
          await supabaseClient
            .from('crm_interactions')
            .insert({
              lead_id: reg.lead_id,
              user_id: reg.user_id,
              cpf: reg.cpf,
              interaction_type: `email_reminder_${reminderType}`,
              channel: 'email',
              description: `Lembrete de ${reminderType === '3d' ? '3 dias' : reminderType === '1d' ? '1 dia' : '2 horas'} enviado para: ${event.title}`,
              activity_name: event.title,
              metadata: {
                registration_id: reg.id,
                event_id: event.id,
                reminder_type: reminderType,
              },
            });
        } catch (crmErr) {
          logStep("CRM interaction failed", { error: String(crmErr) });
        }

        totalEmailsSent++;
        logStep(`${reminderType} reminder sent`, { email: reg.email, eventId: event.id });
      } catch (emailError) {
        logStep(`${reminderType} reminder failed`, { email: reg.email, error: String(emailError) });
      }
    }
  }

  return totalEmailsSent;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const mailrelayApiKey = Deno.env.get('MAILRELAY_API_KEY')!;
    const mailrelayHost = Deno.env.get('MAILRELAY_HOST')!;
    const adminEmailFrom = Deno.env.get('ADMIN_EMAIL_FROM') || 'contato@mulheresemconvergencia.com.br';

    let action = 'reminder_tomorrow';
    try {
      const body = await req.json();
      action = body.action || 'reminder_tomorrow';
    } catch {
      // Default
    }

    logStep("Starting email scheduler", { action });

    if (action === 'reminder_3d') {
      const totalEmailsSent = await sendDirectReminder(supabaseClient, mailrelayApiKey, mailrelayHost, adminEmailFrom, '3d', 3);
      logStep("3d reminder scheduler completed", { totalEmailsSent });
      return new Response(
        JSON.stringify({ success: true, action: 'reminder_3d', emails_sent: totalEmailsSent }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === 'reminder_2h') {
      const totalEmailsSent = await sendDirectReminder(supabaseClient, mailrelayApiKey, mailrelayHost, adminEmailFrom, '2h', 0);
      logStep("2h reminder scheduler completed", { totalEmailsSent });
      return new Response(
        JSON.stringify({ success: true, action: 'reminder_2h', emails_sent: totalEmailsSent }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default: Tomorrow reminder (1d)
    const totalEmailsSent = await sendDirectReminder(supabaseClient, mailrelayApiKey, mailrelayHost, adminEmailFrom, '1d', 1);
    logStep("1d reminder scheduler completed", { totalEmailsSent });

    return new Response(
      JSON.stringify({ success: true, action: 'reminder_tomorrow', emails_sent: totalEmailsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
