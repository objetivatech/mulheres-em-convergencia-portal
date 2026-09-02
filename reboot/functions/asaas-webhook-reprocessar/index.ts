// Peça 6 de 6: REPROCESSAR
// Botão no painel de operação: roda de novo um evento já recebido.
// Exige administradora autenticada. Como todas as peças são idempotentes,
// reprocessar nunca duplica pagamento nem concessão.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { processar } from "../asaas-webhook/index.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: registro, error } = await admin
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

  await admin
    .from("webhooks_recebidos")
    .update({ tentativas: (registro.tentativas ?? 0) + 1 })
    .eq("id", registro.id);

  const resultado = await processar(registro.id, registro.tipo_evento ?? "", registro.carga);

  return new Response(JSON.stringify({ ok: true, resultado }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
