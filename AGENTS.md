# AGENTS

- Todo envio de e-mail das funções passa por `supabase/functions/_shared/enviar-email.ts` (Sender.net → MailRelay → Resend) — troca de provedor em um só lugar.
- Newsletter é operada pela função `sender-newsletter` com admin validado no código — o token do Sender nunca vai ao navegador.
- Toda imagem de associada fica em `usuarias/<uid>/<categoria>/` no R2 e o isolamento é imposto em `r2-storage` — nunca confiar na pasta pedida pelo navegador.
- Escritas em `concessoes_acesso` só por RPC security definer com admin validado — a tabela não aceita escrita direta.
- Páginas para buscadores, sitemap e llms-full leem o banco novo com a chave pública e usam `supabase/functions/_shared/seo.ts` — o que o RLS esconde do site não vaza para buscadores/IAs.
- Médias de avaliação de negócios são calculadas na consulta, nunca gravadas — segue a regra de não gravar estado derivado.
- O link de indicação usado pela IA das embaixadoras é montado no servidor a partir de `embaixadoras.codigo` — nunca aceitar link vindo do navegador.
- Funções SECURITY DEFINER vivem no schema `private`; em `public` ficam só wrappers SECURITY INVOKER de mesmo nome — mantém o linter limpo sem mudar chamadas do app nem políticas.
- Avaliação de negócio é pública (visitante insere com `pessoa_id` nulo; associada logada mantém uma por negócio) e entra no ar na hora; ocultar é exclusivo de admin — evita a dona censurar notas.
- Inscrição pública na newsletter passa só pela função `newsletter-inscrever` (nome+e-mail, token do Sender no servidor) — o navegador nunca fala direto com o Sender.
- Presença em encontro é a existência de linha em `evento_presencas` (código do QR = `evento_inscricoes.id`) — nunca flag gravada na inscrição.
- Todo texto, foto e link fixo das páginas públicas vem de `textos_site` via catálogo `src/lib/textosCatalogo.ts` (tipos texto/rico/imagem/link) e é editado no "Editor de páginas" ou inline (`TextoSite`/`ImagemSite`) — nada de conteúdo fixo no código além do padrão do catálogo.
- Inscrição em lista do Sender só acontece pelo `ConviteNewsletter` quando a pessoa preenche e confirma; avaliar/comentar nunca inscreve — evita contatos sem consentimento.
- Comentário de blog é público, entra no ar na hora e só a equipe oculta (`oculto_em`) — mesma regra das avaliações.
