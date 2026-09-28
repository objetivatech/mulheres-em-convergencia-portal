// Envio de e-mail único para todas as funções.
// Ordem dos canais: Sender.net (principal) → Resend (reserva).

export type Destinatario = { email: string; nome?: string | null };

const REMETENTE_PADRAO = 'noreply@mulheresemconvergencia.com.br';
const NOME_REMETENTE = 'Mulheres em Convergência';

function remetente() {
  return (Deno.env.get('SENDER_FROM_EMAIL') || Deno.env.get('ADMIN_EMAIL_FROM') || REMETENTE_PADRAO).trim();
}

/** Diagnóstico do canal de e-mail, sem revelar nenhuma chave. */
export function canalDeEmail() {
  const sender = !!Deno.env.get('SENDER_API_TOKEN');
  const resend = !!Deno.env.get('RESEND_API_KEY');
  return {
    remetente: remetente(),
    canal: sender ? 'Sender.net' : resend ? 'Resend' : 'nenhum',
    sender_configurado: sender,
    resend_configurado: resend,
  };
}

export async function enviarEmail(dest: Destinatario, assunto: string, html: string): Promise<void> {
  const de = remetente();

  const senderToken = Deno.env.get('SENDER_API_TOKEN')?.trim();
  if (senderToken) {
    const res = await fetch('https://api.sender.net/v2/message/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${senderToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        from: { email: de, name: NOME_REMETENTE },
        to: { email: dest.email, name: dest.nome || dest.email },
        subject: assunto,
        html,
      }),
    });
    if (!res.ok) throw new Error(`Sender.net ${res.status}: ${await res.text()}`);
    return;
  }

  const mrKey = Deno.env.get('MAILRELAY_API_KEY');
  const mrHost = Deno.env.get('MAILRELAY_HOST');
  if (mrKey && mrHost) {
    const res = await fetch(`https://${mrHost}/api/v1/send_emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-AUTH-TOKEN': mrKey },
      body: JSON.stringify({
        from: { email: de, name: NOME_REMETENTE },
        to: [{ email: dest.email, name: dest.nome || dest.email }],
        subject: assunto,
        html_part: html,
      }),
    });
    if (!res.ok) throw new Error(`MailRelay ${res.status}: ${await res.text()}`);
    return;
  }

  const resend = Deno.env.get('RESEND_API_KEY');
  if (!resend) throw new Error('Nenhum canal de e-mail configurado (SENDER_API_TOKEN, MAILRELAY_* ou RESEND_API_KEY)');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resend}` },
    body: JSON.stringify({ from: `${NOME_REMETENTE} <${de}>`, to: [dest.email], subject: assunto, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
