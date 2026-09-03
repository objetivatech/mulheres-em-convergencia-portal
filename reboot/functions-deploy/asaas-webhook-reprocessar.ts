// ============================================================================
// asaas-webhook-reprocessar — VERSÃO DE ARQUIVO ÚNICO (painel do Supabase)
// ============================================================================
// Peça 6 de 6: REPROCESSAR — botão no painel de operação: roda de novo um
// evento já recebido. Exige administradora autenticada. Como todas as peças
// são idempotentes, reprocessar nunca duplica pagamento nem concessão.
//
// Contém a lógica de processamento copiada da asaas-webhook (versão de
// arquivo único), porque o editor do painel não aceita imports locais.
// Destino: projeto NOVO (tysvpeprhokdijquprkd). Não implantar no antigo.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Lógica de processamento (idêntica à asaas-webhook de arquivo único)
// ---------------------------------------------------------------------------
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const digitos = (v: unknown) => String(v ?? "").replace(/\D/g, "") || null;

async function identificarPessoa(
  pagamento: Record<string, unknown>,
): Promise<string | null> {
  const cpf = digitos((pagamento.customerCpfCnpj ?? (pagamento as any).cpfCnpj));
  if (cpf && cpf.length === 11) {
    const { data } = await supabase.from("pessoas").select("id").eq("cpf", cpf).maybeSingle();
    if (data) return data.id;
  }

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

type TipoAcesso = "diretorio" | "conecta" | "academy" | "evento" | "area_embaixadora";

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

async function aplicarEfeitos(ctx: {
  pessoaId: string | null;
  pagamentoId: string | null;
  concessaoId: string | null;
  tipoEvento: string;
}) {
  const tarefas: Array<Promise<unknown>> = [];

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
// Entrada: valida administradora e reprocessa o evento pedido
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const authHeader = req.headers.get("Authorization") ?? "";
  const anon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
  );

  const { data: ehAdmin, error: erroAdmin } = await anon.rpc("e_admin");
  if (erroAdmin || !ehAdmin) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const { webhookId } = await req.json();

  const { data: registro, error } = await supabase
    .from("webhooks_recebidos")
    .select("id, tipo_evento, carga, tentativas")
    .eq("id", webhookId)
    .single();

  if (error || !registro) {
    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  await supabase
    .from("webhooks_recebidos")
    .update({ tentativas: (registro.tentativas ?? 0) + 1 })
    .eq("id", registro.id);

  const resultado = await processar(registro.id, registro.tipo_evento ?? "", registro.carga);

  return new Response(JSON.stringify({ ok: true, resultado }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
