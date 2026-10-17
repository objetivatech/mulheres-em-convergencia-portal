// ============================================================================
// asaas-webhook — VERSÃO DE ARQUIVO ÚNICO (para colar no painel do Supabase)
// ============================================================================
// Conteúdo idêntico às 5 peças de reboot/functions/asaas-webhook/, juntadas
// em um só arquivo porque o editor do painel não aceita imports locais.
// Destino: projeto NOVO (tysvpeprhokdijquprkd). Não implantar no antigo.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { identificarPorClienteAsaas, liberarPorPagamento } from "../_shared/acessos-asaas.ts";
import { enviarEmail } from "../_shared/enviar-email.ts";
import {
  emailDePessoa,
  modeloBoasVindasPlano,
  modeloIndicacaoEmbaixadora,
  modeloInscricaoEvento,
} from "../_shared/notificacoes.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

// ---------------------------------------------------------------------------
// Peça 2 de 6: IDENTIFICAR PESSOA
// Ordem: CPF → referência externa → cliente Asaas → e-mail.
// Nunca cria pessoa "fantasma": se não identificar, devolve null e o
// pagamento é registrado mesmo assim, para conciliação manual no painel.
// ---------------------------------------------------------------------------
const digitos = (v: unknown) => String(v ?? "").replace(/\D/g, "") || null;

async function identificarPessoa(
  pagamento: Record<string, unknown>,
): Promise<string | null> {
  const cpf = digitos((pagamento.customerCpfCnpj ?? (pagamento as any).cpfCnpj));
  if (cpf && cpf.length === 11) {
    const { data } = await supabase.from("pessoas").select("id").eq("cpf", cpf).maybeSingle();
    if (data) return data.id;
  }

  // externalReference no formato "pessoa:<uuid>"
  const ref = String(pagamento.externalReference ?? "");
  const m = ref.match(/^pessoa:([0-9a-f-]{36})$/i);
  if (m) {
    const { data } = await supabase.from("pessoas").select("id").eq("id", m[1]).maybeSingle();
    if (data) return data.id;
  }

  const clienteId = pagamento.customer ? String(pagamento.customer) : null;
  if (clienteId) {
    const { data } = await supabase
      .from("pagamentos")
      .select("pessoa_id")
      .eq("cliente_externo_id", clienteId)
      .not("pessoa_id", "is", null)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.pessoa_id) return data.pessoa_id;
  }

  const email = (pagamento as any).customerEmail ?? null;
  if (email) {
    const { data } = await supabase
      .from("pessoa_contatos")
      .select("pessoa_id")
      .eq("tipo", "email")
      .eq("valor", String(email))
      .limit(1)
      .maybeSingle();
    if (data?.pessoa_id) return data.pessoa_id;
  }

  // O aviso do Asaas traz só o código do cliente: busca CPF/e-mail na API.
  return await identificarPorClienteAsaas(supabase, clienteId);
}

// ---------------------------------------------------------------------------
// Peça 3 de 6: REGISTRAR PAGAMENTO
// Grava o fato financeiro. Idempotente pela chave (provedor, cobrança).
// ---------------------------------------------------------------------------
const CONFIRMADOS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_RECEIVED_IN_CASH"]);
const ESTORNADOS = new Set(["PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED"]);
const CANCELADOS = new Set(["PAYMENT_DELETED", "PAYMENT_CANCELED"]);

function situacaoPor(tipoEvento: string) {
  if (CONFIRMADOS.has(tipoEvento)) return "confirmado";
  if (ESTORNADOS.has(tipoEvento)) return "estornado";
  if (CANCELADOS.has(tipoEvento)) return "cancelado";
  return "pendente";
}

async function registrarPagamento(
  tipoEvento: string,
  pagamento: Record<string, unknown>,
  pessoaId: string | null,
): Promise<string | null> {
  const cobrancaId = pagamento.id ? String(pagamento.id) : null;
  if (!cobrancaId) return null;

  const situacao = situacaoPor(tipoEvento);
  const valor = Math.round(Number(pagamento.value ?? 0) * 100);
  const confirmadoEm = situacao === "confirmado"
    ? new Date(
        String(
          (pagamento as any).paymentDate ??
            (pagamento as any).clientPaymentDate ??
            new Date().toISOString(),
        ),
      ).toISOString()
    : null;

  const linha = {
    provedor: "asaas",
    cobranca_externa_id: cobrancaId,
    assinatura_externa_id: pagamento.subscription ? String(pagamento.subscription) : null,
    cliente_externo_id: pagamento.customer ? String(pagamento.customer) : null,
    referencia_externa: pagamento.externalReference ? String(pagamento.externalReference) : null,
    descricao: pagamento.description ? String(pagamento.description) : null,
    valor_centavos: Number.isFinite(valor) ? valor : 0,
    situacao,
    vencimento_em: (pagamento as any).dueDate ?? null,
    confirmado_em: confirmadoEm,
    dados_brutos: pagamento,
    ...(pessoaId ? { pessoa_id: pessoaId } : {}),
  };

  const { data, error } = await supabase
    .from("pagamentos")
    .upsert(linha, { onConflict: "provedor,cobranca_externa_id" })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

// ---------------------------------------------------------------------------
// Peça 4 de 6: CONCEDER ACESSO
// Todo pagamento confirmado cria uma concessão a partir do dia da confirmação.
// Pagamento em atraso deixa de ser caso especial: não existe estado
// "desativado" para desfazer (casos Luciana e Paola).
// ---------------------------------------------------------------------------
async function concederAcesso(pagamentoId: string): Promise<string | null> {
  const r = await liberarPorPagamento(supabase, pagamentoId);
  return r ? `${r.concessoes}:${r.tipos.join(",")}` : null;
}

// ---------------------------------------------------------------------------
// Peça 5 de 6: EFEITOS
// Comissão de embaixadora, e-mail, linha do tempo do CRM.
// Regra dura: qualquer falha aqui é registrada e engolida — o acesso já foi
// concedido e não pode depender de e-mail nem de CRM.
// ---------------------------------------------------------------------------
async function aplicarEfeitos(ctx: {
  pessoaId: string | null;
  pagamentoId: string | null;
  concessaoId: string | null;
  tipoEvento: string;
}) {
  const tarefas: Array<Promise<unknown>> = [];

  // Linha do tempo única do relacionamento (contato_eventos, Fase 6).
  if (ctx.pessoaId) {
    tarefas.push(
      supabase.from("eventos_sistema").insert({
        tipo: "pagamento_processado",
        pessoa_id: ctx.pessoaId,
        dados: ctx,
      }),
    );
  }

  // E-mails transacionais do pagamento confirmado (evento pago, plano, embaixadora)
  if (ctx.pagamentoId && ctx.pessoaId && ctx.concessaoId) {
    tarefas.push(enviarEmailsPagamento(ctx.pagamentoId, ctx.pessoaId));
  }

  const resultados = await Promise.allSettled(tarefas);
  resultados
    .filter((r) => r.status === "rejected")
    .forEach((r) => console.error("efeito falhou", (r as PromiseRejectedResult).reason));
}

async function enviarEmailsPagamento(pagamentoId: string, pessoaId: string) {
  const { data: pag } = await supabase
    .from("pagamentos")
    .select("referencia_externa, valor_centavos")
    .eq("id", pagamentoId)
    .maybeSingle();
  const ref = String(pag?.referencia_externa ?? "");
  const dest = await emailDePessoa(supabase, pessoaId);
  if (!dest) return;

  // Inscrição em evento pago confirmada
  if (ref.startsWith("evento:")) {
    const slug = ref.slice(7);
    const { data: ev } = await supabase
      .from("eventos")
      .select("id, titulo, inicio_em, online, local_nome, cidade, uf, link_online")
      .eq("slug", slug)
      .maybeSingle();
    if (ev) {
      const { data: insc } = await supabase
        .from("evento_inscricoes")
        .select("id, confirmacao_enviada_em")
        .eq("evento_id", ev.id)
        .eq("pessoa_id", pessoaId)
        .maybeSingle();
      if (insc && !insc.confirmacao_enviada_em) {
        await enviarEmail(
          dest,
          `Inscrição confirmada: ${ev.titulo}`,
          modeloInscricaoEvento({
            nome: dest.nome, titulo: ev.titulo, inicioEm: ev.inicio_em, online: ev.online,
            localNome: ev.local_nome, cidade: ev.cidade, uf: ev.uf,
            linkOnline: ev.link_online, inscricaoId: insc.id, pago: true,
          }),
        );
        await supabase.from("evento_inscricoes")
          .update({ confirmacao_enviada_em: new Date().toISOString() })
          .eq("id", insc.id);
      }
    }
  }

  // Boas-vindas de plano
  if (ref.startsWith("plano:")) {
    const slug = ref.slice(6);
    const { data: plano } = await supabase
      .from("planos")
      .select("nome")
      .eq("slug", slug)
      .maybeSingle();
    await enviarEmail(
      dest,
      `Bem-vinda ao plano ${plano?.nome ?? ""}! 💜`,
      modeloBoasVindasPlano({ nome: dest.nome, plano: plano?.nome ?? "contratado" }),
    );
  }

  // Aviso à embaixadora quando o pagamento veio de indicação dela
  const { data: indicacao } = await supabase
    .from("embaixadora_indicacoes")
    .select("id, embaixadora_id, nome")
    .eq("pagamento_id", pagamentoId)
    .maybeSingle();
  if (indicacao) {
    const { data: emb } = await supabase
      .from("embaixadoras")
      .select("pessoa_id")
      .eq("id", indicacao.embaixadora_id)
      .maybeSingle();
    if (emb?.pessoa_id) {
      const destEmb = await emailDePessoa(supabase, emb.pessoa_id);
      if (destEmb) {
        await enviarEmail(
          destEmb,
          "Sua indicação virou conquista! 🎉",
          modeloIndicacaoEmbaixadora({
            nome: destEmb.nome,
            nomeIndicada: indicacao.nome,
            valorReais: pag?.valor_centavos ? (pag.valor_centavos / 100).toFixed(2).replace(".", ",") : null,
          }),
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// PROCESSAR (compartilhado com a function de reprocessar)
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// FILTRO: só movimentos do Portal MeC
// A conta Asaas é compartilhada com a Escola MeC. Cobranças que não nasceram
// no portal são registradas como "ignoradas" e nunca viram pagamento/acesso.
// ---------------------------------------------------------------------------
async function ehDoPortal(pagamento: Record<string, unknown>): Promise<boolean> {
  const ref = String(pagamento.externalReference ?? "");
  if (/^(plano|evento|pessoa):/i.test(ref)) return true;
  const desc = String(pagamento.description ?? "");
  if (/assinatura plano|mulheres em converg|diret[oó]rio|conecta\+?/i.test(desc)) return true;
  const cobrancaId = pagamento.id ? String(pagamento.id) : null;
  if (cobrancaId) {
    const { data } = await supabase.from("pagamentos").select("id")
      .eq("cobranca_externa_id", cobrancaId).maybeSingle();
    if (data) return true;
  }
  return false;
}

async function processar(
  registroId: string,
  tipoEvento: string,
  carga: Record<string, unknown>,
) {
  try {
    const pagamentoAsaas = (carga.payment ?? {}) as Record<string, unknown>;

    if (!(await ehDoPortal(pagamentoAsaas))) {
      await supabase
        .from("webhooks_recebidos")
        .update({ processado_em: new Date().toISOString(), erro: "ignorado: fora do portal" })
        .eq("id", registroId);
      return { ignorado: true };
    }

    const pessoaId = await identificarPessoa(pagamentoAsaas);
    const pagamentoId = await registrarPagamento(tipoEvento, pagamentoAsaas, pessoaId);

    let concessaoId: string | null = null;
    if (pagamentoId) {
      concessaoId = await concederAcesso(pagamentoId);
    }

    // Efeitos nunca bloqueiam o acesso.
    aplicarEfeitos({ pessoaId, pagamentoId, concessaoId, tipoEvento })
      .catch((e) => console.error("efeitos falharam (acesso preservado)", e));

    await supabase
      .from("webhooks_recebidos")
      .update({ processado_em: new Date().toISOString(), erro: null })
      .eq("id", registroId);

    return { pessoaId, pagamentoId, concessaoId };
  } catch (e) {
    console.error("falha ao processar webhook", e);
    await supabase
      .from("webhooks_recebidos")
      .update({ erro: String(e) })
      .eq("id", registroId);
    return { erro: String(e) };
  }
}

// ---------------------------------------------------------------------------
// Peça 1 de 6: RECEBER
// Valida o segredo, registra o evento de forma idempotente e devolve 200
// rápido. Uma falha no processamento nunca faz o Asaas reenviar em loop.
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const token = req.headers.get("asaas-access-token");
  const tokenEsperado = (Deno.env.get("ASAAS_WEBHOOK_TOKEN") ?? "").trim();
  if (!token || token.trim() !== tokenEsperado) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let carga: Record<string, unknown>;
  try {
    carga = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const eventoId = String(carga.id ?? "");
  const tipoEvento = String(carga.event ?? "");
  if (!eventoId) {
    return new Response(JSON.stringify({ error: "missing event id" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Registro idempotente: o mesmo evento reenviado não cria nova linha.
  const { data: registro, error } = await supabase
    .from("webhooks_recebidos")
    .upsert(
      { provedor: "asaas", evento_externo_id: eventoId, tipo_evento: tipoEvento, carga },
      { onConflict: "provedor,evento_externo_id", ignoreDuplicates: false },
    )
    .select("id, processado_em")
    .single();

  if (error) {
    console.error("falha ao registrar webhook", error);
    return new Response(JSON.stringify({ error: "storage" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (registro.processado_em && carga.forcar !== true) {
    return new Response(JSON.stringify({ ok: true, jaProcessado: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const resultado = await processar(registro.id, tipoEvento, carga);

  return new Response(JSON.stringify({ ok: true, ...resultado }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
