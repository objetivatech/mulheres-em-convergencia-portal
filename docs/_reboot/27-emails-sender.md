# 27 — E-mails pelo Sender.net (transacionais e newsletter)

Atualizado: 28/09/2026

## Parte 1 — Técnico

- **Canal único de envio**: `supabase/functions/_shared/enviar-email.ts`.
  Ordem: Sender.net (`SENDER_API_TOKEN`) → MailRelay (legado) → Resend (reserva).
  Endpoint: `POST https://api.sender.net/v2/message/send` com `from`, `to`, `subject`, `html`.
  Remetente: `SENDER_FROM_EMAIL`, senão `ADMIN_EMAIL_FROM`, senão `noreply@mulheresemconvergencia.com.br`.
  Todas as funções que já usavam `enviarEmail` (comunicados, recuperação de senha etc.) passam a sair pelo Sender sem outra mudança.
- **Newsletter**: função `sender-newsletter` (só administradoras, validado no código). Ações:
  `situacao`, `grupos`, `criar_grupo`, `contatos`, `adicionar_contato`, `sincronizar_portal`
  (envia e-mails principais de `pessoa_contatos` para uma lista), `campanhas`, `criar_campanha`,
  `teste_campanha`, `enviar_campanha`, `excluir_campanha`.
- **Tela**: `/painel-conteudo/newsletter` (`src/pages/painel/NewsletterPage.tsx`).
- **E-mails automáticos do Supabase Auth** (confirmação, recuperação nativa, convite): via SMTP do Sender, configurado no painel do Supabase.
- As funções antigas `mailrelay-*` e a tela `/admin/newsletter` ficam desativadas; não são chamadas pelo portal novo.

## Parte 2 — Operacional (equipe)

Configuração única:
1. Sender.net → **Settings → Domains**: adicionar `mulheresemconvergencia.com.br` e criar no Cloudflare os registros SPF, DKIM e DMARC indicados. Aguardar "Verified".
2. Sender.net → **Settings → API access tokens**: gerar um token e cadastrá-lo no portal como `SENDER_API_TOKEN`.
3. Supabase → Authentication → **SMTP Settings**: host `smtp.sender.net`, porta `587`, usuário e senha do SMTP do Sender (Transactional emails → SMTP), remetente do domínio.
4. Importar a base do MailRelay: exportar CSV no MailRelay e importar no Sender (Subscribers → Import) em uma lista.
5. Em **Comunicados → Testar canal de e-mail** deve aparecer `Sender.net`.

Se algo falhar:
- `Sender.net 401` → token errado ou apagado; gerar outro e atualizar.
- `Sender.net 422` → remetente não verificado ou campo vazio; conferir o domínio.
- `Sender.net 429` → limite por minuto; esperar e repetir.
- Voltar ao canal anterior: apagar o `SENDER_API_TOKEN` — o envio volta sozinho para MailRelay/Resend.

Limites do plano gratuito: até 2.500 contatos e 15.000 envios por mês; enviar a base em lotes nos primeiros dias.

## Parte 3 — Manual simples

**Criar e enviar uma newsletter**
1. Entre no Painel da equipe e clique em **Newsletter**.
2. Em **Campanhas**, escreva o nome, o assunto e o texto (pode colocar imagens e tabelas).
3. Marque para qual lista vai.
4. Coloque o seu e-mail e clique em **Enviar teste**. Confira na sua caixa de entrada.
5. Clique em **Salvar campanha**. Ela aparece à direita como rascunho.
6. Quando estiver pronta, clique em **Enviar** nela e confirme.

**Colocar pessoas numa lista**
- Aba **Listas e contatos** → crie a lista → **Trazer pessoas do portal** envia todas as cadastradas.
- Para uma pessoa só: preencha nome e e-mail e clique em **Adicionar**.
