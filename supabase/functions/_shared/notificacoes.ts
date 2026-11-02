// Notificações transacionais do portal — todas com o visual da marca.
// Cada modelo usa o layout() de marca.ts; o envio é sempre via enviar-email.ts.

import { layout, MARCA } from './email-templates/marca.ts';

const SITE = MARCA.site;

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const p = (txt: string) => `<p style="margin:0 0 16px">${txt}</p>`;
const ola = (nome?: string | null) => (nome ? p(`Olá, ${esc(nome)}!`) : '');

/** E-mail principal de uma pessoa (contato principal, senão o mais antigo). */
export async function emailDePessoa(admin: any, pessoaId: string): Promise<{ email: string; nome: string | null } | null> {
  const { data: pessoa } = await admin.from('pessoas').select('nome, nome_social').eq('id', pessoaId).maybeSingle();
  const { data: contatos } = await admin
    .from('pessoa_contatos')
    .select('valor, principal, criado_em')
    .eq('pessoa_id', pessoaId)
    .eq('tipo', 'email')
    .order('principal', { ascending: false })
    .order('criado_em', { ascending: true })
    .limit(1);
  const email = contatos?.[0]?.valor;
  if (!email) return null;
  return { email: String(email), nome: pessoa?.nome_social || pessoa?.nome || null };
}

/** E-mails de todas as administradoras. */
export async function emailsDaEquipe(admin: any): Promise<string[]> {
  const { data: papeis } = await admin.from('papeis').select('pessoa_id').eq('papel', 'admin');
  const ids = (papeis ?? []).map((r: any) => r.pessoa_id);
  if (!ids.length) return [];
  const { data: contatos } = await admin
    .from('pessoa_contatos')
    .select('valor')
    .in('pessoa_id', ids)
    .eq('tipo', 'email')
    .eq('principal', true);
  return [...new Set((contatos ?? []).map((c: any) => String(c.valor)))];
}

function dataHoraBR(iso?: string | null) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'long', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

/* ------------------------------------------------------------------ */
/* Modelos                                                             */
/* ------------------------------------------------------------------ */

const reais = (c?: number | null) =>
  ((c ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type DadosCompra = {
  nome?: string | null;
  titulo: string;
  inicioEm?: string | null;
  fimEm?: string | null;
  online?: boolean;
  localNome?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  uf?: string | null;
  linkOnline?: string | null;
  inscricaoId?: string | null;
  pago?: boolean;
  tipoNome?: string | null;
  tipoRequisito?: string | null;
  loteNome?: string | null;
  cupom?: string | null;
  valorCentavos?: number | null;
  email?: string | null;
  inscritaEm?: string | null;
};

function linha(rotulo: string, valor?: string | null) {
  if (!valor) return '';
  return `<tr><td style="padding:6px 12px 6px 0;color:#6b6b76;white-space:nowrap;vertical-align:top">${rotulo}</td><td style="padding:6px 0;font-weight:600">${valor}</td></tr>`;
}

function resumoCompra(ev: DadosCompra) {
  const onde = ev.online
    ? 'On-line (link no seu ingresso)'
    : [ev.localNome, ev.endereco, ev.cidade ? `${ev.cidade}${ev.uf ? `/${ev.uf}` : ''}` : null].filter(Boolean).map(esc).join(' — ');
  const linhas =
    linha('Encontro', esc(ev.titulo)) +
    linha('Data', dataHoraBR(ev.inicioEm)) +
    linha('Término', ev.fimEm ? dataHoraBR(ev.fimEm) : null) +
    linha('Local', onde || 'A confirmar') +
    linha('Participante', esc(ev.nome ?? '')) +
    linha('E-mail', ev.email ? esc(ev.email) : null) +
    linha('Ingresso', ev.tipoNome ? esc(ev.tipoNome) : null) +
    linha('Lote', ev.loteNome ? esc(ev.loteNome) : null) +
    linha('Cupom', ev.cupom ? esc(ev.cupom) : null) +
    linha('Valor', ev.valorCentavos ? reais(ev.valorCentavos) : 'Gratuito') +
    linha('Pagamento', ev.valorCentavos ? (ev.pago ? 'Confirmado' : 'Aguardando') : null) +
    linha('Nº da inscrição', ev.inscricaoId ? esc(ev.inscricaoId.slice(0, 8).toUpperCase()) : null);
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 16px;border-top:1px solid #ECE8E2;border-bottom:1px solid #ECE8E2">${linhas}</table>` +
    (ev.tipoRequisito ? p(`⚠️ <strong>Importante para o seu ingresso:</strong> ${esc(ev.tipoRequisito)}`) : '');
}

/** Confirmação de inscrição em evento (gratuito ou pago), com o resumo completo da compra. */
export function modeloInscricaoEvento(ev: DadosCompra) {
  return layout({
    titulo: `Inscrição confirmada: ${esc(ev.titulo)}`,
    corpo:
      ola(ev.nome) +
      p(`Sua inscrição em <strong>${esc(ev.titulo)}</strong> está confirmada! Confira os detalhes:`) +
      resumoCompra(ev) +
      p('No dia, apresente o QR Code do seu ingresso na recepção. Ele fica disponível na sua área, em "Meus encontros".'),
    ctaRotulo: 'Ver meu ingresso',
    ctaUrl: ev.inscricaoId ? `${SITE}/minha-area/encontros/${ev.inscricaoId}` : `${SITE}/minha-area/encontros`,
  });
}

/** Lembrete do evento: 2 dias antes, 1 dia antes e no dia. */
export function modeloLembreteEvento(ev: DadosCompra, quando: '2d' | '1d' | '0d') {
  const titulos = {
    '2d': `Faltam 2 dias: ${esc(ev.titulo)}`,
    '1d': `É amanhã: ${esc(ev.titulo)}`,
    '0d': `É hoje: ${esc(ev.titulo)}! 💜`,
  };
  const frases = {
    '2d': 'Seu encontro está chegando! Já reserve esse horário na agenda.',
    '1d': 'Amanhã é o grande dia. Confira os detalhes e prepare-se para se conectar com a rede.',
    '0d': 'Hoje é o dia! Estamos esperando por você.',
  };
  return layout({
    titulo: titulos[quando],
    corpo:
      ola(ev.nome) +
      p(frases[quando]) +
      resumoCompra(ev) +
      p(ev.online ? 'O link de acesso está no seu ingresso.' : 'Leve o QR Code do seu ingresso (no celular ou impresso) para a recepção.'),
    ctaRotulo: ev.online ? 'Acessar meu ingresso' : 'Ver meu ingresso',
    ctaUrl: ev.inscricaoId ? `${SITE}/minha-area/encontros/${ev.inscricaoId}` : `${SITE}/minha-area/encontros`,
  });
}

/** Busca no banco tudo o que a compra precisa mostrar no e-mail. */
export async function dadosCompraInscricao(admin: any, inscricaoId: string): Promise<DadosCompra & { email: string } | null> {
  const { data: i } = await admin.from('evento_inscricoes')
    .select('id, nome, email, valor_centavos, situacao, criado_em, pagamento_id, evento:eventos(titulo, inicio_em, fim_em, online, link_online, local_nome, endereco, cidade, uf), tipo:evento_tipos_ingresso!evento_inscricoes_tipo_ingresso_id_fkey(nome, descricao), lote:evento_lotes!evento_inscricoes_lote_id_fkey(nome), cupom:evento_cupons!evento_inscricoes_cupom_id_fkey(codigo)')
    .eq('id', inscricaoId).maybeSingle();
  if (!i?.evento) return null;
  const ev = i.evento;
  return {
    nome: i.nome, email: String(i.email), titulo: ev.titulo, inicioEm: ev.inicio_em, fimEm: ev.fim_em,
    online: ev.online, linkOnline: ev.link_online, localNome: ev.local_nome, endereco: ev.endereco,
    cidade: ev.cidade, uf: ev.uf, inscricaoId: i.id, pago: i.situacao === 'confirmada' && !!i.pagamento_id,
    tipoNome: i.tipo?.nome ?? null, tipoRequisito: i.tipo?.descricao ?? null, loteNome: i.lote?.nome ?? null,
    cupom: i.cupom?.codigo ?? null, valorCentavos: i.valor_centavos, inscritaEm: i.criado_em,
  };
}

/** Boas-vindas após confirmação de pagamento de plano. */
export function modeloBoasVindasPlano(p_: { nome?: string | null; plano: string }) {
  return layout({
    titulo: `Bem-vinda ao plano ${esc(p_.plano)}! 💜`,
    corpo:
      ola(p_.nome) +
      p(`Seu pagamento foi confirmado e o plano <strong>${esc(p_.plano)}</strong> já está ativo na sua conta.`) +
      p('Acesse sua área para explorar o diretório, o Conecta+, a Academy e tudo o que o seu plano libera.'),
    ctaRotulo: 'Entrar na minha área',
    ctaUrl: `${SITE}/minha-area`,
  });
}

/** Aviso à dona do negócio sobre nova avaliação. */
export function modeloAvaliacaoRecebida(a: {
  nomeDona?: string | null;
  negocio: string;
  nota: number;
  comentario?: string | null;
  avaliador: string;
  slug?: string | null;
}) {
  const estrelas = '★'.repeat(a.nota) + '☆'.repeat(5 - a.nota);
  return layout({
    titulo: `Nova avaliação em ${esc(a.negocio)}`,
    corpo:
      ola(a.nomeDona) +
      p(`<strong>${esc(a.avaliador)}</strong> avaliou <strong>${esc(a.negocio)}</strong> com <strong style="color:${MARCA.rosa}">${estrelas}</strong>.`) +
      (a.comentario ? p(`“${esc(a.comentario)}”`) : '') +
      p('A avaliação já está visível na página do seu negócio.'),
    ctaRotulo: 'Ver meu negócio',
    ctaUrl: a.slug ? `${SITE}/negocios/${a.slug}` : `${SITE}/minha-area/negocio`,
  });
}

/** Aviso à equipe sobre novo comentário no blog. */
export function modeloComentarioBlog(c: { post: string; autor: string; trecho: string; slug?: string | null }) {
  return layout({
    titulo: `Novo comentário em "${esc(c.post)}"`,
    corpo:
      p(`<strong>${esc(c.autor)}</strong> comentou no post <strong>${esc(c.post)}</strong>:`) +
      p(`“${esc(c.trecho)}”`) +
      p('O comentário já está no ar. Se precisar, a equipe pode ocultá-lo no painel de conteúdo.'),
    ctaRotulo: 'Ver o post',
    ctaUrl: c.slug ? `${SITE}/blog/${c.slug}` : `${SITE}/painel-conteudo/blog`,
  });
}

/** Conecta+: pedido de conexão recebido. */
export function modeloConexaoSolicitada(d: { nomeDestino?: string | null; nomeOrigem: string; mensagem?: string | null }) {
  return layout({
    titulo: `${esc(d.nomeOrigem)} quer se conectar com você`,
    corpo:
      ola(d.nomeDestino) +
      p(`<strong>${esc(d.nomeOrigem)}</strong> enviou um pedido de conexão no Conecta+.`) +
      (d.mensagem ? p(`“${esc(d.mensagem)}”`) : '') +
      p('Aceite o convite para trocar mensagens e ampliar sua rede.'),
    ctaRotulo: 'Responder no Conecta+',
    ctaUrl: `${SITE}/minha-area/conecta`,
  });
}

/** Conecta+: pedido aceito. */
export function modeloConexaoAceita(d: { nomeDestino?: string | null; nomeOrigem: string }) {
  return layout({
    titulo: `${esc(d.nomeOrigem)} aceitou sua conexão!`,
    corpo:
      ola(d.nomeDestino) +
      p(`<strong>${esc(d.nomeOrigem)}</strong> aceitou seu pedido de conexão no Conecta+. Agora vocês podem trocar mensagens.`),
    ctaRotulo: 'Enviar uma mensagem',
    ctaUrl: `${SITE}/minha-area/conecta`,
  });
}

/** Conecta+: nova mensagem recebida. */
export function modeloMensagemConecta(d: { nomeDestino?: string | null; nomeOrigem: string; trecho: string }) {
  return layout({
    titulo: `Nova mensagem de ${esc(d.nomeOrigem)}`,
    corpo:
      ola(d.nomeDestino) +
      p(`<strong>${esc(d.nomeOrigem)}</strong> enviou uma mensagem para você no Conecta+:`) +
      p(`“${esc(d.trecho)}”`),
    ctaRotulo: 'Ler e responder',
    ctaUrl: `${SITE}/minha-area/conecta`,
  });
}

/** Conecta+: você recebeu uma indicação de negócio. */
export function modeloIndicacaoConecta(d: { nomeDestino?: string | null; nomeOrigem: string; descricao: string }) {
  return layout({
    titulo: `Você recebeu uma indicação no Conecta+`,
    corpo:
      ola(d.nomeDestino) +
      p(`<strong>${esc(d.nomeOrigem)}</strong> indicou você para uma oportunidade:`) +
      p(`“${esc(d.descricao)}”`),
    ctaRotulo: 'Ver no Conecta+',
    ctaUrl: `${SITE}/minha-area/conecta`,
  });
}

/** Embaixadora: nova indicação convertida em pagamento. */
export function modeloIndicacaoEmbaixadora(d: { nome?: string | null; nomeIndicada?: string | null; valorReais?: string | null }) {
  return layout({
    titulo: 'Sua indicação virou conquista! 🎉',
    corpo:
      ola(d.nome) +
      p(`Uma pessoa indicada por você${d.nomeIndicada ? ` (<strong>${esc(d.nomeIndicada)}</strong>)` : ''} acabou de confirmar o pagamento no portal.`) +
      p('Sua comissão será calculada no fechamento do mês e aparece no seu painel de embaixadora.'),
    ctaRotulo: 'Ver minhas indicações',
    ctaUrl: `${SITE}/minha-area/embaixadora`,
  });
}

/** Academy: matrícula confirmada. */
export function modeloMatriculaAcademy(d: { nome?: string | null; curso: string; slug?: string | null }) {
  return layout({
    titulo: `Matrícula confirmada: ${esc(d.curso)}`,
    corpo:
      ola(d.nome) +
      p(`Sua matrícula no curso <strong>${esc(d.curso)}</strong> está confirmada. Bom aprendizado!`),
    ctaRotulo: 'Começar agora',
    ctaUrl: d.slug ? `${SITE}/academy/${d.slug}` : `${SITE}/minha-area/academy`,
  });
}

/** Cortesia concedida pela equipe. */
export function modeloCortesia(d: { nome?: string | null; tipo: string; dias: number; motivo?: string | null }) {
  const nomes: Record<string, string> = {
    diretorio: 'o Diretório de negócios',
    conecta: 'o Conecta+',
    academy: 'a Academy',
    evento: 'os Encontros',
    area_embaixadora: 'a Área da Embaixadora',
  };
  const area = nomes[d.tipo] ?? d.tipo;
  return layout({
    titulo: `Você ganhou acesso a ${area}! 🎁`,
    corpo:
      ola(d.nome) +
      p(`A equipe liberou <strong>${area}</strong> para você por <strong>${d.dias} dias</strong>${d.motivo ? ` — ${esc(d.motivo)}` : ''}.`) +
      p('Aproveite! O acesso já está ativo na sua conta.'),
    ctaRotulo: 'Acessar agora',
    ctaUrl: `${SITE}/minha-area`,
  });
}
