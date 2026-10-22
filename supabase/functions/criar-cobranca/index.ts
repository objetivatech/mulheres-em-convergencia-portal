// Cobrança única do portal novo: assinatura de plano ou inscrição em evento.
// O acesso NUNCA é concedido aqui — quem concede é o webhook do Asaas, a partir
// do pagamento confirmado (Núcleo de Acesso).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { z } from 'https://esm.sh/zod@3.25.76';
import { corsHeaders } from '../_shared/cors.ts';
import { enviarEmail } from '../_shared/enviar-email.ts';
import { modeloInscricaoEvento } from '../_shared/notificacoes.ts';

const ASAAS_BASE = 'https://api.asaas.com/v3';

const Corpo = z.object({
  tipo: z.enum(['plano', 'evento']),
  slug: z.string().min(1).max(120),
  nome: z.string().trim().min(2).max(160),
  cpf: z.string().transform((v) => v.replace(/\D/g, '')).refine((v) => v.length === 11, 'CPF inválido'),
  telefone: z.string().optional(),
  cupom: z.string().trim().max(40).optional(),
  codigo: z.string().trim().max(60).optional(),
  metodo: z.enum(['PIX', 'BOLETO', 'CREDIT_CARD', 'UNDEFINED']).default('UNDEFINED'),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  let cancelarReserva: (() => Promise<void>) | null = null;
  let cobrancaCriada = false;

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
    if (!user?.email) return json({ error: 'Sessão expirada. Entre novamente.' }, 401);

    const parsed = Corpo.safeParse(await req.json());
    if (!parsed.success) return json({ error: 'Dados incompletos ou inválidos.' }, 400);
    const { tipo, slug, nome, cpf, telefone, cupom, codigo, metodo } = parsed.data;

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
    let evento: {
      id: string; titulo: string; gratuito: boolean;
      inicio_em?: string | null; online?: boolean; local_nome?: string | null;
      cidade?: string | null; uf?: string | null; link_online?: string | null;
    } | null = null;
    let loteId: string | null = null;
    let planoId: string | null = null;

    if (tipo === 'plano') {
      const { data: plano } = await admin
        .from('planos')
        .select('id, nome, slug, valor_centavos, periodicidade, tipo, visibilidade, codigo_oferta, oferta_validade, oferta_limite_usos')
        .eq('slug', slug)
        .eq('ativo', true)
        .maybeSingle();
      if (!plano) return json({ error: 'Plano não encontrado.' }, 404);

      // Ofertas privadas exigem código válido, dentro da validade e do limite de usos.
      if (plano.visibilidade === 'privado') {
        const informado = (codigo ?? '').trim().toLowerCase();
        const esperado = (plano.codigo_oferta ?? '').trim().toLowerCase();
        if (!esperado || informado !== esperado) {
          return json({ error: 'Esta oferta é por convite. Confira o código recebido.' }, 403);
        }
        if (plano.oferta_validade && new Date(plano.oferta_validade) < new Date()) {
          return json({ error: 'Esta oferta expirou.' }, 410);
        }
        if (plano.oferta_limite_usos !== null && plano.oferta_limite_usos !== undefined) {
          const { count } = await admin
            .from('pagamentos')
            .select('id', { count: 'exact', head: true })
            .eq('plano_id', plano.id)
            .eq('situacao', 'confirmado');
          if ((count ?? 0) >= plano.oferta_limite_usos) {
            return json({ error: 'Esta oferta já atingiu o limite de participantes.' }, 409);
          }
        }
      }

      planoId = plano.id;
      valorCentavos = plano.valor_centavos;
      descricao = `Plano ${plano.nome} (${plano.periodicidade}) — ${plano.tipo}`;
      referencia = `plano:${plano.slug}`;
    } else {
      const { data: ev } = await admin
        .from('eventos')
        .select('id, titulo, slug, gratuito, publicado, inicio_em, online, local_nome, cidade, uf, link_online')
        .eq('slug', slug)
        .maybeSingle();
      if (!ev || !ev.publicado) return json({ error: 'Evento não encontrado.' }, 404);
      if (new Date(ev.inicio_em).getTime() <= Date.now()) return json({ error: 'As inscrições deste encontro estão encerradas.' }, 409);
      evento = ev;

      // Não sobrescreve uma vaga confirmada nem cria duas cobranças para a mesma pessoa.
      const { data: existente } = await admin.from('evento_inscricoes').select('id,situacao,pagamento_id').eq('evento_id', ev.id).eq('pessoa_id', pessoaId).maybeSingle();
      if (existente?.situacao === 'confirmada') return json({ gratuito: true, inscrita: true });
      if (existente?.situacao === 'pendente') {
        if (existente.pagamento_id) {
          const { data: pg } = await admin.from('pagamentos').select('cobranca_externa_id,valor_centavos,dados_brutos').eq('id', existente.pagamento_id).maybeSingle();
          const link = pg?.dados_brutos?.invoiceUrl ?? pg?.dados_brutos?.bankSlipUrl;
          if (link) return json({ cobranca_id: pg.cobranca_externa_id, valor_centavos: pg.valor_centavos, link });
        }
        return json({ error: 'Sua reserva está sendo processada. Aguarde um instante e tente novamente.' }, 409);
      }

      const { data: vagas, error: erroVagas } = await admin
        .from('v_evento_vagas')
        .select('livres_para_reserva')
        .eq('evento_id', ev.id)
        .maybeSingle();
      if (erroVagas) throw erroVagas;
      if (vagas && vagas.livres_para_reserva !== null && Number(vagas.livres_para_reserva) <= 0) {
        return json({ error: 'As vagas deste evento já foram preenchidas.' }, 409);
      }

      const { data: lote, error: erroLote } = await admin.rpc('lote_vigente', { _evento_id: ev.id });
      if (erroLote) throw erroLote;
      loteId = (lote as string | null) ?? null;
      if (!ev.gratuito && !loteId) return json({ error: 'Não há lote de ingressos disponível no momento.' }, 409);
      if (loteId) {
        const { data: dadosLote } = await admin
          .from('evento_lotes')
          .select('valor_centavos')
          .eq('id', loteId)
          .maybeSingle();
        valorCentavos = dadosLote?.valor_centavos ?? 0;
      }
      if (ev.gratuito) valorCentavos = 0;
      descricao = `Ingresso do evento ${ev.titulo}`;
      referencia = `evento:${ev.slug}`;
    }

    // Desconto de assinante (definido no plano) — só em encontros pagos
    if (tipo === 'evento' && evento && valorCentavos > 0) {
      const { data: pct } = await admin.rpc('desconto_evento_assinante', { _pessoa_id: pessoaId });
      const p = Number(pct ?? 0);
      if (p > 0) {
        valorCentavos = Math.max(0, Math.round(valorCentavos * (1 - p / 100)));
        descricao += ` (desconto assinante ${p}%)`;
      }
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
      if (!valido || !c) return json({ error: 'Cupom inválido ou expirado.' }, 400);
      if (c.limite_uso !== null) {
        const { count } = await admin
          .from('evento_inscricoes')
          .select('id', { count: 'exact', head: true })
          .eq('cupom_id', c.id)
          .neq('situacao', 'cancelada');
        if ((count ?? 0) >= c.limite_uso) return json({ error: 'Cupom esgotado.' }, 400);
      }
      cupomId = c.id;
      valorCentavos = c.desconto_tipo === 'percentual'
        ? Math.max(0, Math.round(valorCentavos * (1 - c.desconto_valor / 100)))
        : Math.max(0, valorCentavos - c.desconto_valor);
    }

    // Evento gratuito: inscrição imediata, sem cobrança
    if (tipo === 'evento' && evento && valorCentavos <= 0) {
      // Degustação: quem não assina tem direito a 1 encontro gratuito (por CPF).
      const [{ data: concessoes }, { data: adminPapel }, { data: jaUsou }] = await Promise.all([
        admin.from('concessoes_acesso').select('id, fim_em').eq('pessoa_id', pessoaId)
          .is('revogado_em', null).lte('inicio_em', new Date().toISOString()),
        admin.from('papeis').select('id').eq('pessoa_id', pessoaId).eq('papel', 'admin').maybeSingle(),
        admin.rpc('ja_usou_evento_gratuito', { _pessoa_id: pessoaId, _evento_id: evento.id }),
      ]);
      const assinante = (concessoes ?? []).some((c: any) => !c.fim_em || new Date(c.fim_em) > new Date());
      if (!assinante && !adminPapel && jaUsou === true) {
        return json({
          codigo: 'limite_gratuito',
          error: 'Você já participou de um encontro gratuito. Assine um plano para continuar participando.',
        }, 200);
      }
      const { data: inscricao, error: erroInscricao } = await admin.from('evento_inscricoes').upsert(
        {
          evento_id: evento.id,
          lote_id: loteId,
          pessoa_id: pessoaId,
          cupom_id: cupomId,
          nome,
          email: user.email,
          telefone: telefone ?? null,
          valor_centavos: 0,
          situacao: 'confirmada',
        },
        { onConflict: 'evento_id,pessoa_id' },
      ).select('id').maybeSingle();
      if (erroInscricao) throw erroInscricao;

      // Confirmação por e-mail (falha aqui nunca desfaz a inscrição)
      try {
        await enviarEmail(
          { email: user.email, nome },
          `Inscrição confirmada: ${evento.titulo}`,
          modeloInscricaoEvento({
            nome, titulo: evento.titulo, inicioEm: evento.inicio_em, online: evento.online,
            localNome: evento.local_nome, cidade: evento.cidade, uf: evento.uf,
            linkOnline: evento.link_online, inscricaoId: inscricao?.id ?? null,
          }),
        );
        if (inscricao?.id) {
          await admin.from('evento_inscricoes')
            .update({ confirmacao_enviada_em: new Date().toISOString() })
            .eq('id', inscricao.id);
        }
      } catch (e) {
        console.error('[CRIAR-COBRANCA] e-mail de inscrição falhou', e);
      }
      return json({ gratuito: true, inscrita: true });
    }

    if (valorCentavos <= 0) return json({ error: 'Valor inválido para cobrança.' }, 400);
    if (valorCentavos < 500) {
      return json(
        { error: 'O valor mínimo aceito pelo meio de pagamento é R$ 5,00. Ajuste o valor desta oferta no painel.' },
        400,
      );
    }

    // Cliente no Asaas (reaproveita por CPF)
    let reservaId: string | null = null;
    if (tipo === 'evento' && evento) {
      const { data: reserva, error } = await admin.rpc('reservar_ingresso_evento', {
        _evento_id: evento.id, _pessoa_id: pessoaId, _lote_id: loteId, _cupom_id: cupomId,
        _nome: nome, _email: user.email, _telefone: telefone ?? null, _valor_centavos: valorCentavos,
      });
      if (error) return json({ error: 'Não foi possível reservar sua vaga. Confira a disponibilidade do encontro.' }, 409);
      reservaId = reserva;
      cancelarReserva = async () => { await admin.from('evento_inscricoes').update({ situacao: 'cancelada' }).eq('id', reserva).eq('situacao', 'pendente').is('pagamento_id', null); };
    }
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
        if (cancelarReserva) await cancelarReserva();
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
      if (cancelarReserva) await cancelarReserva();
      console.error('asaas payment', cobranca);
      return json({ error: cobranca?.errors?.[0]?.description ?? 'Erro ao gerar a cobrança.' }, 400);
    }
    cobrancaCriada = true;

    // Fato financeiro registrado no portal (o acesso vem pelo webhook)
    const { data: pagamento, error: erroPagamento } = await admin
      .from('pagamentos')
      .upsert(
        {
          pessoa_id: pessoaId,
          plano_id: planoId,
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
    if (erroPagamento || !pagamento) throw erroPagamento ?? new Error('Pagamento não registrado');

    if (reservaId) {
      const { error } = await admin.from('evento_inscricoes').update({ pagamento_id: pagamento.id }).eq('id', reservaId);
      if (error) throw error;
    }

    return json({
      cobranca_id: cobranca.id,
      valor_centavos: valorCentavos,
      link: cobranca.invoiceUrl ?? cobranca.bankSlipUrl ?? null,
    });
  } catch (e) {
    if (cancelarReserva && !cobrancaCriada) await cancelarReserva();
    console.error('[CRIAR-COBRANCA]', e);
    return json({ error: 'Não foi possível iniciar o pagamento. Tente novamente.' }, 500);
  }
});
