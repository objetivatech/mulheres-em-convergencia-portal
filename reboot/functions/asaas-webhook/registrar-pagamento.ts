// Peça 3 de 6: REGISTRAR PAGAMENTO
// Grava o fato financeiro. Idempotente pela chave (provedor, cobrança).

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CONFIRMADOS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_RECEIVED_IN_CASH"]);
const ESTORNADOS = new Set(["PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED"]);
const CANCELADOS = new Set(["PAYMENT_DELETED", "PAYMENT_CANCELED"]);

function situacaoPor(tipoEvento: string) {
  if (CONFIRMADOS.has(tipoEvento)) return "confirmado";
  if (ESTORNADOS.has(tipoEvento)) return "estornado";
  if (CANCELADOS.has(tipoEvento)) return "cancelado";
  return "pendente";
}

export async function registrarPagamento(
  supabase: SupabaseClient,
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
