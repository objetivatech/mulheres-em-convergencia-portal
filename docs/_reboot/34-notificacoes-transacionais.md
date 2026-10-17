# 34 — Notificações transacionais por e-mail

Atualizado: 17/10/2026 · Banco novo `tysvpeprhokdijquprkd` (MeC-v6)

## Parte 1 — Técnico

- **Modelos**: `supabase/functions/_shared/notificacoes.ts` — todos usam o `layout()` de
  `email-templates/marca.ts` (identidade visual MeC) e saem pelo `enviar-email.ts`
  (Sender.net → Resend).
- **Função central**: `notificar-app` (JWT validado no código). O chamador precisa ser o
  autor da ação ou admin; destinatário e conteúdo são sempre buscados no banco, nunca
  vindos do navegador. Ações:
  `avaliacao_negocio`, `comentario_blog`, `conexao_solicitada`, `conexao_aceita`,
  `mensagem_conecta`, `indicacao_conecta`, `matricula_academy`, `cortesia_concedida`.
- **Frontend**: `src/lib/notificar.ts` (`notificarApp`, fire-and-forget) chamado pelos hooks
  `useCatalogo` (avaliação), `useBlogExtras` (comentário), `useConectaRede` (conexão e
  mensagem), `useConectaNovo` (indicação), `useAcademyNova` (matrícula) e
  `useAdminNovo` (cortesia).
- **Eventos**: inscrição gratuita envia confirmação na hora em `criar-cobranca`;
  inscrição paga e boas-vindas de plano saem do `asaas-webhook` após o acesso ser
  concedido. O webhook também avisa a embaixadora quando o pagamento veio de indicação
  (`embaixadora_indicacoes.pagamento_id`).
- **Idempotência**: `evento_inscricoes.confirmacao_enviada_em` marca quem já recebeu;
  o webhook não reenvia e o reenvio retroativo só pega quem está com o campo vazio.
- **Reenvio retroativo**: `reenviar-confirmacoes-eventos` (admin ou chamada
  servidor-a-servidor com a service key). Ações: `simular` (lista sem enviar) e envio em
  lote (`limite`, padrão 100). Botão em **Painel → Automações → Confirmações de evento**.

## Parte 2 — Operacional (equipe)

| Ação da usuária | Quem recebe | Modelo |
|---|---|---|
| Inscrever-se em encontro gratuito | A inscrita | Confirmação com data, local e link do ingresso |
| Pagar inscrição em encontro | A inscrita | Mesma confirmação, após o pagamento confirmar |
| Assinar um plano | A assinante | Boas-vindas com link para a área |
| Avaliar um negócio | A dona do negócio | Nota em estrelas + comentário |
| Comentar no blog | Toda a equipe (admins) | Trecho do comentário + link do post |
| Pedir conexão no Conecta+ | A convidada | Pedido + mensagem |
| Aceitar conexão | Quem convidou | Aviso de conexão aceita |
| Enviar mensagem no Conecta+ | A destinataria | Trecho da mensagem |
| Indicar alguém no Conecta+ | A indicada | Descrição da oportunidade |
| Matricular-se na Academy | A aluna | Confirmação com link do curso |
| Receber cortesia da equipe | A beneficiada | Área liberada, prazo e motivo |
| Indicação de embaixadora virar pagamento | A embaixadora | Aviso de comissão a caminho |

Se algum envio falhar, a ação da usuária **não** é desfeita — o erro fica no log da
função correspondente (Supabase → Edge Functions → logs).

## Parte 3 — Manual simples

**Reenviar confirmação de evento para quem não recebeu**
1. Entre no Painel da equipe e clique em **Automações**.
2. No cartão **Confirmações de evento por e-mail**, veja quantas inscritas estão pendentes.
3. Clique em **Reenviar confirmações pendentes**. Pronto — cada uma recebe o e-mail com
   o link do ingresso.

Nada é enviado sozinho para quem já recebeu: o sistema marca cada inscrição após o envio.
