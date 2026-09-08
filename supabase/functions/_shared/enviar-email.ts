// Envio de e-mail único para todas as funções: MailRelay como canal principal,
// Resend como reserva quando o MailRelay não estiver configurado.

export type Destinatario = { email: string; nome?: string | null };

export async function enviarEmail(dest: Destinatario, assunto: string, html: string): Promise<void> {
  const remetente = Deno.env.get('ADMIN_EMAIL_FROM') ?? 'noreply@mulheresemconvergencia.com.br';
  const mrKey = Deno.env.get('MAILRELAY_API_KEY');
  const mrHost = Deno.env.get('MAILRELAY_HOST');

  if (mrKey && mrHost) {
    const res = await fetch(`https://${mrHost}/api/v1/send_emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-AUTH-TOKEN': mrKey },
      body: JSON.stringify({
        from: { email: remetente, name: 'Mulheres em Convergência' },
        to: [{ email: dest.email, name: dest.nome || dest.email }],
        subject: assunto,
        html_part: html,
      }),
    });
    if (!res.ok) throw new Error(`MailRelay ${res.status}: ${await res.text()}`);
    return;
  }

  const resend = Deno.env.get('RESEND_API_KEY');
  if (!resend) throw new Error('Nenhum canal de e-mail configurado (MAILRELAY_* ou RESEND_API_KEY)');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resend}` },
    body: JSON.stringify({
      from: `Mulheres em Convergência <${remetente}>`,
      to: [dest.email],
      subject: assunto,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
