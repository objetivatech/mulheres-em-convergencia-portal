import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONFIRM-EVENT-PRESENCE] ${step}${detailsStr}`);
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
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      throw new Error("Token de confirmação não fornecido");
    }

    logStep("Processing confirmation", { token: token.substring(0, 8) + '...' });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find registration by token
    const { data: registration, error: regError } = await supabaseClient
      .from('event_registrations')
      .select('*, event:events(*)')
      .eq('confirmation_token', token)
      .maybeSingle();

    if (regError || !registration) {
      logStep("Token not found", { token: token.substring(0, 8) + '...' });
      throw new Error("Token inválido ou expirado");
    }

    if (registration.presence_confirmed_at) {
      logStep("Already confirmed", { registrationId: registration.id });
      return new Response(
        JSON.stringify({
          success: true,
          already_confirmed: true,
          message: "Presença já confirmada anteriormente",
          event_title: registration.event?.title,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const event = registration.event as any;

    // Update registration with confirmation
    await supabaseClient
      .from('event_registrations')
      .update({
        presence_confirmed_at: new Date().toISOString(),
        status: 'confirmed',
      })
      .eq('id', registration.id);

    logStep("Presence confirmed", { registrationId: registration.id });

    // Update deal stage to "confirmado"
    try {
      const { data: deals } = await supabaseClient
        .from('crm_deals')
        .select('id')
        .eq('product_type', 'evento')
        .contains('metadata', { registration_id: registration.id });

      if (deals && deals.length > 0) {
        await supabaseClient
          .from('crm_deals')
          .update({ stage: 'confirmado' })
          .eq('id', deals[0].id);
        logStep("Deal updated to confirmado");
      }
    } catch (crmError) {
      logStep("CRM update failed (non-blocking)", { error: String(crmError) });
    }

    // Send welcome email
    const mailrelayApiKey = Deno.env.get('MAILRELAY_API_KEY');
    const mailrelayHost = Deno.env.get('MAILRELAY_HOST');
    const adminEmailFrom = Deno.env.get('ADMIN_EMAIL_FROM') || 'contato@mulheresemconvergencia.com.br';

    if (mailrelayApiKey && mailrelayHost && event) {
      const eventDateFormatted = formatDateBrazil(event.date_start);
      const eventTimeFormatted = formatTimeBrazil(event.date_start);

      const welcomeEmailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div style="background-color: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="font-size: 64px; margin-bottom: 10px;">🎉</div>
              <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">Presença Confirmada!</h1>
            </div>
            
            <p style="font-size: 18px; color: #374151;">Olá <strong>${registration.full_name}</strong>,</p>
            
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              Que alegria saber que você confirmou presença no <strong style="color: #7c3aed;">${event.title}</strong>! 
              Estamos preparando tudo com muito carinho para te receber.
            </p>

            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              Este encontro será uma oportunidade única de <strong>conexão, aprendizado e empoderamento</strong>. 
              Você faz parte de uma rede incrível de mulheres que transformam realidades!
            </p>
            
            <div style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #7c3aed;">
              <h3 style="margin-top: 0; color: #5b21b6; font-size: 18px;">📅 Guarde a Data!</h3>
              <p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>Data:</strong> ${eventDateFormatted}</p>
              <p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>Horário:</strong> ${eventTimeFormatted}</p>
              ${event.location ? `<p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>Local:</strong> ${event.location}</p>` : ''}
            </div>

            ${event.location_url ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${event.location_url}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 16px 32px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);">
                  🔗 Acessar Link do Evento
                </a>
              </div>
            ` : ''}
            
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              Enviaremos um lembrete 2 horas antes do início. Fique de olho no seu email!
            </p>

            <p style="font-size: 16px; color: #4b5563; margin-top: 30px;">
              Mal podemos esperar para te ver! 💜
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

      try {
        await fetch(`https://${mailrelayHost}/api/v1/send_emails`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-AUTH-TOKEN': mailrelayApiKey,
          },
          body: JSON.stringify({
            from: { email: adminEmailFrom, name: "Mulheres em Convergência" },
            to: [{ email: registration.email, name: registration.full_name }],
            subject: `🎉 Presença Confirmada: ${event.title}`,
            html_part: welcomeEmailHtml,
          }),
        });

        // Mark welcome email as sent
        await supabaseClient
          .from('event_registrations')
          .update({ welcome_email_sent_at: new Date().toISOString() })
          .eq('id', registration.id);

        logStep("Welcome email sent", { email: registration.email });
      } catch (emailError) {
        logStep("Welcome email failed", { error: String(emailError) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Presença confirmada com sucesso!",
        event_title: event?.title,
        event_date: event?.date_start,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
