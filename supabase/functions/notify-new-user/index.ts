import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const mailrelayApiKey = Deno.env.get('MAILRELAY_API_KEY')!;
const mailrelayHost = Deno.env.get('MAILRELAY_HOST')!;
const adminEmailFrom = Deno.env.get('ADMIN_EMAIL_FROM')!;

interface NewUserPayload {
  user_id: string;
  email: string;
  full_name: string;
  cpf?: string;
  created_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: NewUserPayload = await req.json();
    
    console.log('Processing new user notification:', payload.user_id);

    // 1. Buscar todos os administradores
    const { data: adminUsers, error: adminError } = await supabase
      .rpc('get_profiles_admin_safe', { p_limit: 100, p_offset: 0 });

    if (adminError) {
      console.error('Error fetching admins:', adminError);
      throw adminError;
    }

    const admins = (adminUsers || []).filter(u => u.is_admin === true);
    console.log(`Found ${admins.length} administrators`);

    if (admins.length === 0) {
      console.warn('No administrators found to notify');
      return new Response(
        JSON.stringify({ warning: 'No administrators to notify' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Preparar dados do email
    const profileComplete = payload.cpf && payload.cpf.length > 0;
    const dashboardLink = `https://mulheresemconvergencia.com.br/admin/users`;

    const emailSubject = `Novo Cadastro no Portal - ${payload.full_name}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Novo Cadastro Realizado</h2>
        
        <p>Olá, Administrador!</p>
        
        <p>Um novo usuário se cadastrou no portal <strong>Mulheres em Convergência</strong>:</p>
        
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Nome:</strong> ${payload.full_name}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${payload.email}</p>
          <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date(payload.created_at).toLocaleString('pt-BR')}</p>
          <p style="margin: 5px 0;"><strong>Cadastro Completo:</strong> ${profileComplete ? '✅ Sim' : '❌ Não (CPF pendente)'}</p>
        </div>
        
        <div style="background-color: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0;">
          <p style="margin: 0;"><strong>Status da Jornada:</strong> Cadastro Inicial</p>
          <p style="margin: 5px 0 0 0;"><strong>Próximo Passo Esperado:</strong> ${profileComplete ? 'Escolher plano de assinatura' : 'Completar perfil com CPF'}</p>
        </div>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="${dashboardLink}" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ver no Painel Administrativo
          </a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;" />
        
        <p style="font-size: 12px; color: #6B7280; text-align: center;">
          Esta é uma notificação automática do sistema Mulheres em Convergência.<br />
          Você recebeu este email porque é um administrador do portal.
        </p>
      </div>
    `;

    // 3. Enviar emails via MailRelay API
    const emailPromises = admins.map(async (admin) => {
      try {
        const mailrelayPayload = {
          "from": {
            "email": adminEmailFrom,
            "name": "Mulheres em Convergência"
          },
          "to": [
            {
              "email": admin.email,
              "name": admin.full_name || admin.email
            }
          ],
          "subject": emailSubject,
          "html_part": emailBody
        };

        const response = await fetch(`https://${mailrelayHost}/api/v1/send_emails`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-AUTH-TOKEN': mailrelayApiKey,
          },
          body: JSON.stringify(mailrelayPayload),
        });

        const result = await response.json();
        
        if (!response.ok) {
          console.error(`Failed to send email to ${admin.email}:`, result);
          throw new Error(`MailRelay API error: ${JSON.stringify(result)}`);
        }

        console.log(`Email sent successfully to ${admin.email}`);

        // 4. Registrar notificação in-app
        await supabase.rpc('create_notification', {
          target_user_id: admin.id,
          notification_type: 'new_user_signup',
          notification_title: 'Novo Cadastro Realizado',
          notification_message: `${payload.full_name} acabou de se cadastrar no portal.`,
          notification_data: {
            user_id: payload.user_id,
            user_email: payload.email,
            profile_complete: profileComplete
          },
          notification_action_url: `/admin/users`
        });

        return { success: true, admin_email: admin.email };
      } catch (error) {
        console.error(`Error notifying admin ${admin.email}:`, error);
        return { success: false, admin_email: admin.email, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Notification summary: ${successCount} sent, ${failureCount} failed`);

    // 5. Logar atividade do usuário
    await supabase.rpc('log_user_activity', {
      p_user_id: payload.user_id,
      p_activity_type: 'admin_notified_new_signup',
      p_description: `Administradores notificados sobre novo cadastro`,
      p_metadata: {
        admins_notified: successCount,
        admins_failed: failureCount,
        profile_complete: profileComplete
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        admins_notified: successCount,
        admins_failed: failureCount,
        results: results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in notify-new-user function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
