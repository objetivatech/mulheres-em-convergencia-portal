// Peça 4 de 6: CONCEDER ACESSO
// Todo pagamento confirmado cria uma concessão a partir do dia da
// confirmação. Pagamento em atraso deixa de ser caso especial: não existe
// estado "desativado" para desfazer, então não existe reativação silenciosa
// que possa falhar (casos Luciana e Paola).

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

export async function concederAcesso(
  supabase: SupabaseClient,
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
