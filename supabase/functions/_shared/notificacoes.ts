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

/** Confirmação de inscrição em evento (gratuito ou pago). */
export function modeloInscricaoEvento(ev: {
  nome?: string | null;
  titulo: string;
  inicioEm?: string | null;
  online?: boolean;
  localNome?: string | null;
  cidade?: string | null;
  uf?: string | null;
  linkOnline?: string | null;
  inscricaoId?: string | null;
  pago?: boolean;
}) {
  const onde = ev.online
    ? 'Encontro on-line — o link de acesso está no seu ingresso.'
    : `Local: ${esc(ev.localNome ?? '')}${ev.cidade ? ` — ${esc(ev.cidade)}/${esc(ev.uf ?? '')}` : ''}`;
  return layout({
    titulo: `Inscrição confirmada: ${esc(ev.titulo)}`,
    corpo:
      ola(ev.nome) +
      p(`Sua inscrição em <strong>${esc(ev.titulo)}</strong> está confirmada!`) +
      (ev.inicioEm ? p(`📅 <strong>${dataHoraBR(ev.inicioEm)}</strong>`) : '') +
      p(onde) +
      p('No dia, apresente o QR Code do seu ingresso na recepção. Ele fica disponível na sua área, em "Meus encontros".'),
    ctaRotulo: 'Ver meu ingresso',
    ctaUrl: ev.inscricaoId ? `${SITE}/minha-area/encontros/${ev.inscricaoId}` : `${SITE}/minha-area/encontros`,
  });
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
