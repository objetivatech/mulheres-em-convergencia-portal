import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-AMBASSADOR-PAYOUT-EMAIL] ${step}${detailsStr}`);
};

const mailrelayApiKey = Deno.env.get('MAILRELAY_API_KEY')!;
const mailrelayHost = Deno.env.get('MAILRELAY_HOST')!;
const adminEmailFrom = Deno.env.get('ADMIN_EMAIL_FROM') || 'contato@mulheresemconvergencia.com.br';

// Helper for Brazil formatting
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDateBrazil = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const formatPeriodBrazil = (periodStr: string) => {
  // Period is in format YYYY-MM
  const [year, month] = periodStr.split('-');
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${months[parseInt(month) - 1]} de ${year}`;
};

interface PayoutEmailRequest {
  payout_id: string;
  action?: 'paid'; // For now, only 'paid' triggers email
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!mailrelayApiKey || !mailrelayHost) {
      throw new Error('Mailrelay configuration missing');
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { payout_id, action = 'paid' }: PayoutEmailRequest = await req.json();
    logStep("Processing payout email request", { payout_id, action });

    if (!payout_id) {
      throw new Error('payout_id is required');
    }

    // Get payout with ambassador and profile data
    const { data: payout, error: payoutError } = await supabaseClient
      .from('ambassador_payouts')
      .select(`
        *,
        ambassador:ambassadors(
          id,
          referral_code,
          user_id,
          profile:profiles(
            full_name,
            email
          )
        )
      `)
      .eq('id', payout_id)
      .single();

    if (payoutError || !payout) {
      logStep("Payout not found", { error: payoutError?.message });
      throw new Error('Payout not found');
    }

    const ambassador = payout.ambassador as any;
    const profile = ambassador?.profile as any;

    if (!profile?.email) {
      logStep("Ambassador email not found", { ambassadorId: ambassador?.id });
      throw new Error('Ambassador email not found');
    }

    logStep("Found payout data", { 
      ambassadorName: profile.full_name,
      email: profile.email,
      amount: payout.net_amount 
    });

    // Only send confirmation email when status is paid
    if (action === 'paid' && payout.status === 'paid') {
      const emailHtml = generatePaymentConfirmationEmail({
        name: profile.full_name || 'Embaixadora',
        amount: payout.net_amount,
        grossAmount: payout.gross_amount,
        period: payout.reference_period,
        totalSales: payout.total_sales,
        paidAt: payout.paid_at || new Date().toISOString(),
        paymentMethod: payout.payment_method || 'PIX',
        notes: payout.notes,
      });

      await sendEmail(
        profile.email,
        `💰 Pagamento Confirmado - ${formatPeriodBrazil(payout.reference_period)}`,
        emailHtml
      );

      logStep("Payment confirmation email sent", { email: profile.email });
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

interface PaymentEmailData {
  name: string;
  amount: number;
  grossAmount: number;
  period: string;
  totalSales: number;
  paidAt: string;
  paymentMethod: string;
  notes?: string | null;
}

function generatePaymentConfirmationEmail(data: PaymentEmailData): string {
  const periodFormatted = formatPeriodBrazil(data.period);
  const dateFormatted = formatDateBrazil(data.paidAt);
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagamento Confirmado</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="padding: 20px 0;">
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); border-radius: 16px 16px 0 0;">
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">💰</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">
                Pagamento Confirmado!
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Programa de Embaixadoras
              </p>
            </td>
          </tr>
        </table>

        <!-- Main Content -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: white; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Olá <strong>${data.name}</strong>,
              </p>
              
              <p style="margin: 0 0 25px; color: #374151; font-size: 16px; line-height: 1.6;">
                Temos uma ótima notícia! Seu pagamento referente ao período de <strong>${periodFormatted}</strong> foi processado com sucesso.
              </p>

              <!-- Payment Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0fdf4; border-radius: 12px; border: 1px solid #86efac;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="margin: 0 0 20px; color: #166534; font-size: 18px; font-weight: 600;">
                      📋 Detalhes do Pagamento
                    </h3>
                    
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px;">Período de Referência:</td>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">${periodFormatted}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px;">Vendas no Período:</td>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">${data.totalSales}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px;">Valor Bruto:</td>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">${formatCurrency(data.grossAmount)}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 10px 0;">
                          <div style="border-top: 1px dashed #86efac;"></div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 18px; font-weight: 600;">Valor Pago:</td>
                        <td style="padding: 8px 0; color: #166534; font-size: 24px; text-align: right; font-weight: 700;">${formatCurrency(data.amount)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px;">Método:</td>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">${data.paymentMethod}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px;">Data do Pagamento:</td>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">${dateFormatted}</td>
                      </tr>
                    </table>
                    
                    ${data.notes ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #86efac;">
                      <p style="margin: 0; color: #6b7280; font-size: 13px;">
                        <strong>Observações:</strong> ${data.notes}
                      </p>
                    </div>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 30px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://mulheresemconvergencia.com.br/painel/embaixadora" 
                       style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Ver Meu Painel
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Thank You Message -->
              <div style="margin-top: 30px; padding: 20px; background-color: #fef3c7; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  💜 Obrigada por fazer parte do nosso programa de embaixadoras!
                </p>
              </div>

              <p style="margin: 25px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Em caso de dúvidas, entre em contato conosco.
              </p>

              <p style="margin: 20px 0 0; color: #374151;">
                Com carinho,<br>
                <strong>Equipe Mulheres em Convergência</strong>
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Este email foi enviado automaticamente pelo sistema de pagamentos.<br>
                © ${new Date().getFullYear()} Mulheres em Convergência. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

async function sendEmail(to: string, subject: string, htmlContent: string) {
  const mailrelayPayload = {
    from: {
      email: adminEmailFrom,
      name: "Mulheres em Convergência"
    },
    to: [{ email: to, name: to }],
    subject: subject,
    html_part: htmlContent
  };

  logStep("Sending email via Mailrelay", { to, subject });

  const response = await fetch(`https://${mailrelayHost}/api/v1/send_emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AUTH-TOKEN': mailrelayApiKey,
    },
    body: JSON.stringify(mailrelayPayload),
  });

  const contentType = response.headers.get('content-type');
  let result: any;
  
  if (contentType && contentType.includes('application/json')) {
    result = await response.json();
  } else {
    const textResponse = await response.text();
    logStep("Mailrelay non-JSON response", { text: textResponse.substring(0, 200) });
    throw new Error(`Mailrelay API error: Invalid response format`);
  }

  if (!response.ok) {
    logStep("Mailrelay error", { result });
    throw new Error(`Mailrelay error: ${JSON.stringify(result)}`);
  }

  logStep("Email sent successfully", { result });
  return result;
}
