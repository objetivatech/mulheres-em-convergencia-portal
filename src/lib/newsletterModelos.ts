// Monta o HTML final das newsletters MeC enviadas pelo Sender.net.
// Layout em tabelas de 600px com estilos inline (compatível com Gmail/Outlook).
// O rodapé obrigatório (descadastro + dados do remetente) é sempre incluído.

export const SITE_URL = 'https://mulheresemconvergencia.com.br';
export const ICONE_URL = `${SITE_URL}/pwa-192x192.png`;
/** Marcadores do Sender.net (formato usado no editor de HTML personalizado deles). */
export const TAG_DESCADASTRO = '{$unsubscribe_link}';
export const TAG_NOME = '{{ firstname }}';

export type ModeloId = 'boletim' | 'comunicado' | 'convite';
export type PostNews = { titulo: string; resumo?: string | null; capa_url?: string | null; slug: string };
export type Remetente = { nome: string; email: string; endereco?: string };

export const MODELOS: { id: ModeloId; nome: string; descricao: string; corpoInicial: string }[] = [
  {
    id: 'boletim', nome: 'Boletim e blog',
    descricao: 'Recado de abertura + novidades do blog + chamada para o portal.',
    corpoInicial: `<p>Olá, ${TAG_NOME}!</p><p>Escreva aqui o recado de abertura desta edição.</p>`,
  },
  {
    id: 'comunicado', nome: 'Comunicado oficial',
    descricao: 'Layout limpo para avisos da rede, planos e novidades.',
    corpoInicial: `<p>Olá, ${TAG_NOME}!</p><h2>Título do comunicado</h2><p>Escreva aqui o aviso.</p>`,
  },
  {
    id: 'convite', nome: 'Convite para encontro',
    descricao: 'Destaque para data, local e botão de inscrição.',
    corpoInicial: `<p>Olá, ${TAG_NOME}!</p><h2>Nome do encontro</h2><p><strong>Data:</strong> 00/00 às 00h<br><strong>Local:</strong> endereço ou online</p><p>Conte por que vale a pena participar.</p>`,
  },
];

const esc = (t?: string | null) =>
  (t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const FONTE = "Montserrat, Arial, Helvetica, sans-serif";
const CARVAO = '#22212B';
const ROSA = '#C75A92';
const LILAS = '#9191C0';
const CREME = '#F7F3EE';
const DIVISA = '#ECE8E2';

export const urlPost = (slug: string) => `${SITE_URL}/convergindo/${encodeURIComponent(slug)}`;

function botao(rotulo: string, url: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0;"><tr><td bgcolor="${ROSA}" style="border-radius:999px;background:${ROSA};background-image:linear-gradient(90deg,${ROSA},${LILAS});">
<a href="${esc(url)}" target="_blank" style="display:inline-block;padding:12px 26px;font-family:${FONTE};font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${esc(rotulo)}</a></td></tr></table>`;
}

/** Bloco de posts em tabela — pode ser copiado e colado sozinho no Sender. */
export function blocoPosts(posts: PostNews[], titulo = 'Novidades do blog'): string {
  if (!posts.length) return '';
  const itens = posts.map((p) => `
<tr><td style="padding:0 0 24px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${DIVISA};border-radius:18px;background:#ffffff;">
    ${p.capa_url ? `<tr><td><a href="${esc(urlPost(p.slug))}" target="_blank"><img src="${esc(p.capa_url)}" width="536" alt="${esc(p.titulo)}" style="display:block;width:100%;max-width:536px;height:auto;border:0;border-radius:18px 18px 0 0;"></a></td></tr>` : ''}
    <tr><td style="padding:18px 20px;font-family:${FONTE};color:${CARVAO};">
      <h3 style="margin:0 0 8px 0;font-size:18px;line-height:1.35;font-weight:700;"><a href="${esc(urlPost(p.slug))}" target="_blank" style="color:${CARVAO};text-decoration:none;">${esc(p.titulo)}</a></h3>
      ${p.resumo ? `<p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#55525F;">${esc(p.resumo)}</p>` : ''}
      ${botao('Ler no portal', urlPost(p.slug))}
    </td></tr>
  </table>
</td></tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:8px 0 16px 0;font-family:${FONTE};font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${ROSA};">${esc(titulo)}</td></tr>
${itens}
</table>`;
}

export type MontarOpcoes = {
  modelo: ModeloId;
  corpo: string;
  previa?: string;
  posts?: PostNews[];
  cta?: { rotulo: string; url: string } | null;
  remetente: Remetente;
};

/** Garante o rodapé de descadastro mesmo em HTML vindo de fora. */
export const temDescadastro = (html: string) => html.includes(TAG_DESCADASTRO);

export function montarNewsletter(o: MontarOpcoes): string {
  const posts = o.posts ?? [];
  const faixa = o.modelo === 'comunicado' ? CARVAO : `${ROSA}`;
  const cta = o.cta?.url ? botao(o.cta.rotulo || 'Saiba mais', o.cta.url)
    : o.modelo === 'boletim' ? botao('Visitar o portal', SITE_URL) : '';
  const corpoEstilizado = o.corpo
    .replace(/<p>/g, `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:${CARVAO};">`)
    .replace(/<h2>/g, `<h2 style="margin:8px 0 12px 0;font-size:22px;line-height:1.3;font-weight:800;color:${CARVAO};">`)
    .replace(/<h3>/g, `<h3 style="margin:8px 0 10px 0;font-size:18px;font-weight:700;color:${CARVAO};">`)
    .replace(/<img /g, '<img style="max-width:100%;height:auto;border-radius:14px;" ')
    .replace(/<a /g, `<a style="color:${ROSA};" `);
  const destaqueConvite = o.modelo === 'convite'
    ? `border-left:4px solid ${ROSA};padding-left:18px;` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mulheres em Convergência</title></head>
<body style="margin:0;padding:0;background:${CREME};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(o.previa ?? '')}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CREME}" style="background:${CREME};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;">
  <tr><td height="6" bgcolor="${faixa}" style="height:6px;line-height:6px;font-size:0;background:${faixa};background-image:linear-gradient(90deg,${ROSA},${LILAS},#ADBBDD);">&nbsp;</td></tr>
  <tr><td align="center" style="padding:28px 32px 8px 32px;">
    <a href="${SITE_URL}" target="_blank" style="text-decoration:none;"><img src="${ICONE_URL}" width="56" height="56" alt="MeC" style="display:block;border:0;margin:0 auto 10px auto;"></a>
    <div style="font-family:${FONTE};font-size:15px;font-weight:800;letter-spacing:1px;color:${CARVAO};">Mulheres em Convergência</div>
  </td></tr>
  <tr><td style="padding:24px 32px 8px 32px;font-family:${FONTE};"><div style="${destaqueConvite}">${corpoEstilizado}</div>${cta}</td></tr>
  ${posts.length ? `<tr><td style="padding:16px 32px 0 32px;">${blocoPosts(posts)}</td></tr>` : ''}
  <tr><td style="padding:24px 32px 28px 32px;border-top:1px solid ${DIVISA};font-family:${FONTE};font-size:12px;line-height:1.7;color:#77737F;" align="center">
    <strong style="color:${CARVAO};">${esc(o.remetente.nome)}</strong><br>
    ${o.remetente.endereco ? `${esc(o.remetente.endereco)}<br>` : ''}
    <a href="mailto:${esc(o.remetente.email)}" style="color:#77737F;">${esc(o.remetente.email)}</a> · <a href="${SITE_URL}" style="color:#77737F;">mulheresemconvergencia.com.br</a> · <a href="${SITE_URL}/politica-de-privacidade" style="color:#77737F;">Privacidade</a><br><br>
    Você recebe este e-mail porque se inscreveu na rede MeC.<br>
    <a href="${TAG_DESCADASTRO}" style="color:${ROSA};font-weight:700;">Cancelar inscrição</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}
