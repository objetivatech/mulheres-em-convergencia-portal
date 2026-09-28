import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EVENT-CONFIRMATION-SCHEDULER] ${step}${detailsStr}`);
};

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

const generateToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting confirmation email scheduler");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const productionDomain = Deno.env.get('PRODUCTION_DOMAIN') || 'https://mulheresemconvergencia.com.br';

    const now = new Date();
    const results = {
      email1_sent: 0,
      email2_sent: 0,
      email3_sent: 0,
      errors: 0,
    };

    // Get all published events with upcoming dates
    const { data: events, error: eventsError } = await supabaseClient
      .from('events')
      .select('id, title, date_start, location, location_url, format')
      .eq('status', 'published')
      .gte('date_start', now.toISOString());

    if (eventsError) throw eventsError;

    logStep("Found upcoming events", { count: events?.length || 0 });

    for (const event of events || []) {
      const eventDate = new Date(event.date_start);
      const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      logStep("Processing event", { eventId: event.id, title: event.title, daysUntilEvent });

      // Determine which email to send based on days until event
      let emailNumber: 1 | 2 | 3 | null = null;
      let sentAtField: string | null = null;

      if (daysUntilEvent === 5) {
        emailNumber = 1;
        sentAtField = 'confirmation_email_1_sent_at';
      } else if (daysUntilEvent === 3) {
        emailNumber = 2;
        sentAtField = 'confirmation_email_2_sent_at';
      } else if (daysUntilEvent === 1) {
        emailNumber = 3;
        sentAtField = 'confirmation_email_3_sent_at';
      }

      if (!emailNumber || !sentAtField) {
        continue; // Skip if not a trigger day
      }

      // Get unconfirmed registrations that haven't received this email yet
      let query = supabaseClient
        .from('event_registrations')
        .select('*')
        .eq('event_id', event.id)
        .is('presence_confirmed_at', null)
        .in('status', ['confirmed', 'pending']);

      // Filter based on email number
      if (emailNumber === 1) {
        query = query.is('confirmation_email_1_sent_at', null);
      } else if (emailNumber === 2) {
        query = query.not('confirmation_email_1_sent_at', 'is', null)
          .is('confirmation_email_2_sent_at', null);
      } else if (emailNumber === 3) {
        query = query.not('confirmation_email_2_sent_at', 'is', null)
          .is('confirmation_email_3_sent_at', null);
      }

      const { data: registrations, error: regError } = await query;

      if (regError) {
        logStep("Error fetching registrations", { error: regError.message });
        continue;
      }

      logStep("Registrations to notify", { count: registrations?.length || 0, emailNumber });

      for (const reg of registrations || []) {
        try {
          // Generate token if not exists
          let token = reg.confirmation_token;
          if (!token) {
            token = generateToken();
            await supabaseClient
              .from('event_registrations')
              .update({ confirmation_token: token })
              .eq('id', reg.id);
          }

          const confirmUrl = `${productionDomain}/confirmar-presenca?token=${token}`;
          const eventDateFormatted = formatDateBrazil(event.date_start);
          const eventTimeFormatted = formatTimeBrazil(event.date_start);

          let subject: string;
          let heading: string;
          let bodyText: string;
          let urgencyColor: string;

          if (emailNumber === 1) {
            subject = `Confirme sua presença: ${event.title}`;
            heading = `Faltam apenas 5 dias! 📅`;
            bodyText = `Estamos ansiosas para te ver no <strong>${event.title}</strong>! Por favor, confirme sua presença clicando no botão abaixo para garantir sua vaga.`;
            urgencyColor = '#7c3aed';
          } else if (emailNumber === 2) {
            subject = `Aguardamos sua confirmação: ${event.title}`;
            heading = `Faltam 3 dias! ⏰`;
            bodyText = `Ainda não recebemos sua confirmação para o <strong>${event.title}</strong>. Queremos muito contar com você! Confirme sua presença para que possamos preparar tudo para te receber.`;
            urgencyColor = '#f59e0b';
          } else {
            subject = `Última chamada: ${event.title} é amanhã!`;
            heading = `É amanhã! 🚨`;
            bodyText = `O evento <strong>${event.title}</strong> acontece <strong>amanhã</strong>! Esta é sua última chance de confirmar presença. Não perca esta oportunidade incrível!`;
            urgencyColor = '#ef4444';
          }

          const emailHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
              <div style="background-color: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: ${urgencyColor}; margin: 0; font-size: 28px;">${heading}</h1>
                </div>
                
                <p style="font-size: 16px; color: #374151;">Olá <strong>${reg.full_name}</strong>,</p>
                
                <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                  ${bodyText}
                </p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 12px; margin: 24px 0;">
                  <h3 style="margin-top: 0; color: #374151;">📋 Detalhes do Evento</h3>
                  <p style="margin: 8px 0;"><strong>📅 Data:</strong> ${eventDateFormatted}</p>
                  <p style="margin: 8px 0;"><strong>🕐 Horário:</strong> ${eventTimeFormatted}</p>
                  ${event.location ? `<p style="margin: 8px 0;"><strong>📍 Local:</strong> ${event.location}</p>` : ''}
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%); color: white; padding: 16px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px ${urgencyColor}66;">
                    ✅ Confirmar Minha Presença
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; text-align: center;">
                  Ao confirmar, você receberá um email de boas-vindas e um lembrete 2 horas antes do evento.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    Com carinho,<br>
                    <strong style="color: #7c3aed;">Equipe Mulheres em Convergência</strong>
                  </p>
                </div>
              </div>
            </div>
          `;

          await fetch(`https://${mailrelayHost}/api/v1/send_emails`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-AUTH-TOKEN': mailrelayApiKey,
            },
            body: JSON.stringify({
              from: { email: adminEmailFrom, name: "Mulheres em Convergência" },
              to: [{ email: reg.email, name: reg.full_name }],
              subject,
              html_part: emailHtml,
            }),
          });

          // Update sent timestamp
          await supabaseClient
            .from('event_registrations')
            .update({ [sentAtField]: new Date().toISOString() })
            .eq('id', reg.id);

          // Register CRM interaction for confirmation email sent
          try {
            await supabaseClient
              .from('crm_interactions')
              .insert({
                lead_id: reg.lead_id,
                user_id: reg.user_id,
                cpf: reg.cpf,
                interaction_type: 'email_confirmation_request',
                channel: 'email',
                description: `Email de confirmação #${emailNumber} enviado para: ${event.title}`,
                activity_name: event.title,
                cost_center_id: event.cost_center_id,
                metadata: {
                  registration_id: reg.id,
                  event_id: event.id,
                  email_number: emailNumber,
                  days_until_event: daysUntilEvent,
                },
              });
          } catch (crmErr) {
            logStep("CRM interaction failed", { error: String(crmErr) });
          }

          if (emailNumber === 1) results.email1_sent++;
          else if (emailNumber === 2) results.email2_sent++;
          else results.email3_sent++;

          logStep("Confirmation email sent", { email: reg.email, emailNumber });

        } catch (emailError) {
          results.errors++;
          logStep("Email failed", { email: reg.email, error: String(emailError) });
        }
      }
    }

    logStep("Scheduler completed", results);

    return new Response(
      JSON.stringify({ success: true, ...results }),
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
