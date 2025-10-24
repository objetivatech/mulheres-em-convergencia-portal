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

    // Log the contact message for admin review
    console.log(`New contact message received:
      ID: ${messageData.id}
      From: ${name} <${email}>
      Subject: ${subject}
      Message: ${message}
    `);

    // Send email notification to admins via MailRelay
    let emailSent = false;
    try {
      const mailrelayApiKey = Deno.env.get('MAILRELAY_API_KEY');
      const mailrelayHost = Deno.env.get('MAILRELAY_HOST');
      const adminEmailFrom = Deno.env.get('ADMIN_EMAIL_FROM');

      if (mailrelayApiKey && mailrelayHost && adminEmailFrom) {
        // Get list of admins
        const { data: admins } = await supabase
          .from('user_roles')
          .select('profiles!inner(email, full_name)')
          .eq('role', 'admin');

        if (admins && admins.length > 0) {
          // Prepare email content
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #C75A92;">Nova Mensagem de Contato</h2>
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>De:</strong> ${name}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>Assunto:</strong> ${subject}</p>
                <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
              </div>
              <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h3 style="color: #333; margin-top: 0;">Mensagem:</h3>
                <p style="white-space: pre-wrap; color: #555;">${message}</p>
              </div>
              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; color: #92400e;">💡 <strong>Ação necessária:</strong> Responda para ${email}</p>
              </div>
            </div>
          `;

          // Send to all admins
          const emailPromises = admins.map(async (admin: any) => {
            const mailrelayPayload = {
              "from": {
                "email": adminEmailFrom,
                "name": "Mulheres em Convergência - Contato"
              },
              "to": [
                {
                  "email": admin.profiles.email,
                  "name": admin.profiles.full_name || admin.profiles.email
                }
              ],
              "subject": `Nova Mensagem de Contato: ${subject}`,
              "html_part": emailHtml,
              "reply_to": {
                "email": email,
                "name": name
              }
            };

            const response = await fetch(`https://${mailrelayHost}/send_emails`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'X-AUTH-TOKEN': mailrelayApiKey
              },
              body: JSON.stringify(mailrelayPayload)
            });

            return response.ok;
          });

          const results = await Promise.all(emailPromises);
          emailSent = results.some(r => r);
          console.log(`Emails sent to admins: ${results.filter(r => r).length}/${results.length}`);
        }
      }
    } catch (emailError) {
      console.error('Error sending notification email:', emailError);
      // Don't fail the request if email fails
    }
    
    // Update message status
    await supabase
      .from('contact_messages')
      .update({ status: emailSent ? 'processed' : 'new' })
      .eq('id', messageData.id);

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