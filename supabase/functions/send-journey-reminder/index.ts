import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { enviarEmail } from '../_shared/enviar-email.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ReminderRequest {
  user_id: string;
  user_email: string;
  user_name: string;
  journey_stage: string;
  subject: string;
  message: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verificar se é admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      throw new Error('Admin privileges required');
    }

    const payload: ReminderRequest = await req.json();
    console.log('Processing reminder for user:', payload.user_id);

    // Enviar email via MailRelay
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${payload.message.split('\n').map(line => `<p>${line}</p>`).join('')}
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;" />
        
        <p style="font-size: 12px; color: #6B7280; text-align: center;">
          Mulheres em Convergência<br />
          Esta mensagem foi enviada por um administrador do portal.
        </p>
      </div>
    `;

    await enviarEmail(
      { email: payload.user_email, nome: payload.user_email },
      payload.subject,
      emailHtml,
    );

    console.log('Email sent successfully to', payload.user_email);

    // Registrar notificação in-app para o usuário
    await supabase.rpc('create_notification', {
      target_user_id: payload.user_id,
      notification_type: 'journey_reminder',
      notification_title: 'Lembrete do Portal',
      notification_message: payload.subject,
      notification_data: {
        journey_stage: payload.journey_stage,
        sent_at: new Date().toISOString()
      }
    });

    // Logar atividade
    await supabase.rpc('log_user_activity', {
      p_user_id: payload.user_id,
      p_activity_type: 'reminder_sent',
      p_description: `Lembrete enviado: ${payload.subject}`,
      p_metadata: {
        journey_stage: payload.journey_stage,
        sent_by_admin: user.id,
        email_sent: true
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reminder sent successfully',
        email_sent_to: payload.user_email
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-journey-reminder function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { 
        status: error.message === 'Unauthorized' || error.message === 'Admin privileges required' ? 403 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
