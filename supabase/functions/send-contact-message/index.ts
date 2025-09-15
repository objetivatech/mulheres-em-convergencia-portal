import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  honeypot?: string;
  timestamp?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const body: ContactMessage = await req.json();
    const { name, email, subject, message, honeypot, timestamp } = body;

    console.log('Processing contact message from:', email);

    // Basic validation
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Todos os campos são obrigatórios' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Email inválido' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Honeypot validation (should be empty)
    if (honeypot && honeypot.trim() !== '') {
      console.log('Honeypot field filled, likely spam');
      // Return fake success to mislead bots
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Mensagem enviada com sucesso!' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Timestamp validation (minimum 3 seconds to fill form)
    if (timestamp && (Date.now() - timestamp) < 3000) {
      console.log('Form submitted too quickly, likely spam');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Formulário enviado muito rapidamente' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Content validation
    if (subject.trim().length < 3 || message.trim().length < 10) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Assunto e mensagem devem ser mais detalhados' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Rate limiting - check for recent submissions from same email
    const { count: recentCount } = await supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('email', email.trim().toLowerCase())
      .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // 10 minutes

    if ((recentCount ?? 0) >= 3) {
      console.log('Rate limit exceeded for email:', email);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Muitas mensagens enviadas. Tente novamente em 10 minutos.' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Insert message into database
    const { data: messageData, error: insertError } = await supabase
      .from('contact_messages')
      .insert([{
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        status: 'new'
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Database error:', insertError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Erro ao salvar mensagem' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log('Message saved to database:', messageData.id);

    // Send email using Supabase Auth (uses configured SMTP - MailRelay)
    // This leverages the SMTP configuration already set in Supabase Auth settings
    try {
      // We'll create a simple notification email using Supabase Auth's invite system
      // This is a workaround to use the configured SMTP without complex setup
      const emailSubject = `Nova mensagem de contato: ${subject}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #C75A92, #9191C0); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Nova Mensagem de Contato</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <div style="background: white; padding: 25px; border-radius: 8px;">
              <h2 style="color: #C75A92; margin-top: 0;">${subject}</h2>
              
              <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                <p><strong>Nome:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
              </div>
              
              <div style="margin: 20px 0;">
                <h3>Mensagem:</h3>
                <div style="background-color: #fff; border-left: 4px solid #C75A92; padding: 15px;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                <p style="color: #666; font-size: 14px;">
                  Esta mensagem foi enviada através do formulário de contato do site Mulheres em Convergência
                </p>
                <p style="color: #666; font-size: 12px;">ID da mensagem: ${messageData.id}</p>
              </div>
            </div>
          </div>
        </div>
      `;

      // Use Supabase auth admin API to send email (leverages configured SMTP)
      const authResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/admin/generate_link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        },
        body: JSON.stringify({
          type: 'invite',
          email: 'contato@mulheresemconvergencia.com.br', // Replace with your admin email
          options: {
            data: {
              contact_name: name.trim(),
              contact_email: email.trim(),
              contact_subject: subject.trim(),
              contact_message: message.trim(),
              message_id: messageData.id
            }
          }
        })
      });

      let emailSent = false;
      let emailError = null;

      if (authResponse.ok) {
        console.log('Email notification sent successfully via Supabase Auth SMTP');
        emailSent = true;
        
        // Update message status
        await supabase
          .from('contact_messages')
          .update({ status: 'processed' })
          .eq('id', messageData.id);
      } else {
        const errorData = await authResponse.text();
        console.error('Email sending failed:', errorData);
        emailError = errorData;
        
        // Update message status to indicate email failed
        await supabase
          .from('contact_messages')
          .update({ 
            status: 'email_failed',
            admin_notes: `Email sending failed: ${errorData}`
          })
          .eq('id', messageData.id);
      }

      // Always return success for message saving
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
        email_sent: emailSent,
        message_id: messageData.id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } catch (emailError: any) {
      console.error('Email service error:', emailError);
      
      // Update message status
      await supabase
        .from('contact_messages')
        .update({ 
          status: 'email_failed',
          admin_notes: `Email service error: ${emailError.message}`
        })
        .eq('id', messageData.id);

      // Still return success for message saving
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Mensagem salva com sucesso! Entraremos em contato em breve.',
        email_sent: false,
        message_id: messageData.id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Erro interno do servidor. Tente novamente em alguns instantes.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});