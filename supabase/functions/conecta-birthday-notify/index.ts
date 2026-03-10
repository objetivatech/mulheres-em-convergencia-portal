import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MAILRELAY_API_KEY = Deno.env.get('MAILRELAY_API_KEY')!;
const MAILRELAY_URL = Deno.env.get('MAILRELAY_URL') || 'https://mulheresemconvergencia.ip-zone.com/api/v1';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-indexed

    // Get birthday members for current month
    const { data: birthdayMembers, error: bErr } = await supabase
      .from('conecta_profiles')
      .select('id, full_name, birthday, avatar_url')
      .eq('is_active', true)
      .not('birthday', 'is', null);

    if (bErr) throw bErr;

    // Filter for current month
    const monthMembers = (birthdayMembers || []).filter(m => {
      if (!m.birthday) return false;
      const month = parseInt(m.birthday.split('-')[1], 10);
      return month === currentMonth;
    }).sort((a, b) => {
      const dayA = parseInt(a.birthday.split('-')[2], 10);
      const dayB = parseInt(b.birthday.split('-')[2], 10);
      return dayA - dayB;
    });

    if (monthMembers.length === 0) {
      return new Response(JSON.stringify({ message: 'No birthdays this month' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all active conecta members' emails
    const { data: allMembers, error: mErr } = await supabase
      .from('conecta_profiles')
      .select('id, email, full_name')
      .eq('is_active', true);

    if (mErr) throw mErr;

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthName = monthNames[currentMonth - 1];

    // Build birthday list HTML
    const birthdayListHtml = monthMembers.map(m => {
      const day = parseInt(m.birthday.split('-')[2], 10);
      return `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0e6d3;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #c4956a, #d4a574); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
                ${m.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div>
                <strong style="color: #5a3825;">${m.full_name}</strong>
                <br/><span style="color: #8b6f5e; font-size: 13px;">🎂 ${day} de ${monthName}</span>
              </div>
            </div>
          </td>
        </tr>`;
    }).join('');

    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #c4956a 0%, #d4a574 50%, #e8c9a8 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <div style="font-size: 48px; margin-bottom: 12px;">🎉🎂✨</div>
          <h1 style="color: white; font-size: 24px; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            Aniversariantes de ${monthName}
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px;">
            CONECTA+ • Mulheres em Convergência
          </p>
        </div>
        
        <div style="background: #fffaf5; padding: 24px 20px; border: 1px solid #f0e6d3; border-top: none;">
          <p style="color: #5a3825; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
            Olá! 🌟<br><br>
            Confira as nossas queridas aniversariantes do mês de <strong>${monthName}</strong>.
            Que tal enviar uma mensagem carinhosa para celebrar? 💛
          </p>
          
          <table width="100%" cellpadding="0" cellspacing="0" style="background: white; border-radius: 8px; overflow: hidden; border: 1px solid #f0e6d3;">
            ${birthdayListHtml}
          </table>
          
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://mulheresemconvergencia.com.br/conecta/aniversariantes" 
               style="display: inline-block; background: linear-gradient(135deg, #c4956a, #b38456); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Ver Todos os Aniversariantes
            </a>
          </div>
        </div>
        
        <div style="background: #5a3825; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
          <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0;">
            Mulheres em Convergência • CONECTA+<br>
            Juntas somos mais fortes 💛
          </p>
        </div>
      </div>
    `;

    // Send via Mailrelay to all members
    const emails = (allMembers || []).filter(m => m.email).map(m => m.email);

    if (emails.length > 0 && MAILRELAY_API_KEY) {
      // Create campaign via Mailrelay
      const campaignRes = await fetch(`${MAILRELAY_URL}/send_emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': MAILRELAY_API_KEY,
        },
        body: JSON.stringify({
          subject: `🎂 Aniversariantes de ${monthName} - CONECTA+`,
          html: emailHtml,
          from: { email: 'juntas@mulheresemconvergencia.com.br', name: 'MeC CONECTA+' },
          to: emails.map(e => ({ email: e })),
        }),
      });

      const campaignData = await campaignRes.json();
      console.log('Mailrelay response:', JSON.stringify(campaignData));
    }

    return new Response(JSON.stringify({
      success: true,
      month: monthName,
      birthdayCount: monthMembers.length,
      recipientCount: emails.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Birthday notify error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
