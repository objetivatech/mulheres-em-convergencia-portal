// Modelos de e-mail com a identidade nova do portal.
// Todas as mensagens do sistema devem usar `layout()` para manter o mesmo visual.

export const MARCA = {
  rosa: '#C75A92',
  lilas: '#9191C0',
  azul: '#ADBBDD',
  areia: '#FBF7F2',
  carvao: '#26262E',
  cinza: '#6B6B78',
  borda: '#E4E4EC',
  site: 'https://mulheresemconvergencia.com.br',
  nome: 'Mulheres em Convergência',
};

export function layout(opcoes: {
  titulo: string;
  corpo: string;
  ctaRotulo?: string;
  ctaUrl?: string;
  rodape?: string;
}) {
  const { titulo, corpo, ctaRotulo, ctaUrl, rodape } = opcoes;
  const botao =
    ctaRotulo && ctaUrl
      ? `<tr><td align="center" style="padding:8px 32px 32px">
           <a href="${ctaUrl}" style="background:${MARCA.rosa};color:#ffffff;text-decoration:none;
             display:inline-block;padding:14px 32px;border-radius:14px;font-weight:600;font-size:16px">
             ${ctaRotulo}</a>
         </td></tr>`
      : '';

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo}</title></head>
<body style="margin:0;padding:0;background:${MARCA.areia};font-family:Montserrat,Helvetica,Arial,sans-serif;color:${MARCA.carvao}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${MARCA.areia};padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid ${MARCA.borda}">
        <tr><td style="background:linear-gradient(135deg,${MARCA.rosa},${MARCA.lilas});padding:28px 32px">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.3px">${MARCA.nome}</p>
        </td></tr>
        <tr><td style="padding:32px 32px 8px">
          <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:${MARCA.carvao}">${titulo}</h1>
          <div style="font-size:16px;line-height:1.65;color:${MARCA.carvao}">${corpo}</div>
        </td></tr>
        ${botao}
        <tr><td style="padding:0 32px 32px">
          <hr style="border:none;border-top:1px solid ${MARCA.borda};margin:0 0 16px">
          <p style="margin:0;font-size:12px;line-height:1.6;color:${MARCA.cinza}">
            ${rodape ?? `Você recebeu este e-mail porque tem cadastro no portal ${MARCA.nome}.`}<br>
            <a href="${MARCA.site}" style="color:${MARCA.lilas}">${MARCA.site.replace('https://', '')}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Comunicado de relançamento + convite para criar nova senha. */
export function modeloRelancamento(p: { nome?: string | null; titulo: string; corpo: string; ctaRotulo: string; url: string }) {
  const saudacao = p.nome ? `<p style="margin:0 0 16px">Olá, ${p.nome}!</p>` : '';
  return layout({
    titulo: p.titulo,
    corpo: `${saudacao}<p style="margin:0 0 16px">${p.corpo}</p>
      <p style="margin:0;font-size:14px;color:${MARCA.cinza}">O link abaixo vale por 24 horas. Se expirar, use “Esqueci minha senha” na tela de entrada.</p>`,
    ctaRotulo: p.ctaRotulo,
    ctaUrl: p.url,
  });
}

/** Confirmação de cadastro. */
export function modeloConfirmacao(p: { url: string; nome?: string | null }) {
  return layout({
    titulo: 'Confirme seu e-mail',
    corpo: `${p.nome ? `<p style="margin:0 0 16px">Olá, ${p.nome}!</p>` : ''}
      <p style="margin:0">Falta um passo para ativar seu acesso ao portal. Toque no botão para confirmar seu e-mail.</p>`,
    ctaRotulo: 'Confirmar meu e-mail',
    ctaUrl: p.url,
  });
}

/** Recuperação de senha. */
export function modeloRecuperacao(p: { url: string }) {
  return layout({
    titulo: 'Criar uma nova senha',
    corpo:
      '<p style="margin:0">Recebemos um pedido para trocar a senha da sua conta. Toque no botão para escolher uma nova. Se não foi você, pode ignorar esta mensagem.</p>',
    ctaRotulo: 'Criar nova senha',
    ctaUrl: p.url,
  });
}

/** Link de acesso sem senha (magic link). */
export function modeloLinkDeAcesso(p: { url: string }) {
  return layout({
    titulo: 'Seu link de acesso',
    corpo: '<p style="margin:0">Toque no botão para entrar no portal. O link vale por pouco tempo e só pode ser usado uma vez.</p>',
    ctaRotulo: 'Entrar no portal',
    ctaUrl: p.url,
  });
}

/** Confirmação de troca de e-mail. */
export function modeloTrocaDeEmail(p: { url: string; novoEmail: string }) {
  return layout({
    titulo: 'Confirme seu novo e-mail',
    corpo: `<p style="margin:0">Pediram para trocar o e-mail da conta para <strong>${p.novoEmail}</strong>. Confirme para concluir.</p>`,
    ctaRotulo: 'Confirmar troca',
    ctaUrl: p.url,
  });
}
