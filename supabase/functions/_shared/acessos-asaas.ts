// Regra única de liberação de acessos a partir de pagamentos do Asaas.
// Usada pelo webhook (tempo real) e pela regularização do painel.
// pagamento confirmado → pessoa identificada → plano resolvido →
// concessões de TODOS os módulos do plano + papel "assinante".
// Embaixadora nunca vem de plano (só a administradora concede).
// deno-lint-ignore-file no-explicit-any

const ASAAS_BASE = "https://api.asaas.com/v3";
export type TipoAcesso = "diretorio" | "conecta" | "academy" | "evento" | "area_embaixadora";
const TODOS: TipoAcesso[] = ["diretorio", "conecta", "academy", "evento"];

const digitos = (v: unknown) => String(v ?? "").replace(/\D/g, "") || null;
const normal = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Busca o cliente no Asaas e localiza (ou cria) a pessoa pelo CPF / e-mail. */
export async function identificarPorClienteAsaas(sb: any, clienteId: string | null): Promise<string | null> {
  const apiKey = Deno.env.get("ASAAS_API_KEY");
  if (!clienteId || !apiKey) return null;
  const r = await fetch(`${ASAAS_BASE}/customers/${clienteId}`, { headers: { access_token: apiKey } });
  if (!r.ok) return null;
  const c = await r.json().catch(() => ({}));
  const cpf = digitos(c.cpfCnpj);
  const email = c.email ? String(c.email).trim().toLowerCase() : null;

  if (cpf && cpf.length === 11) {
    const { data } = await sb.from("pessoas").select("id").eq("cpf", cpf).maybeSingle();
    if (data) return data.id;
  }
  if (email) {
    const { data } = await sb.from("pessoa_contatos").select("pessoa_id")
      .eq("tipo", "email").eq("valor", email).limit(1).maybeSingle();
    if (data?.pessoa_id) return data.pessoa_id;
  }
  // Pagante real sem cadastro: cria a pessoa pelo CPF (fonte central).
  // Quando ela entrar no site, garantir_pessoa a vincula pelo CPF/e-mail.
  if (cpf && cpf.length === 11) {
    const { data, error } = await sb.from("pessoas")
      .insert({ cpf, nome: String(c.name ?? "Sem nome") }).select("id").single();
    if (error) return null;
    if (email) {
      await sb.from("pessoa_contatos").insert({ pessoa_id: data.id, tipo: "email", valor: email, principal: true });
    }
    return data.id;
  }
  return null;
}

/** Descobre o plano: referência plano:slug → plano já gravado → descrição → valor. */
export async function resolverPlano(sb: any, p: {
  referencia?: string | null; descricao?: string | null; valor_centavos?: number | null; plano_id?: string | null;
}): Promise<{ planoId: string | null; tipos: TipoAcesso[]; dias: number }> {
  const { data: planos } = await sb.from("planos")
    .select("id, slug, nome, tipo, tipos, dias_acesso, valor_centavos, periodicidade");
  const lista = (planos ?? []) as any[];
  const saida = (pl: any) => {
    const tipos = ((pl.tipos?.length ? pl.tipos : [pl.tipo]) as TipoAcesso[]).filter((t) => t !== "area_embaixadora");
    return { planoId: pl.id, tipos: tipos.length ? tipos : TODOS, dias: Number(pl.dias_acesso) || 31 };
  };
  const ref = String(p.referencia ?? "");
  const desc = normal(String(p.descricao ?? ""));

  const m = ref.match(/^plano:(.+)$/i);
  if (m) { const pl = lista.find((x) => x.slug === m[1]); if (pl) return saida(pl); }
  if (/^evento:/i.test(ref)) return { planoId: null, tipos: ["evento"], dias: 366 };
  if (p.plano_id) { const pl = lista.find((x) => x.id === p.plano_id); if (pl) return saida(pl); }

  const per = /anual/.test(desc) ? "anual" : /semestral/.test(desc) ? "semestral" : /mensal/.test(desc) ? "mensal" : null;
  const porNome = lista.filter((x) => {
    const nome = normal(String(x.nome)).replace(/^plano\s+/, "").replace(/s$/, "");
    return nome.length > 2 && desc.includes(nome) && (!per || x.periodicidade === per);
  });
  if (porNome.length) return saida(porNome[0]);

  const v = Number(p.valor_centavos ?? 0);
  if (v > 0) {
    const perto = lista.filter((x) => x.valor_centavos > 0 && Math.abs(x.valor_centavos - v) / x.valor_centavos <= 0.15 && (!per || x.periodicidade === per))
      .sort((a, b) => Math.abs(a.valor_centavos - v) - Math.abs(b.valor_centavos - v));
    if (perto.length) return saida(perto[0]);
  }
  // Assinatura do portal sem plano reconhecível: libera os módulos de associada.
  return { planoId: null, tipos: TODOS, dias: per === "anual" ? 366 : per === "semestral" ? 186 : 31 };
}

/** Concede módulos + papéis para um pagamento confirmado já gravado. */
export async function liberarPorPagamento(sb: any, pagamentoId: string): Promise<{ concessoes: number; tipos: TipoAcesso[] } | null> {
  const { data: pg } = await sb.from("pagamentos")
    .select("id, pessoa_id, situacao, referencia_externa, descricao, valor_centavos, plano_id")
    .eq("id", pagamentoId).maybeSingle();
  if (!pg || pg.situacao !== "confirmado" || !pg.pessoa_id) return null;

  const plano = await resolverPlano(sb, {
    referencia: pg.referencia_externa, descricao: pg.descricao, valor_centavos: pg.valor_centavos, plano_id: pg.plano_id,
  });
  if (plano.planoId && !pg.plano_id) await sb.from("pagamentos").update({ plano_id: plano.planoId }).eq("id", pg.id);

  let concessoes = 0;
  for (const tipo of plano.tipos) {
    const { data, error } = await sb.rpc("conceder_por_pagamento", { _pagamento_id: pg.id, _tipo: tipo, _dias: plano.dias });
    if (error) throw error;
    if (data) concessoes++;
  }

  if (!plano.tipos.every((t) => t === "evento")) {
    await sb.from("papeis").upsert({ pessoa_id: pg.pessoa_id, papel: "assinante" }, { onConflict: "pessoa_id,papel", ignoreDuplicates: true });
    const { count } = await sb.from("negocios").select("id", { count: "exact", head: true })
      .eq("pessoa_id", pg.pessoa_id).eq("publicado", true);
    if (count) {
      await sb.from("papeis").upsert({ pessoa_id: pg.pessoa_id, papel: "dona_negocio" }, { onConflict: "pessoa_id,papel", ignoreDuplicates: true });
    }
  }
  return { concessoes, tipos: plano.tipos };
}
