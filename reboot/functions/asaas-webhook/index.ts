// Webhook Asaas — peça 1 de 6: RECEBER
// Responsabilidade única: validar o segredo, registrar o evento de forma
// idempotente e devolver 200 rápido. O processamento acontece em seguida,
// mas uma falha nele nunca faz o Asaas reenviar em loop.
//
// Destino: projeto NOVO (tysvpeprhokdijquprkd). Não implantar no antigo.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { identificarPessoa } from "./identificar-pessoa.ts";
import { registrarPagamento } from "./registrar-pagamento.ts";
import { concederAcesso } from "./conceder-acesso.ts";
import { aplicarEfeitos } from "./efeitos.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

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

export async function processar(
  registroId: string,
  tipoEvento: string,
  carga: Record<string, unknown>,
) {
  try {
    const pagamentoAsaas = (carga.payment ?? {}) as Record<string, unknown>;

    const pessoaId = await identificarPessoa(supabase, pagamentoAsaas);
    const pagamentoId = await registrarPagamento(supabase, tipoEvento, pagamentoAsaas, pessoaId);

    let concessaoId: string | null = null;
    if (pagamentoId) {
      concessaoId = await concederAcesso(supabase, pagamentoId, pagamentoAsaas);
    }

    // Efeitos nunca bloqueiam o acesso.
    aplicarEfeitos(supabase, { pessoaId, pagamentoId, concessaoId, tipoEvento })
      .catch((e) => console.error("efeitos falharam (acesso preservado)", e));

    await supabase
      .from("webhooks_recebidos")
      .update({ processado_em: new Date().toISOString(), erro: null })
      .eq("id", registroId);

    return { pessoaId, pagamentoId, concessaoId };
  } catch (e) {
    console.error("falha ao processar webhook", e);
    await supabase.rpc("noop").catch(() => {});
    await supabase
      .from("webhooks_recebidos")
      .update({ erro: String(e), tentativas: undefined })
      .eq("id", registroId);
    return { erro: String(e) };
  }
}
