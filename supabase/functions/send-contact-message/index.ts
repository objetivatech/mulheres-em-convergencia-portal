import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { enviarEmail } from "../_shared/enviar-email.ts";

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
      .from('mensagens_contato')
      .select('id', { count: 'exact', head: true })
      .eq('email', email.trim().toLowerCase())
      .gte('criado_em', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // 10 minutes

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
      .from('mensagens_contato')
      .insert([{
        nome: name.trim().slice(0, 120),
        email: email.trim().toLowerCase(),
        assunto: subject.trim().slice(0, 200),
        mensagem: message.trim().slice(0, 5000),
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

    // Aviso para as administradoras pelo canal oficial de e-mail
    let emailSent = false;
    try {
      const { data: papeis } = await supabase.from('papeis').select('pessoa_id').eq('papel', 'admin');
      const ids = (papeis ?? []).map((p: any) => p.pessoa_id);
      const { data: contatos } = ids.length
        ? await supabase.from('pessoa_contatos').select('valor, pessoas!pessoa_contatos_pessoa_id_fkey(nome)').eq('tipo', 'email').in('pessoa_id', ids)
        : { data: [] as any[] };
      const vistos = new Set<string>();
      const admins = (contatos ?? []).filter((c: any) => !vistos.has(String(c.valor).toLowerCase()) && vistos.add(String(c.valor).toLowerCase()))
        .map((c: any) => ({ profiles: { email: String(c.valor), full_name: c.pessoas?.nome ?? '' } }));
      console.log(`[SEND-CONTACT-MESSAGE] Found ${admins.length} admins`);

      if (admins && admins.length > 0) {
        const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #C75A92;">Nova Mensagem de Contato</h2>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>De:</strong> ${esc(name)}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${esc(email)}</p>
              <p style="margin: 5px 0;"><strong>Assunto:</strong> ${esc(subject)}</p>
              <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </div>
            <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h3 style="color: #333; margin-top: 0;">Mensagem:</h3>
              <p style="white-space: pre-wrap; color: #555;">${esc(message)}</p>
            </div>
            <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
              <p style="margin: 0; color: #92400e;">💡 <strong>Ação necessária:</strong> Responda para ${esc(email)}</p>
            </div>
          </div>
        `;

        const emailPromises = admins.map(async (admin: any) => {
          try {
            await enviarEmail(
              { email: admin.profiles.email, nome: admin.profiles.full_name || admin.profiles.email },
              `Nova Mensagem de Contato: ${subject}`,
              emailHtml,
            );
            console.log(`[SEND-CONTACT-MESSAGE] Email sent successfully to ${admin.profiles.email}`);
            return true;
          } catch (e) {
            console.error(`[SEND-CONTACT-MESSAGE] Falha para ${admin.profiles.email}:`, e);
            return false;
          }
        });

        const results = await Promise.all(emailPromises);
        emailSent = results.some(r => r);
        console.log(`[SEND-CONTACT-MESSAGE] Emails sent to admins: ${results.filter(r => r).length}/${results.length}`);
      } else {
        console.warn('[SEND-CONTACT-MESSAGE] No admins found to send email notification');
      }
    } catch (emailError) {
      console.error('Error sending notification email:', emailError);
      // Don't fail the request if email fails
    }
    
    // Update message status
    await supabase
      .from('mensagens_contato')
      .update({ situacao: emailSent ? 'avisada' : 'nova' })
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