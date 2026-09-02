// Peça 2 de 6: IDENTIFICAR PESSOA
// Ordem de tentativa: CPF → referência externa → cliente Asaas → e-mail.
// Nunca cria pessoa "fantasma": se não identificar, devolve null e o
// pagamento é registrado mesmo assim, para conciliação manual no painel.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const digitos = (v: unknown) => String(v ?? "").replace(/\D/g, "") || null;

export async function identificarPessoa(
  supabase: SupabaseClient,
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
