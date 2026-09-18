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

  // Remove espaços/quebras de linha acidentais: um valor com esses caracteres
  // quebra o envio (cabeçalho inválido) e faz o Asaas receber 401.
  const tokenLocal = (Deno.env.get('ASAAS_WEBHOOK_TOKEN') ?? '').trim().replace(/[\r\n]/g, '');
  const tokenValido = /^[\x21-\x7e]+$/.test(tokenLocal);
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

    // Puxa os pagamentos direto do Asaas e processa aqui, sem depender do
    // botão "Reenviar" do painel do Asaas (que fica bloqueado após penalização).
    if (acao === 'conciliar') {
      if (!tokenLocal) return json({ error: 'ASAAS_WEBHOOK_TOKEN não configurada' }, 500);

      const dias = 30;
      const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const encontrados: Record<string, unknown>[] = [];

      for (const status of ['CONFIRMED', 'RECEIVED']) {
        let offset = 0;
        for (;;) {
          const url =
            `${ASAAS_BASE}/payments?status=${status}&limit=100&offset=${offset}` +
            `&dateCreated[ge]=${desde}`;
          const r = await fetch(url, { headers: cabecalhos });
          const c = await r.json().catch(() => ({}));
          if (!r.ok) return json({ error: `Asaas respondeu ${r.status}`, detalhe: c }, 502);
          const lista = (c?.data ?? []) as Record<string, unknown>[];
          encontrados.push(...lista);
          if (!c?.hasMore) break;
          offset += 100;
        }
      }

      const clientes = new Map<string, Record<string, unknown>>();
      let processados = 0;
      const falhas: string[] = [];

      for (const p of encontrados) {
        const clienteId = p.customer ? String(p.customer) : null;
        if (clienteId && !clientes.has(clienteId)) {
          const rc = await fetch(`${ASAAS_BASE}/customers/${clienteId}`, { headers: cabecalhos });
          clientes.set(clienteId, rc.ok ? await rc.json().catch(() => ({})) : {});
        }
        const cliente = clienteId ? clientes.get(clienteId) ?? {} : {};
        const pagamento = {
          ...p,
          customerCpfCnpj: (cliente as any).cpfCnpj ?? null,
          customerEmail: (cliente as any).email ?? null,
        };

        const envio = await fetch(destinoEsperado, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'asaas-access-token': tokenLocal },
          body: JSON.stringify({
            id: `conciliacao_${p.id}`,
            event: String(p.status) === 'RECEIVED' ? 'PAYMENT_RECEIVED' : 'PAYMENT_CONFIRMED',
            payment: pagamento,
          }),
        });
        if (envio.ok) processados++;
        else falhas.push(`${p.id}: ${envio.status}`);
      }

      return json({
        destinoEsperado,
        encontrados: encontrados.length,
        processados,
        falhas,
        apontandoParaCa: brutos.some((w) => w.url === destinoEsperado && w.enabled !== false),
        webhooks: brutos.map(resumo),
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
