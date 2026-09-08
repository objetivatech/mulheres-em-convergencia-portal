// Cobrança única do portal novo: assinatura de plano ou inscrição em evento.
// O acesso NUNCA é concedido aqui — quem concede é o webhook do Asaas, a partir
// do pagamento confirmado (Núcleo de Acesso).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { z } from 'https://esm.sh/zod@3.25.76';
import { corsHeaders } from '../_shared/cors.ts';

const ASAAS_BASE = 'https://api.asaas.com/v3';

const Corpo = z.object({
  tipo: z.enum(['plano', 'evento']),
  slug: z.string().min(1).max(120),
  nome: z.string().trim().min(2).max(160),
  cpf: z.string().transform((v) => v.replace(/\D/g, '')).refine((v) => v.length === 11, 'CPF inválido'),
  telefone: z.string().optional(),
  cupom: z.string().trim().max(40).optional(),
  metodo: z.enum(['PIX', 'BOLETO', 'CREDIT_CARD', 'UNDEFINED']).default('UNDEFINED'),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('ASAAS_API_KEY');
    if (!apiKey) return json({ error: 'Pagamento indisponível no momento.' }, 500);

    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Faça login para continuar.' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );
    const comoUsuaria = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );

    const { data: auth } = await comoUsuaria.auth.getUser();
    const user = auth?.user;
    if (!user) return json({ error: 'Sessão expirada. Entre novamente.' }, 401);

    const parsed = Corpo.safeParse(await req.json());
    if (!parsed.success) return json({ error: 'Dados incompletos ou inválidos.' }, 400);
    const { tipo, slug, nome, cpf, telefone, cupom, metodo } = parsed.data;

    // Pessoa (CPF é o identificador central)
    const { data: pessoaId, error: erroPessoa } = await comoUsuaria.rpc('garantir_pessoa', {
      _nome: nome,
      _cpf: cpf,
      _email: user.email,
    });
    if (erroPessoa || !pessoaId) return json({ error: 'Não foi possível identificar seu cadastro.' }, 400);

    // O que está sendo comprado
    let descricao = '';
    let valorCentavos = 0;
    let referencia = '';
    let evento: { id: string; titulo: string; gratuito: boolean } | null = null;
    let loteId: string | null = null;

    if (tipo === 'plano') {
      const { data: plano } = await admin
        .from('planos')
        .select('id, nome, slug, valor_centavos, periodicidade, tipo')
        .eq('slug', slug)
        .eq('ativo', true)
        .maybeSingle();
      if (!plano) return json({ error: 'Plano não encontrado.' }, 404);
      valorCentavos = plano.valor_centavos;
      descricao = `Plano ${plano.nome} (${plano.periodicidade}) — ${plano.tipo}`;
      referencia = `plano:${plano.slug}`;
    } else {
      const { data: ev } = await admin
        .from('eventos')
        .select('id, titulo, slug, gratuito, publicado')
        .eq('slug', slug)
        .maybeSingle();
      if (!ev || !ev.publicado) return json({ error: 'Evento não encontrado.' }, 404);
      evento = { id: ev.id, titulo: ev.titulo, gratuito: ev.gratuito };

      const { data: vagas } = await admin
        .from('v_evento_vagas')
        .select('disponiveis')
        .eq('evento_id', ev.id)
        .maybeSingle();
      if (vagas && vagas.disponiveis !== null && Number(vagas.disponiveis) <= 0) {
        return json({ error: 'As vagas deste evento já foram preenchidas.' }, 409);
      }

      const { data: lote } = await admin.rpc('lote_vigente', { _evento_id: ev.id });
      loteId = (lote as string | null) ?? null;
      if (loteId) {
        const { data: dadosLote } = await admin
          .from('evento_lotes')
          .select('valor_centavos')
          .eq('id', loteId)
          .maybeSingle();
        valorCentavos = dadosLote?.valor_centavos ?? 0;
      }
      descricao = `Ingresso do evento ${ev.titulo}`;
      referencia = `evento:${ev.slug}`;
    }

    // Cupom (somente eventos) — validado sempre no servidor
    let cupomId: string | null = null;
    if (cupom && tipo === 'evento' && evento) {
      const { data: c } = await admin
        .from('evento_cupons')
        .select('id, desconto_tipo, desconto_valor, limite_uso, valido_ate, ativo, evento_id')
        .ilike('codigo', cupom)
        .maybeSingle();
      const valido =
        c && c.ativo &&
        (!c.evento_id || c.evento_id === evento.id) &&
        (!c.valido_ate || new Date(c.valido_ate) > new Date());
      if (!valido) return json({ error: 'Cupom inválido ou expirado.' }, 400);
      if (c!.limite_uso !== null) {
        const { count } = await admin
          .from('evento_inscricoes')
          .select('id', { count: 'exact', head: true })
          .eq('cupom_id', c!.id)
          .neq('situacao', 'cancelada');
        if ((count ?? 0) >= c!.limite_uso!) return json({ error: 'Cupom esgotado.' }, 400);
      }
      cupomId = c!.id;
      valorCentavos = c!.desconto_tipo === 'percentual'
        ? Math.max(0, Math.round(valorCentavos * (1 - c!.desconto_valor / 100)))
        : Math.max(0, valorCentavos - c!.desconto_valor);
    }

    // Evento gratuito: inscrição imediata, sem cobrança
    if (tipo === 'evento' && evento && valorCentavos <= 0) {
      const { error: erroInscricao } = await admin.from('evento_inscricoes').upsert(
        {
          evento_id: evento.id,
          lote_id: loteId,
          pessoa_id: pessoaId,
          cupom_id: cupomId,
          nome,
          email: user.email!,
          telefone: telefone ?? null,
          valor_centavos: 0,
          situacao: 'confirmada',
        },
        { onConflict: 'evento_id,pessoa_id' },
      );
      if (erroInscricao) throw erroInscricao;
      return json({ gratuito: true, inscrita: true });
    }

    if (valorCentavos <= 0) return json({ error: 'Valor inválido para cobrança.' }, 400);

    // Cliente no Asaas (reaproveita por CPF)
    const cabecalhos = { 'Content-Type': 'application/json', access_token: apiKey };
    const busca = await fetch(`${ASAAS_BASE}/customers?cpfCnpj=${cpf}`, { headers: cabecalhos });
    const encontrados = await busca.json();
    let clienteId: string | undefined = encontrados?.data?.[0]?.id;

    if (!clienteId) {
      const criado = await fetch(`${ASAAS_BASE}/customers`, {
        method: 'POST',
        headers: cabecalhos,
        body: JSON.stringify({
          name: nome,
          cpfCnpj: cpf,
          email: user.email,
          mobilePhone: (telefone ?? '').replace(/\D/g, '') || undefined,
        }),
      });
      const dados = await criado.json();
      if (!criado.ok) {
        console.error('asaas customer', dados);
        return json({ error: dados?.errors?.[0]?.description ?? 'Erro ao criar cadastro de cobrança.' }, 400);
      }
      clienteId = dados.id;
    }

    const vencimento = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const respostaCobranca = await fetch(`${ASAAS_BASE}/payments`, {
      method: 'POST',
      headers: cabecalhos,
      body: JSON.stringify({
        customer: clienteId,
        billingType: metodo,
        value: Number((valorCentavos / 100).toFixed(2)),
        dueDate: vencimento,
        description: descricao,
        externalReference: referencia,
      }),
    });
    const cobranca = await respostaCobranca.json();
    if (!respostaCobranca.ok) {
      console.error('asaas payment', cobranca);
      return json({ error: cobranca?.errors?.[0]?.description ?? 'Erro ao gerar a cobrança.' }, 400);
    }

    // Fato financeiro registrado no portal (o acesso vem pelo webhook)
    const { data: pagamento } = await admin
      .from('pagamentos')
      .upsert(
        {
          pessoa_id: pessoaId,
          provedor: 'asaas',
          cobranca_externa_id: cobranca.id,
          cliente_externo_id: clienteId,
          referencia_externa: referencia,
          descricao,
          valor_centavos: valorCentavos,
          situacao: 'pendente',
          vencimento_em: vencimento,
          dados_brutos: cobranca,
        },
        { onConflict: 'cobranca_externa_id' },
      )
      .select('id')
      .maybeSingle();

    if (tipo === 'evento' && evento) {
      await admin.from('evento_inscricoes').upsert(
        {
          evento_id: evento.id,
          lote_id: loteId,
          pessoa_id: pessoaId,
          cupom_id: cupomId,
          nome,
          email: user.email!,
          telefone: telefone ?? null,
          valor_centavos: valorCentavos,
          situacao: 'pendente',
          pagamento_id: pagamento?.id ?? null,
        },
        { onConflict: 'evento_id,pessoa_id' },
      );
    }

    return json({
      cobranca_id: cobranca.id,
      valor_centavos: valorCentavos,
      link: cobranca.invoiceUrl ?? cobranca.bankSlipUrl ?? null,
    });
  } catch (e) {
    console.error('[CRIAR-COBRANCA]', e);
    return json({ error: 'Não foi possível iniciar o pagamento. Tente novamente.' }, 500);
  }
});
