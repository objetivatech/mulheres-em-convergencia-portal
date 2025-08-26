import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  hp?: string;
  ts?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check Origin/Referer
    const origin = req.headers.get('origin') || '';
    const referer = req.headers.get('referer') || '';
    const allowedOrigins = ['https://mulheresemconvergencia.com.br', 'http://localhost:5173'];
    const isAllowed = allowedOrigins.some((o) => origin.startsWith(o) || referer.startsWith(o));
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ error: 'Origin not allowed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { name, email, subject, message, hp, ts }: ContactMessage = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Todos os campos são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Honeypot check
    if (hp && String(hp).trim() !== '') {
      // Pretend success to mislead bots
      return new Response(
        JSON.stringify({ success: true, message: 'Mensagem enviada com sucesso!' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Minimum time on page (3s) to avoid instant bot submissions
    if (typeof ts === 'number' && Number.isFinite(ts)) {
      if (Date.now() - ts < 3000) {
        return new Response(
          JSON.stringify({ error: 'Envio muito rápido, tente novamente.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Basic content validation
    if (subject.trim().length < 3 || message.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Informe um assunto e mensagem válidos.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit: max 3 messages por email em 10 minutos
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('email', email.trim().toLowerCase())
      .gte('created_at', tenMinutesAgo);

    if ((recentCount ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: 'Muitas mensagens recentes. Tente novamente mais tarde.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert contact message into database
    const { data, error: insertError } = await supabase
      .from('contact_messages')
      .insert([{
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim()
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Contact message saved successfully:', data.id);

    // Send email notification
    try {
      const emailResponse = await resend.emails.send({
        from: 'Mulheres em Convergência <noreply@mulheresemconvergencia.com.br>',
        to: ['juntas@mulheresemconvergencia.com.br'],
        replyTo: email,
        subject: `Nova mensagem de contato: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #C75A92, #9191C0); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Nova Mensagem de Contato</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f9f9f9;">
              <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #C75A92; margin-top: 0;">${subject}</h2>
                
                <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                  <p style="margin: 5px 0;"><strong>Nome:</strong> ${name}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                  <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                </div>
                
                <div style="margin: 20px 0;">
                  <h3 style="color: #333; margin-bottom: 10px;">Mensagem:</h3>
                  <div style="background-color: #fff; border-left: 4px solid #C75A92; padding: 15px; margin: 10px 0;">
                    ${message.replace(/\n/g, '<br>')}
                  </div>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                  <p style="color: #666; font-size: 14px;">
                    Esta mensagem foi enviada através do formulário de contato do site 
                    <a href="https://mulheresemconvergencia.com.br" style="color: #C75A92;">Mulheres em Convergência</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        `,
      });

      console.log('Email sent successfully:', emailResponse);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Continue without failing the request - message is saved in DB
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
        id: data.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-contact-message function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});