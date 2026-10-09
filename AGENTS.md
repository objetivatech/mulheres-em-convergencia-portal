# AGENTS

- Todo envio de e-mail das funções passa por `supabase/functions/_shared/enviar-email.ts` (Sender.net → MailRelay → Resend) — troca de provedor em um só lugar.
- Newsletter é operada pela função `sender-newsletter` com admin validado no código — o token do Sender nunca vai ao navegador.
- Toda imagem de associada fica em `usuarias/<uid>/<categoria>/` no R2 e o isolamento é imposto em `r2-storage` — nunca confiar na pasta pedida pelo navegador.
- Escritas em `concessoes_acesso` só por RPC security definer com admin validado — a tabela não aceita escrita direta.
- Páginas para buscadores, sitemap e llms-full leem o banco novo com a chave pública e usam `supabase/functions/_shared/seo.ts` — o que o RLS esconde do site não vaza para buscadores/IAs.
- Médias de avaliação de negócios são calculadas na consulta, nunca gravadas — segue a regra de não gravar estado derivado.
- O link de indicação usado pela IA das embaixadoras é montado no servidor a partir de `embaixadoras.codigo` — nunca aceitar link vindo do navegador.
