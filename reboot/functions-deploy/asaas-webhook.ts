// ============================================================================
// asaas-webhook — VERSÃO DE ARQUIVO ÚNICO (para colar no painel do Supabase)
// ============================================================================
// Conteúdo idêntico às 5 peças de reboot/functions/asaas-webhook/, juntadas
// em um só arquivo porque o editor do painel não aceita imports locais.
// Destino: projeto NOVO (tysvpeprhokdijquprkd). Não implantar no antigo.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

  return null;
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
type TipoAcesso = "diretorio" | "conecta" | "academy" | "evento" | "area_embaixadora";

// A descrição/referência da cobrança define o que foi comprado.
function tipoPorCobranca(pagamento: Record<string, unknown>): { tipo: TipoAcesso; dias: number } {
  const texto = `${pagamento.description ?? ""} ${pagamento.externalReference ?? ""}`.toLowerCase();
  if (texto.includes("conecta")) return { tipo: "conecta", dias: 31 };
  if (texto.includes("academy") || texto.includes("curso")) return { tipo: "academy", dias: 366 };
  if (texto.includes("evento") || texto.includes("ingresso")) return { tipo: "evento", dias: 366 };
  if (texto.includes("anual")) return { tipo: "diretorio", dias: 366 };
  return { tipo: "diretorio", dias: 31 };
}

async function concederAcesso(
  pagamentoId: string,
  pagamento: Record<string, unknown>,
): Promise<string | null> {
  const { tipo, dias } = tipoPorCobranca(pagamento);

  const { data, error } = await supabase.rpc("conceder_por_pagamento", {
    _pagamento_id: pagamentoId,
    _tipo: tipo,
    _dias: dias,
  });

  if (error) throw error;
  return (data as string | null) ?? null;
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

  const resultados = await Promise.allSettled(tarefas);
  resultados
    .filter((r) => r.status === "rejected")
    .forEach((r) => console.error("efeito falhou", (r as PromiseRejectedResult).reason));
}

// ---------------------------------------------------------------------------
// PROCESSAR (compartilhado com a function de reprocessar)
// ---------------------------------------------------------------------------
async function processar(
  registroId: string,
  tipoEvento: string,
  carga: Record<string, unknown>,
) {
  try {
    const pagamentoAsaas = (carga.payment ?? {}) as Record<string, unknown>;

    const pessoaId = await identificarPessoa(pagamentoAsaas);
    const pagamentoId = await registrarPagamento(tipoEvento, pagamentoAsaas, pessoaId);

    let concessaoId: string | null = null;
    if (pagamentoId) {
      concessaoId = await concederAcesso(pagamentoId, pagamentoAsaas);
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
  if (!token || token !== Deno.env.get("ASAAS_WEBHOOK_TOKEN")) {
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

  if (registro.processado_em) {
    return new Response(JSON.stringify({ ok: true, jaProcessado: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const resultado = await processar(registro.id, tipoEvento, carga);

  return new Response(JSON.stringify({ ok: true, ...resultado }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
