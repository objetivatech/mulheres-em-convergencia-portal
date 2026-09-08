# 19 — E-mails, contas importadas e comunicados em massa

Atualizado: 08/09/2026 · Banco novo `tysvpeprhokdijquprkd` (MeC-v6)

## 1. Contas importadas

A ação `usuarias` da função `migrar-legado` lê o Auth do banco antigo
(`ngqymbjatenxztrjjdxa`, somente leitura, via `LEGACY_SUPABASE_SERVICE_ROLE_KEY`) e recria as contas no banco novo:

- e-mail já confirmado (`email_confirm: true`), **sem senha** e **sem e-mail automático**;
- cria `pessoas`, `pessoa_contatos` (e-mail principal) e CPF quando existia no perfil antigo;
- concede papel `admin` para `mulheresemconvergencia@gmail.com` e `diogodevitte@outlook.com`;
- idempotente por e-mail e processada em lotes (`limite`, padrão 150, máx. 500).

Resultado da execução de 08/09/2026: **42 contas**, 42 pessoas, 42 contatos, 2 administradoras. Nenhuma notificação enviada.

Como cada pessoa entra: só depois do disparo do comunicado, pelo link de criação de senha. Antes disso ninguém recebe nada.

## 2. Comunicado em massa

Tabelas: `campanhas_email` (texto e situação) e `campanha_envios` (uma linha por destinatária, com `situacao`, `erro`, `enviado_em`), ambas com RLS administrativo.
Campanha inicial: chave `reboot-boas-vindas`, situação `rascunho`.

Função `notificar-usuarias` (admin, valida JWT no código):

| ação | efeito |
|---|---|
| `situacao` | totais: na lista, enviados, erros, pendentes |
| `preparar` | (re)monta a lista a partir de `auth.users`, idempotente |
| `teste` | envia uma única mensagem para o e-mail informado |
| `disparar` | envia um lote (1 a 300) das pendentes e grava o resultado |

Cada mensagem carrega um link de recuperação gerado pelo Supabase, apontando para `/reset-password`.

Tela: **Painel de conteúdo → Comunicados** (`/painel-conteudo/comunicados`) — editar texto, testar, atualizar a lista e enviar lote por lote. Nada é enviado sem clique.

## 3. Modelos de e-mail com o visual novo

- Modelos usados pelas funções: `supabase/functions/_shared/email-templates/marca.ts`.
- Envio: `supabase/functions/_shared/enviar-email.ts` (MailRelay principal, Resend como reserva).
- Modelos dos e-mails automáticos do Supabase, prontos para colar: `supabase/templates/*.html`
  (confirmação de cadastro, recuperar senha, link de acesso, convite, troca de e-mail, código de verificação).

## 4. O que depende de ação manual sua

Configuração de e-mail **não** é copiada entre projetos Supabase. No projeto novo:

1. **Templates do Auth** — Authentication → Emails → Templates: colar o conteúdo de cada arquivo de `supabase/templates/`.
2. **URLs** — Authentication → URL Configuration: Site URL do portal e Redirect URLs incluindo `/reset-password` e `/confirmar-troca-email`.
3. **SMTP próprio** — Authentication → SMTP Settings com o remetente do domínio (evita o limite baixo de envio do Supabase).
4. **Limite de envio** — Authentication → Rate limits: subir `Emails sent per hour` antes do disparo em massa.
5. **Segredos** já cadastrados no projeto novo: `MAILRELAY_API_KEY`, `MAILRELAY_HOST`, `ADMIN_EMAIL_FROM`, `RESEND_API_KEY`, `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `CRON_SECRET`, `LEGACY_SUPABASE_SERVICE_ROLE_KEY`, `MIGRACAO_TOKEN`.
6. **Asaas** — o webhook segue apontando para o projeto antigo; a troca é o último passo do corte (Fase 7).

## 5. Reversão

- Comunicado: manter a campanha em `rascunho` e não clicar em enviar; nenhum envio acontece sozinho.
- Contas: apagar uma conta importada no Auth do projeto novo não afeta o banco antigo, que segue congelado como produção.
