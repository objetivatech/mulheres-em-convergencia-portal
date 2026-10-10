// Inscrição pública na newsletter (Sender.net). Aberta ao visitante: só aceita nome + e-mail.
// O token do Sender fica no servidor. Lista opcional: SENDER_GRUPO_NEWSLETTER.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { corsHeaders } from '../_shared/cors.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? '').trim().toLowerCase().slice(0, 200);
    const nome = String(body.nome ?? '').trim().slice(0, 100);
    const origem = String(body.origem ?? 'site').slice(0, 120);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'E-mail inválido' }, 400);
    if (nome.length < 2) return json({ error: 'Informe seu nome' }, 400);

    const token = Deno.env.get('SENDER_API_TOKEN')?.trim();
    const grupo = Deno.env.get('SENDER_GRUPO_NEWSLETTER')?.trim();
    let enviadoSender = false;
    if (token) {
      const res = await fetch('https://api.sender.net/v2/subscribers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, firstname: nome, groups: grupo ? [grupo] : [] }),
      });
      enviadoSender = res.ok;
      if (!res.ok) console.error('[newsletter-inscrever] Sender', res.status, await res.text());
    }

    // Registro no histórico de contatos (fica no portal mesmo se o Sender falhar).
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await sb.from('contato_eventos').insert({
      email, tipo: 'newsletter', titulo: 'Assinou a newsletter', detalhe: origem,
      dados: { nome, origem, sender: enviadoSender },
    });

    return json({ ok: true });
  } catch (e) {
    console.error('[newsletter-inscrever]', e);
    return json({ error: 'Não foi possível concluir agora' }, 500);
  }
});
