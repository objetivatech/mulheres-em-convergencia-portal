// Peça 5 de 6: EFEITOS
// Comissão de embaixadora, e-mail, linha do tempo do CRM.
// Regra dura: qualquer falha aqui é registrada e engolida — o acesso já foi
// concedido e não pode depender de e-mail nem de CRM.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export async function aplicarEfeitos(
  supabase: SupabaseClient,
  ctx: {
    pessoaId: string | null;
    pagamentoId: string | null;
    concessaoId: string | null;
    tipoEvento: string;
  },
) {
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
