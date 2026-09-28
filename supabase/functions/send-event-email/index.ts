import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { enviarEmail } from "../_shared/enviar-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-EVENT-EMAIL] ${step}${detailsStr}`);
};


// Helper for Brazil timezone formatting
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

interface EventEmailRequest {
  action: 'confirmation' | 'reminder' | 'certificate';
  registration_id?: string;
  event_id?: string;
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

    const { action, registration_id, event_id }: EventEmailRequest = await req.json();
    logStep("Processing email request", { action, registration_id, event_id });

    if (action === 'confirmation' && registration_id) {
      // Send confirmation email for a specific registration
      const { data: registration, error } = await supabaseClient
        .from('event_registrations')
        .select('*, event:events(*)')
        .eq('id', registration_id)
        .single();

      if (error || !registration) {
        throw new Error('Registration not found');
      }

      const event = registration.event as Record<string, unknown>;
      const eventDateFormatted = formatDateBrazil(event.date_start as string);
      const eventTimeFormatted = formatTimeBrazil(event.date_start as string);
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #7c3aed; margin-bottom: 20px;">Inscrição Confirmada! 🎉</h1>
            
            <p>Olá <strong>${registration.full_name}</strong>,</p>
            
            <p>Sua inscrição no evento <strong>${event.title}</strong> foi confirmada com sucesso!</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Detalhes do Evento</h3>
              <p><strong>📅 Data:</strong> ${eventDateFormatted} às ${eventTimeFormatted}</p>
              ${event.location ? `<p><strong>📍 Local:</strong> ${event.location}</p>` : ''}
              ${event.location_url ? `<p><strong>🔗 Link:</strong> <a href="${event.location_url}">${event.location_url}</a></p>` : ''}
            </div>
            
            <p>Guarde este email para referência. Qualquer dúvida, entre em contato conosco.</p>
            
            <p>Até breve!</p>
            <p><strong>Equipe Mulheres em Convergência</strong></p>
          </div>
        </div>
      `;

      await sendEmail(registration.email, `Inscrição Confirmada: ${event.title}`, emailHtml);
      logStep("Confirmation email sent", { email: registration.email });

    } else if (action === 'reminder' && event_id) {
      // Send reminder emails for all confirmed registrations of an event
      const { data: event } = await supabaseClient
        .from('events')
        .select('*')
        .eq('id', event_id)
        .single();

      if (!event) throw new Error('Event not found');

      const { data: registrations } = await supabaseClient
        .from('event_registrations')
        .select('*')
        .eq('event_id', event_id)
        .in('status', ['confirmed', 'pending']);

      const eventDateFormatted = formatDateBrazil(event.date_start);
      const eventTimeFormatted = formatTimeBrazil(event.date_start);
      let sentCount = 0;

      for (const reg of registrations || []) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px;">
              <h1 style="color: #7c3aed;">Lembrete: ${event.title} é amanhã! ⏰</h1>
              
              <p>Olá <strong>${reg.full_name}</strong>,</p>
              
              <p>Estamos ansiosos para te ver! O evento <strong>${event.title}</strong> acontece amanhã.</p>
              
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p><strong>📅 Amanhã, ${eventDateFormatted}</strong></p>
                <p><strong>🕐 ${eventTimeFormatted}</strong></p>
                ${event.location ? `<p><strong>📍 ${event.location}</strong></p>` : ''}
              </div>
              
              ${event.location_url ? `<p><a href="${event.location_url}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Acessar Evento</a></p>` : ''}
              
              <p>Não perca!</p>
              <p><strong>Equipe Mulheres em Convergência</strong></p>
            </div>
          </div>
        `;

        await sendEmail(reg.email, `Lembrete: ${event.title} é amanhã!`, emailHtml);
        sentCount++;
      }

      logStep("Reminder emails sent", { count: sentCount, eventId: event_id });
      
      return new Response(JSON.stringify({ success: true, emails_sent: sentCount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === 'certificate' && registration_id) {
      // Send certificate/participation confirmation
      const { data: registration } = await supabaseClient
        .from('event_registrations')
        .select('*, event:events(*)')
        .eq('id', registration_id)
        .eq('status', 'attended')
        .single();

      if (!registration) throw new Error('Attended registration not found');

      const event = registration.event as Record<string, unknown>;
      const eventDateFormatted = formatDateBrazil(event.date_start as string);
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 20px;">🏆</div>
            <h1 style="color: #7c3aed;">Certificado de Participação</h1>
            
            <p style="font-size: 18px;">Certificamos que</p>
            <h2 style="color: #374151; margin: 10px 0;">${registration.full_name}</h2>
            <p style="font-size: 18px;">participou do evento</p>
            <h3 style="color: #7c3aed;">${event.title}</h3>
            <p>realizado em ${eventDateFormatted}</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                Este certificado atesta a participação no evento promovido por<br>
                <strong>Mulheres em Convergência</strong>
              </p>
            </div>
          </div>
        </div>
      `;

      await sendEmail(registration.email, `Certificado: ${event.title}`, emailHtml);
      logStep("Certificate email sent", { email: registration.email });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function sendEmail(to: string, subject: string, htmlContent: string) {
  await enviarEmail({ email: to, nome: to }, subject, htmlContent);
  return { ok: true };
}
