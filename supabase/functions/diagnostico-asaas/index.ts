// Diagnóstico do Asaas — somente administradoras.
// Mostra para onde o Asaas está enviando os avisos de pagamento (webhooks)
// e se a chave de produção está respondendo. Não altera nada.

import { corsHeaders } from '../_shared/cors.ts';
import { requireAdminOrCron } from '../_shared/auth.ts';

const ASAAS_BASE = 'https://api.asaas.com/v3';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const auth = await requireAdminOrCron(req);
  if ('error' in auth) return auth.error;

  const apiKey = Deno.env.get('ASAAS_API_KEY');
  if (!apiKey) return json({ error: 'ASAAS_API_KEY não configurada' }, 500);

  const destinoEsperado = `${Deno.env.get('SUPABASE_URL')}/functions/v1/asaas-webhook`;

  try {
    const res = await fetch(`${ASAAS_BASE}/webhooks`, {
      headers: { access_token: apiKey, 'Content-Type': 'application/json' },
    });
    const corpo = await res.json().catch(() => ({}));
    if (!res.ok) return json({ error: `Asaas respondeu ${res.status}`, detalhe: corpo }, 502);

    const webhooks = (corpo?.data ?? []).map((w: Record<string, unknown>) => ({
      nome: w.name,
      url: w.url,
      ativo: w.enabled,
      eventos: w.events,
      temToken: !!w.authToken,
    }));

    const apontandoParaCa = webhooks.some(
      (w: { url?: string; ativo?: boolean }) => w.url === destinoEsperado && w.ativo !== false,
    );

    return json({ destinoEsperado, apontandoParaCa, webhooks });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
