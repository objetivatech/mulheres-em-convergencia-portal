---
name: E-mails pelo Sender.net
description: Sender.net é o provedor único de e-mail (transacional + newsletter); MailRelay abandonado por cobrar transacionais
type: feature
---
- Decisão do usuário (28/09/2026): Sender.net substitui MailRelay para transacionais e newsletters. Base atual ~1.600 contatos (free: 2.500 contatos, 15.000 envios/mês).
- Ordem de canais: Sender.net → MailRelay → Resend (reserva).
- Newsletter gerida em /painel-conteudo/newsletter; Supabase Auth usa SMTP smtp.sender.net:587.
- Domínio remetente: mulheresemconvergencia.com.br (SPF/DKIM/DMARC no Cloudflare).
- Docs: docs/_reboot/27-emails-sender.md.
