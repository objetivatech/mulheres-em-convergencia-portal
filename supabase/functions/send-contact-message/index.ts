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

    // For now, we'll just log and mark as processed
    // To send emails, you would need to set up a service like Resend
    const emailSent = false; // Change to true when email service is configured
    
    // Update message status
    await supabase
      .from('contact_messages')
      .update({ status: 'processed' })
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