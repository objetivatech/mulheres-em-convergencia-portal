// Diagnóstico do Asaas — somente administradoras.
// Mostra para onde o Asaas está enviando os avisos de pagamento (webhooks),
// se estão penalizados e permite acertar a senha de autenticação para que
// ela fique igual à guardada aqui (ASAAS_WEBHOOK_TOKEN).

import { corsHeaders } from '../_shared/cors.ts';
import { requireAdminOrCron } from '../_shared/auth.ts';

const ASAAS_BASE = 'https://api.asaas.com/v3';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const resumo = (w: Record<string, unknown>) => ({
  id: w.id,
  nome: w.name,
  url: w.url,
  ativo: w.enabled,
  penalizado: w.interrupted === true,
  eventos: w.events,
  temToken: !!w.authToken,
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const auth = await requireAdminOrCron(req);
  if ('error' in auth) return auth.error;

  const apiKey = Deno.env.get('ASAAS_API_KEY');
  if (!apiKey) return json({ error: 'ASAAS_API_KEY não configurada' }, 500);

  const tokenLocal = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
  const destinoEsperado = `${Deno.env.get('SUPABASE_URL')}/functions/v1/asaas-webhook`;
  const cabecalhos = { access_token: apiKey, 'Content-Type': 'application/json' };

  let acao = 'verificar';
  try {
    const corpo = await req.json();
    if (corpo?.acao) acao = String(corpo.acao);
  } catch {
    /* sem corpo: apenas verificar */
  }

  try {
    const res = await fetch(`${ASAAS_BASE}/webhooks`, { headers: cabecalhos });
    const corpo = await res.json().catch(() => ({}));
    if (!res.ok) return json({ error: `Asaas respondeu ${res.status}`, detalhe: corpo }, 502);

    const brutos = (corpo?.data ?? []) as Record<string, unknown>[];
    const nossos = brutos.filter((w) => w.url === destinoEsperado);

    if (acao === 'sincronizar') {
      if (!tokenLocal) return json({ error: 'ASAAS_WEBHOOK_TOKEN não configurada' }, 500);
      if (!nossos.length) {
        return json({ error: 'Nenhum aviso do Asaas aponta para o portal novo' }, 400);
      }

      const corrigidos: string[] = [];
      for (const w of nossos) {
        const atualiza = await fetch(`${ASAAS_BASE}/webhooks/${w.id}`, {
          method: 'PUT',
          headers: cabecalhos,
          body: JSON.stringify({
            name: w.name,
            url: destinoEsperado,
            email: w.email,
            enabled: true,
            interrupted: false,
            apiVersion: 3,
            authToken: tokenLocal,
            sendType: w.sendType ?? 'SEQUENTIALLY',
            events: w.events,
          }),
        });
        const resposta = await atualiza.json().catch(() => ({}));
        if (!atualiza.ok) {
          return json({ error: `Não foi possível acertar o aviso: ${atualiza.status}`, detalhe: resposta }, 502);
        }
        corrigidos.push(String(w.id));
      }

      const depois = await fetch(`${ASAAS_BASE}/webhooks`, { headers: cabecalhos });
      const listaDepois = await depois.json().catch(() => ({ data: [] }));
      const webhooks = ((listaDepois?.data ?? []) as Record<string, unknown>[]).map(resumo);
      return json({
        destinoEsperado,
        sincronizados: corrigidos.length,
        apontandoParaCa: webhooks.some((w) => w.url === destinoEsperado && w.ativo !== false),
        webhooks,
      });
    }

    const webhooks = brutos.map(resumo);
    const apontandoParaCa = webhooks.some((w) => w.url === destinoEsperado && w.ativo !== false);
    const penalizados = webhooks.filter((w) => w.url === destinoEsperado && w.penalizado).length;

    return json({ destinoEsperado, apontandoParaCa, penalizados, tokenConfigurado: !!tokenLocal, webhooks });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
