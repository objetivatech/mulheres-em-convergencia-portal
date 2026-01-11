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

    const mailrelayApiKey = Deno.env.get('MAILRELAY_API_KEY');
    const mailrelayHost = Deno.env.get('MAILRELAY_HOST');
    const adminEmailFrom = Deno.env.get('ADMIN_EMAIL_FROM') || 'contato@mulheresemconvergencia.com.br';

    // Check request body for action type
    let action = 'reminder_tomorrow';
    try {
      const body = await req.json();
      action = body.action || 'reminder_tomorrow';
    } catch {
      // Default to reminder_tomorrow if no body
    }

    logStep("Starting email scheduler", { action });

    if (action === 'reminder_2h') {
      // Send 2-hour reminder to CONFIRMED participants only
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

      logStep("Checking events for 2h reminder", {
        start: twoHoursFromNow.toISOString(),
        end: threeHoursFromNow.toISOString(),
      });

      // Find events starting in 2-3 hours
      const { data: events, error: eventsError } = await supabaseClient
        .from('events')
        .select('id, title, date_start, location, location_url, format')
        .eq('status', 'published')
        .gte('date_start', twoHoursFromNow.toISOString())
        .lte('date_start', threeHoursFromNow.toISOString());

      if (eventsError) throw eventsError;

      logStep("Found events for 2h reminder", { count: events?.length || 0 });

      let totalEmailsSent = 0;

      for (const event of events || []) {
        // Get CONFIRMED registrations (presence_confirmed_at is set) that haven't received 2h reminder
        const { data: registrations } = await supabaseClient
          .from('event_registrations')
          .select('*')
          .eq('event_id', event.id)
          .not('presence_confirmed_at', 'is', null)
          .is('reminder_2h_sent_at', null)
          .in('status', ['confirmed', 'pending']);

        const eventDateFormatted = formatDateBrazil(event.date_start);
        const eventTimeFormatted = formatTimeBrazil(event.date_start);

        for (const reg of registrations || []) {
          try {
            const emailHtml = `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">
                <div style="background-color: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.15);">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="font-size: 64px; margin-bottom: 10px;">⏰</div>
                    <h1 style="color: #b45309; margin: 0; font-size: 28px;">Começando em 2 horas!</h1>
                  </div>
                  
                  <p style="font-size: 18px; color: #374151;">Olá <strong>${reg.full_name}</strong>,</p>
                  
                  <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                    O evento <strong style="color: #7c3aed;">${event.title}</strong> começa em <strong>2 horas</strong>! 
                    Prepare-se para uma experiência incrível de conexão e aprendizado.
                  </p>
                  
                  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #b45309;">
                    <h3 style="margin-top: 0; color: #92400e; font-size: 18px;">📋 Informações Rápidas</h3>
                    <p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>📅 Hoje:</strong> ${eventDateFormatted}</p>
                    <p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>🕐 Horário:</strong> ${eventTimeFormatted}</p>
                    ${event.location ? `<p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>📍 Local:</strong> ${event.location}</p>` : ''}
                  </div>

                  ${event.location_url ? `
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${event.location_url}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 18px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);">
                        🚀 Acessar Agora
                      </a>
                    </div>
                  ` : ''}
                  
                  <p style="font-size: 16px; color: #4b5563; text-align: center; margin-top: 20px;">
                    Nos vemos em breve! 💜
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
                'X-AUTH-TOKEN': mailrelayApiKey!,
              },
              body: JSON.stringify({
                from: { email: adminEmailFrom, name: "Mulheres em Convergência" },
                to: [{ email: reg.email, name: reg.full_name }],
                subject: `⏰ Em 2 horas: ${event.title}`,
                html_part: emailHtml,
              }),
            });

            // Mark as sent
            await supabaseClient
              .from('event_registrations')
              .update({ reminder_2h_sent_at: new Date().toISOString() })
              .eq('id', reg.id);

            totalEmailsSent++;
            logStep("2h reminder sent", { email: reg.email, eventId: event.id });

          } catch (emailError) {
            logStep("2h reminder failed", { email: reg.email, error: String(emailError) });
          }
        }
      }

      logStep("2h reminder scheduler completed", { totalEmailsSent });

      return new Response(
        JSON.stringify({ success: true, action: 'reminder_2h', emails_sent: totalEmailsSent }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default: Tomorrow reminder (existing logic)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    logStep("Checking events for tomorrow", {
      start: tomorrowStart.toISOString(),
      end: tomorrowEnd.toISOString(),
    });

    // Find events happening tomorrow
    const { data: events, error: eventsError } = await supabaseClient
      .from('events')
      .select('id, title, date_start')
      .gte('date_start', tomorrowStart.toISOString())
      .lte('date_start', tomorrowEnd.toISOString())
      .eq('status', 'published');

    if (eventsError) {
      throw new Error(`Error fetching events: ${eventsError.message}`);
    }

    logStep("Found events for tomorrow", { count: events?.length || 0 });

    let totalEmailsSent = 0;
    const results: unknown[] = [];

    // Send reminder emails for each event
    for (const event of events || []) {
      logStep("Processing event", { id: event.id, title: event.title });

      try {
        // Call send-event-email function with reminder action
        const { data, error } = await supabaseClient.functions.invoke('send-event-email', {
          body: {
            action: 'reminder',
            event_id: event.id,
          },
        });

        if (error) {
          logStep("Error sending reminders for event", { eventId: event.id, error: error.message });
          results.push({ eventId: event.id, success: false, error: error.message });
        } else {
          const emailsSent = data?.emails_sent || 0;
          totalEmailsSent += emailsSent;
          results.push({ eventId: event.id, success: true, emailsSent });
          logStep("Reminders sent for event", { eventId: event.id, emailsSent });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logStep("Exception sending reminders", { eventId: event.id, error: errorMessage });
        results.push({ eventId: event.id, success: false, error: errorMessage });
      }
    }

    logStep("Scheduler completed", { totalEmailsSent, eventsProcessed: events?.length || 0 });

    return new Response(
      JSON.stringify({
        success: true,
        total_emails_sent: totalEmailsSent,
        events_processed: events?.length || 0,
        results,
      }),
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
