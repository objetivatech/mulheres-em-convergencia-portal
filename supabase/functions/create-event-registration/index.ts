import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-EVENT-REGISTRATION] ${step}${detailsStr}`);
};

interface RegistrationRequest {
  event_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  cpf?: string | null;
  metadata?: Record<string, unknown>;
}

// Generate a temporary password for guest accounts
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  for (let i = 0; i < 12; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Registration request received");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body: RegistrationRequest = await req.json();
    const { event_id, full_name, email, phone, cpf, metadata } = body;

    if (!event_id || !full_name || !email) {
      throw new Error("event_id, full_name and email are required");
    }

    logStep("Processing registration", { event_id, email });

    // Fetch event details
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found");
    }

    if (event.status !== 'published') {
      throw new Error("Event is not available for registration");
    }

    // Check if event is full
    if (event.max_participants) {
      const currentParticipants = event.current_participants || 0;
      if (currentParticipants >= event.max_participants) {
        throw new Error("Event is full");
      }
    }

    const cleanCpf = cpf?.replace(/\D/g, '') || null;
    let userId: string | null = null;
    let isNewUser = false;
    let tempPassword: string | null = null;

    // === STEP 1: Check if user already exists ===
    logStep("Checking for existing user by email");
    
    const { data: existingUsers, error: listError } = await supabaseClient.auth.admin.listUsers();
    
    if (!listError && existingUsers?.users) {
      const existingUser = existingUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        userId = existingUser.id;
        logStep("Found existing user", { userId });
      }
    }

    // === STEP 2: Check guest access limit for existing users ===
    if (userId) {
      const { data: conectaProfile } = await supabaseClient
        .from('conecta_profiles')
        .select('conecta_role, first_event_attended_at')
        .eq('id', userId)
        .maybeSingle();

      // If user is a guest AND has already attended an event, block registration
      if (conectaProfile?.conecta_role === 'convidado' && conectaProfile?.first_event_attended_at) {
        logStep("Guest event limit reached", { userId, first_event_attended_at: conectaProfile.first_event_attended_at });
        return new Response(
          JSON.stringify({
            success: false,
            error: "GUEST_EVENT_LIMIT_REACHED",
            message: "Você já participou de um evento como convidada. Para participar de mais eventos, torne-se membro!",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          }
        );
      }
    }

    // Check if already registered (idempotent: return success)
    const { data: existingReg } = await supabaseClient
      .from('event_registrations')
      .select('id')
      .eq('event_id', event_id)
      .eq('email', email)
      .maybeSingle();

    if (existingReg) {
      logStep("Already registered", { registrationId: existingReg.id, email });
      return new Response(
        JSON.stringify({
          success: true,
          already_registered: true,
          registration_id: existingReg.id,
          message: "Email already registered for this event",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // === STEP 3: Create user account if not exists ===
    if (!userId) {
      logStep("Creating new user account");
      tempPassword = generateTempPassword();
      
      const { data: newUser, error: createUserError } = await supabaseClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: { 
          full_name, 
          phone: phone || null, 
          cpf: cleanCpf,
          source: 'event_registration',
        },
      });

      if (createUserError) {
        logStep("Failed to create user", { error: createUserError.message });
        // Don't block registration if user creation fails
      } else if (newUser?.user) {
        userId = newUser.user.id;
        isNewUser = true;
        logStep("New user created", { userId });

        // Create profile
        const { error: profileError } = await supabaseClient.from('profiles').insert({
          id: userId,
          email,
          full_name,
          phone: phone || null,
          cpf: cleanCpf,
        });

        if (profileError) {
          logStep("Failed to create profile", { error: profileError.message });
        } else {
          logStep("Profile created");
        }

        // Create conecta_profile as guest
        const { error: conectaError } = await supabaseClient.from('conecta_profiles').insert({
          id: userId,
          conecta_role: 'convidado',
          is_active: true,
        });

        if (conectaError) {
          logStep("Failed to create conecta_profile", { error: conectaError.message });
        } else {
          logStep("Conecta profile created as guest");
        }
      }
    }

    // Create registration
    const { data: registration, error: regError } = await supabaseClient
      .from('event_registrations')
      .insert({
        event_id,
        user_id: userId,
        full_name,
        email,
        phone: phone || null,
        cpf: cleanCpf,
        status: 'confirmed',
        paid: event.free ?? true,
        payment_amount: event.free ? 0 : event.price,
        cost_center_id: event.cost_center_id,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (regError) {
      logStep("Failed to create registration", regError);
      throw new Error("Failed to create registration");
    }

    logStep("Registration created", { registrationId: registration.id });

    // Update event participant count
    await supabaseClient
      .from('events')
      .update({ current_participants: (event.current_participants || 0) + 1 })
      .eq('id', event_id);

    // CRM Integration - Find or create lead
    let leadId: string | null = null;

    try {
      // Check by CPF first
      if (cleanCpf) {
        const { data: existingLeadByCpf } = await supabaseClient
          .from('crm_leads')
          .select('id')
          .eq('cpf', cleanCpf)
          .maybeSingle();

        if (existingLeadByCpf) {
          leadId = existingLeadByCpf.id;
          logStep("Lead found by CPF", { leadId });
        }
      }

      // Check by email if not found
      if (!leadId && email) {
        const { data: existingLeadByEmail } = await supabaseClient
          .from('crm_leads')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (existingLeadByEmail) {
          leadId = existingLeadByEmail.id;
          logStep("Lead found by email", { leadId });
        }
      }

      // Create new lead if not found
      if (!leadId) {
        const { data: newLead, error: leadError } = await supabaseClient
          .from('crm_leads')
          .insert({
            full_name,
            email,
            phone: phone || null,
            cpf: cleanCpf,
            source: 'evento',
            source_detail: event.title,
            status: 'new',
            first_activity_type: 'event_registration',
            first_activity_date: new Date().toISOString(),
            first_activity_paid: !event.free,
            first_activity_online: event.format === 'online',
            cost_center_id: event.cost_center_id,
          })
          .select('id')
          .single();

        if (!leadError && newLead) {
          leadId = newLead.id;
          logStep("New lead created", { leadId });
        }
      }

      // Update registration with lead_id
      if (leadId) {
        await supabaseClient
          .from('event_registrations')
          .update({ lead_id: leadId })
          .eq('id', registration.id);

        // Create interaction
        await supabaseClient
          .from('crm_interactions')
          .insert({
            lead_id: leadId,
            cpf: cleanCpf,
            interaction_type: 'event_registration',
            channel: 'website',
            activity_name: event.title,
            activity_paid: !event.free,
            activity_online: event.format === 'online',
            description: `Inscrição no evento: ${event.title}`,
            cost_center_id: event.cost_center_id,
            form_source: 'public_event_page',
            metadata: {
              event_id,
              registration_id: registration.id,
              is_free: event.free,
            },
          });
        logStep("Interaction created");

        // Create deal in eventos pipeline
        const { data: eventosPipeline } = await supabaseClient
          .from('crm_pipelines')
          .select('id, stages')
          .eq('pipeline_type', 'eventos')
          .eq('active', true)
          .maybeSingle();

        if (eventosPipeline) {
          const stages = eventosPipeline.stages as Array<{ id: string }>;
          const initialStage = event.free 
            ? (stages.find(s => s.id === 'inscrito') || stages[1])
            : (stages.find(s => s.id === 'interesse') || stages[0]);

          await supabaseClient
            .from('crm_deals')
            .insert({
              title: `${full_name} - ${event.title}`,
              value: event.price || 0,
              pipeline_id: eventosPipeline.id,
              stage: initialStage?.id || 'inscrito',
              lead_id: leadId,
              cpf: cleanCpf,
              product_type: 'evento',
              cost_center_id: event.cost_center_id,
              metadata: {
                event_id,
                registration_id: registration.id,
              },
            });
          logStep("Deal created");
        }
      }
    } catch (crmError) {
      logStep("CRM integration failed (non-blocking)", { error: String(crmError) });
    }

    // Generate confirmation token
    const tokenArray = new Uint8Array(32);
    crypto.getRandomValues(tokenArray);
    const confirmationToken = Array.from(tokenArray, b => b.toString(16).padStart(2, '0')).join('');

    await supabaseClient
      .from('event_registrations')
      .update({ confirmation_token: confirmationToken })
      .eq('id', registration.id);

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

    // Send confirmation email (non-blocking)
    try {
      const mailrelayApiKey = Deno.env.get('MAILRELAY_API_KEY');
      const mailrelayHost = Deno.env.get('MAILRELAY_HOST');
      const adminEmailFrom = Deno.env.get('ADMIN_EMAIL_FROM') || 'contato@mulheresemconvergencia.com.br';
      const portalUrl = Deno.env.get('PORTAL_URL') || 'https://mulheresemconvergencia.com.br';

      if (mailrelayApiKey && mailrelayHost) {
        const eventDateFormatted = formatDateBrazil(event.date_start);
        const eventTimeFormatted = formatTimeBrazil(event.date_start);

        // Different email for new users vs existing
        let guestAccessSection = '';
        if (isNewUser && tempPassword) {
          guestAccessSection = `
            <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0284c7;">
              <h3 style="margin-top: 0; color: #0c4a6e;">🎉 Você também ganhou acesso ao CONECTA+!</h3>
              <p style="margin-bottom: 10px;">Criamos uma conta para você em nosso portal exclusivo de networking:</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Senha temporária:</strong> ${tempPassword}</p>
              <p style="margin-top: 15px;">
                <a href="${portalUrl}/conecta" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Acessar CONECTA+
                </a>
              </p>
              <p style="font-size: 12px; color: #64748b; margin-top: 10px;">
                Recomendamos alterar sua senha no primeiro acesso.
              </p>
            </div>
          `;
        }

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #7c3aed; margin-bottom: 20px;">Inscrição Confirmada! 🎉</h1>
              <p>Olá <strong>${full_name}</strong>,</p>
              <p>Sua inscrição no evento <strong>${event.title}</strong> foi confirmada com sucesso!</p>
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #374151;">Detalhes do Evento</h3>
                <p><strong>📅 Data:</strong> ${eventDateFormatted} às ${eventTimeFormatted}</p>
                ${event.location ? `<p><strong>📍 Local:</strong> ${event.location}</p>` : ''}
                ${event.location_url ? `<p><strong>🔗 Link:</strong> <a href="${event.location_url}">${event.location_url}</a></p>` : ''}
              </div>
              ${guestAccessSection}
              <p style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <strong>⚠️ Importante:</strong> Você receberá emails pedindo confirmação de presença alguns dias antes do evento. 
                Por favor, confirme sua presença para garantir sua vaga!
              </p>
              <p>Guarde este email para referência. Qualquer dúvida, entre em contato conosco.</p>
              <p>Até breve!</p>
              <p><strong>Equipe Mulheres em Convergência</strong></p>
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
            to: [{ email, name: full_name }],
            subject: `Inscrição Confirmada: ${event.title}`,
            html_part: emailHtml,
          }),
        });
        logStep("Confirmation email sent", { email, isNewUser });
      }
    } catch (emailError) {
      logStep("Email sending failed (non-blocking)", { error: String(emailError) });
    }

    return new Response(
      JSON.stringify({
        success: true,
        registration_id: registration.id,
        lead_id: leadId,
        user_id: userId,
        is_new_user: isNewUser,
        message: "Registration completed successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
