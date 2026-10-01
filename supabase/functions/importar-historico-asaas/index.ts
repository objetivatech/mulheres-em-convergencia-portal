// ============================================================================
// importar-historico-asaas — traz o histórico financeiro do Asaas para o portal
// ============================================================================
// Somente administradoras. Lê as assinaturas e cobranças já existentes na
// conta do Asaas e grava em public.pagamentos as que pertencem ao Portal MeC.
//
// Regras duras:
//  - NÃO envia e-mail nenhum (não chama nenhuma função de notificação);
//  - NÃO cria nem altera concessões de acesso (histórico é só extrato);
//  - NÃO importa cobranças da Escola MeC (conta compartilhada);
//  - é idempotente: rodar duas vezes não duplica (chave provedor+cobrança).
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';
import { requireAdminOrCron } from '../_shared/auth.ts';

const ASAAS_BASE = 'https://api.asaas.com/v3';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const digitos = (v: unknown) => String(v ?? '').replace(/\D/g, '') || null;

// Descrições que caracterizam produto do Portal MeC.
const TEXTO_PORTAL =
  /assinatura\s+plano|plano\s+(iniciante|intermedi|avan|full)|iniciantes?\s*-\s*mensal|mulheres em converg|diret[oó]rio|conecta\+?|academy|encontro|evento/i;

// Descrições que caracterizam a Escola MeC / serviços avulsos.
const TEXTO_FORA =
  /pix recebido|nota fiscal|ref\.?\s*nf|redes sociais|mentoria|consultoria/i;

function ehDoPortal(p: Record<string, unknown>, assinaturasPortal: Set<string>): boolean {
  const ref = String(p.externalReference ?? '');
  if (/^(plano|evento|pessoa):/i.test(ref)) return true;
  const sub = p.subscription ? String(p.subscription) : null;
  if (sub && assinaturasPortal.has(sub)) return true;
  const desc = String(p.description ?? '');
  if (TEXTO_FORA.test(desc)) return false;
  return TEXTO_PORTAL.test(desc);
}

const CONFIRMADOS = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']);
const ESTORNADOS = new Set(['REFUNDED', 'REFUND_REQUESTED', 'CHARGEBACK_REQUESTED', 'CHARGEBACK_DISPUTE']);
const CANCELADOS = new Set(['DELETED', 'CANCELED']);

function situacaoPor(status: string) {
  if (CONFIRMADOS.has(status)) return 'confirmado';
  if (ESTORNADOS.has(status)) return 'estornado';
  if (CANCELADOS.has(status)) return 'cancelado';
  return 'pendente';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const auth = await requireAdminOrCron(req);
  if ('error' in auth) return auth.error;

  const apiKey = Deno.env.get('ASAAS_API_KEY');
  if (!apiKey) return json({ error: 'ASAAS_API_KEY não configurada' }, 500);
  const cabecalhos = { access_token: apiKey, 'Content-Type': 'application/json' };

  let simular = false;
  let criarPessoas = true;
  try {
    const corpo = await req.json();
    if (corpo?.simular === true) simular = true;
    if (corpo?.criarPessoas === false) criarPessoas = false;
  } catch {
    /* sem corpo: importação real */
  }

  async function paginar(caminho: string): Promise<Record<string, unknown>[]> {
    const itens: Record<string, unknown>[] = [];
    let offset = 0;
    for (;;) {
      const sep = caminho.includes('?') ? '&' : '?';
      const r = await fetch(`${ASAAS_BASE}${caminho}${sep}limit=100&offset=${offset}`, {
        headers: cabecalhos,
      });
      const c = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(`Asaas respondeu ${r.status} em ${caminho}`);
      itens.push(...((c?.data ?? []) as Record<string, unknown>[]));
      if (!c?.hasMore) break;
      offset += 100;
      if (offset > 5000) break; // trava de segurança
    }
    return itens;
  }

  try {
    // ----------------------------------------------------------------
    // 1. Assinaturas: separa as do Portal das da Escola
    // ----------------------------------------------------------------
    const assinaturas = await paginar('/subscriptions');
    const assinaturasPortal = new Set<string>();
    for (const s of assinaturas) {
      const desc = String(s.description ?? '');
      const ref = String(s.externalReference ?? '');
      if (/^plano:/i.test(ref) || (!TEXTO_FORA.test(desc) && TEXTO_PORTAL.test(desc))) {
        assinaturasPortal.add(String(s.id));
      }
    }

    // ----------------------------------------------------------------
    // 2. Cobranças: as de cada assinatura do Portal + todas as avulsas
    // ----------------------------------------------------------------
    const porId = new Map<string, Record<string, unknown>>();

    for (const subId of assinaturasPortal) {
      const lista = await paginar(`/subscriptions/${subId}/payments`);
      for (const p of lista) porId.set(String(p.id), p);
    }

    const todas = await paginar('/payments');
    for (const p of todas) {
      if (ehDoPortal(p, assinaturasPortal)) porId.set(String(p.id), p);
    }

    const cobrancas = [...porId.values()];

    // ----------------------------------------------------------------
    // 3. Planos do portal, para classificar o faturamento por produto
    // ----------------------------------------------------------------
    const { data: planos } = await supabase.from('planos').select('id, slug, nome');
    const planoPorSlug = new Map((planos ?? []).map((p) => [String(p.slug).toLowerCase(), p.id]));
    const planosPorNome = (planos ?? []).map((p) => ({ id: p.id, nome: String(p.nome).toLowerCase() }));

    function planoDe(p: Record<string, unknown>): string | null {
      const ref = String(p.externalReference ?? '');
      const m = ref.match(/^plano:(.+)$/i);
      if (m) return planoPorSlug.get(m[1].toLowerCase()) ?? null;
      const desc = String(p.description ?? '').toLowerCase();
      const achado = planosPorNome.find((pl) => pl.nome.length > 4 && desc.includes(pl.nome));
      return achado?.id ?? null;
    }

    // ----------------------------------------------------------------
    // 4. Clientes do Asaas (CPF, nome, e-mail) — com cache
    // ----------------------------------------------------------------
    const clientes = new Map<string, Record<string, unknown>>();
    async function cliente(id: string | null) {
      if (!id) return {} as Record<string, unknown>;
      if (!clientes.has(id)) {
        const r = await fetch(`${ASAAS_BASE}/customers/${id}`, { headers: cabecalhos });
        clientes.set(id, r.ok ? await r.json().catch(() => ({})) : {});
      }
      return clientes.get(id)!;
    }

    const pessoaPorCliente = new Map<string, string | null>();

    async function pessoaDe(clienteId: string | null): Promise<string | null> {
      if (!clienteId) return null;
      if (pessoaPorCliente.has(clienteId)) return pessoaPorCliente.get(clienteId)!;

      const c = await cliente(clienteId);
      const cpf = digitos((c as any).cpfCnpj);
      const email = String((c as any).email ?? '').trim() || null;
      const nome = String((c as any).name ?? '').trim() || null;
      let pessoaId: string | null = null;

      if (cpf && cpf.length === 11) {
        const { data } = await supabase.from('pessoas').select('id').eq('cpf', cpf).maybeSingle();
        if (data) pessoaId = data.id;
      }
      if (!pessoaId && email) {
        const { data } = await supabase
          .from('pessoa_contatos')
          .select('pessoa_id')
          .eq('tipo', 'email')
          .eq('valor', email)
          .limit(1)
          .maybeSingle();
        if (data?.pessoa_id) pessoaId = data.pessoa_id;
      }
      if (!pessoaId && criarPessoas && !simular && (cpf || email) && nome) {
        const { data, error } = await supabase
          .from('pessoas')
          .insert({ nome, cpf: cpf && cpf.length === 11 ? cpf : null })
          .select('id')
          .single();
        if (!error && data) {
          pessoaId = data.id;
          if (email) {
            await supabase
              .from('pessoa_contatos')
              .insert({ pessoa_id: pessoaId, tipo: 'email', valor: email, principal: true });
          }
        }
      }

      pessoaPorCliente.set(clienteId, pessoaId);
      return pessoaId;
    }

    // ----------------------------------------------------------------
    // 5. Gravação idempotente em public.pagamentos
    // ----------------------------------------------------------------
    let gravados = 0;
    let semPessoa = 0;
    let pessoasCriadas = 0;
    const antesPessoas = new Set(pessoaPorCliente.keys());
    const falhas: string[] = [];
    let somaConfirmada = 0;

    for (const p of cobrancas) {
      const clienteId = p.customer ? String(p.customer) : null;
      const pessoaId = await pessoaDe(clienteId);
      if (!pessoaId) semPessoa++;

      const status = String(p.status ?? '');
      const situacao = situacaoPor(status);
      const valor = Math.round(Number(p.value ?? 0) * 100);
      if (situacao === 'confirmado') somaConfirmada += valor;

      if (simular) continue;

      const c = await cliente(clienteId);
      const linha = {
        provedor: 'asaas',
        cobranca_externa_id: String(p.id),
        assinatura_externa_id: p.subscription ? String(p.subscription) : null,
        cliente_externo_id: clienteId,
        referencia_externa: p.externalReference ? String(p.externalReference) : null,
        descricao: p.description ? String(p.description) : null,
        valor_centavos: Number.isFinite(valor) ? valor : 0,
        situacao,
        vencimento_em: (p as any).dueDate ?? null,
        confirmado_em:
          situacao === 'confirmado'
            ? new Date(
                String((p as any).paymentDate ?? (p as any).clientPaymentDate ?? (p as any).dateCreated),
              ).toISOString()
            : null,
        criado_em: (p as any).dateCreated
          ? new Date(String((p as any).dateCreated)).toISOString()
          : undefined,
        plano_id: planoDe(p),
        pessoa_id: pessoaId,
        dados_brutos: {
          ...p,
          customerCpfCnpj: (c as any).cpfCnpj ?? null,
          customerEmail: (c as any).email ?? null,
          importado_em: new Date().toISOString(),
          origem_importacao: 'historico-asaas',
        },
      };

      const { error } = await supabase
        .from('pagamentos')
        .upsert(linha, { onConflict: 'provedor,cobranca_externa_id' });

      if (error) falhas.push(`${p.id}: ${error.message}`);
      else gravados++;
    }

    pessoasCriadas = [...pessoaPorCliente.keys()].filter((k) => !antesPessoas.has(k)).length;

    return json({
      simulacao: simular,
      assinaturasNoAsaas: assinaturas.length,
      assinaturasDoPortal: assinaturasPortal.size,
      cobrancasDoPortal: cobrancas.length,
      gravados,
      semPessoaIdentificada: semPessoa,
      clientesConsultados: pessoasCriadas,
      totalConfirmadoCentavos: somaConfirmada,
      falhas,
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
