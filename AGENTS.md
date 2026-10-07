# AGENTS

- Todo envio de e-mail das funções passa por `supabase/functions/_shared/enviar-email.ts` (Sender.net → MailRelay → Resend) — troca de provedor em um só lugar.
- Newsletter é operada pela função `sender-newsletter` com admin validado no código — o token do Sender nunca vai ao navegador.
- Toda imagem de associada fica em `usuarias/<uid>/<categoria>/` no R2 e o isolamento é imposto em `r2-storage` — nunca confiar na pasta pedida pelo navegador.
- Escritas em `concessoes_acesso` só por RPC security definer com admin validado — a tabela não aceita escrita direta.
