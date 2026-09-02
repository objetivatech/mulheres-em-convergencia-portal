# 02 — Núcleo de Acesso

> Módulo único que responde a uma pergunta: **esta pessoa tem acesso a quê, agora, e por quê?**
> É o primeiro módulo do reboot porque é o ponto que hoje causa prejuízo direto ao negócio.

## Como quebra hoje (caso real)

**Luciana Bettoni** — assinatura com vencimento em 30/06, pagamento feito em atraso, em 08/07.

1. Em 05/07 o `deactivate_expired_businesses` roda e grava `businesses.subscription_active = false` (5 dias de carência vencidos).
2. Em 08/07 o Asaas envia `PAYMENT_RECEIVED`. O webhook registra o pagamento, grava marcos no CRM e interações — tudo isso funciona.
3. A reativação do negócio, porém, depende de casar a linha certa em `user_subscriptions` — e a cliente tinha **três** linhas, criadas por tentativas de recompra. A renovação afeta 0 linhas e a função devolve "false" sem alarme.
4. Resultado: **Jornada** diz "pagamento confirmado", **Contatos** mostra o histórico completo de pagamentos, e **Gestão de Usuários** mostra o negócio inativo. O negócio some do diretório com a cliente em dia.

**Paola Dias** — assinou em 08/07, `user_subscriptions.status = 'active'`, negócio inativo e sem data de renovação. Nenhum mecanismo detectou o desvio.

A causa não é o webhook: é o fato de "estar ativa" ser uma **cópia gravada** em vários lugares, que precisa ser mantida em sincronia por gatilhos e rotinas de reconciliação.

## A regra do reboot

> Ninguém grava "ativo". O acesso é o resultado da pergunta: **existe uma concessão vigente para esta pessoa?**

### `concessoes_acesso`

| Campo | Significado |
|---|---|
| `pessoa_id` | quem recebe o acesso |
| `tipo` | `diretorio`, `conecta`, `academy`, `evento`, ... |
| `origem` | `pagamento`, `cortesia`, `administrativo`, `importacao` |
| `pagamento_id` | pagamento que originou (quando origem = pagamento) |
| `inicio_em`, `fim_em` | janela de vigência; `fim_em` nulo = permanente (cortesia) |
| `motivo` | texto livre, obrigatório para cortesia e administrativo |
| `criado_por` | quem concedeu |
| `revogado_em`, `revogado_motivo` | revogação explícita, sem apagar histórico |

Uma pessoa pode ter várias concessões ao longo do tempo. **Nunca se edita uma concessão passada** — cria-se outra.

### Como cada tela responde

| Pergunta | Como se responde |
|---|---|
| O negócio aparece no diretório? | existe concessão `diretorio` vigente para a dona |
| A assinante pode entrar no Conecta+? | existe concessão `conecta` vigente |
| A pessoa está inadimplente? | última concessão de origem `pagamento` venceu e não há nova |
| Está em carência? | venceu há menos de N dias e existe cobrança em aberto |

Não há mais "três painéis com três respostas": todos consultam a mesma função.

## Pagamento em atraso deixa de ser um caso especial

O fluxo passa a ser:

1. Chega o webhook do Asaas → grava em `webhooks_recebidos` (idempotente pelo id do evento).
2. Identifica-se a pessoa: por CPF, por referência externa ou pelo cliente Asaas.
3. Grava-se o `pagamento` com valor, data e cobrança de origem.
4. **Todo pagamento confirmado cria uma concessão** com início na confirmação e fim em +31 dias.

Pagou em atraso? Cria concessão a partir do dia do pagamento. Não existe estado "desativado" para desfazer, então não existe reativação que possa falhar em silêncio.

## Webhook reescrito

Do monolito de 1.286 linhas para peças pequenas:

- `receber` — valida, registra e devolve 200 rápido
- `identificar-pessoa` — CPF/referência/cliente Asaas
- `registrar-pagamento` — grava o fato
- `conceder-acesso` — cria a concessão pelo tipo de cobrança
- `efeitos` — comissão de embaixadora, e-mail, linha do tempo do CRM (falha aqui **não** afeta o acesso)
- `reprocessar` — botão no admin para rodar de novo um evento recebido

## Cortesia e concessão manual

Cortesia vira concessão de origem `cortesia`, com motivo e sem data de fim. Nenhuma rotina automática toca nela — some a necessidade de excluí-la caso a caso.

## Testes de aceitação (obrigatórios antes do corte)

1. Pagamento em dia → concessão de 31 dias, negócio visível.
2. Pagamento **7 dias após o vencimento** → concessão nova a partir do dia do pagamento; negócio volta ao diretório sem intervenção. *(caso Luciana)*
3. Assinatura nova com negócio recém-criado → concessão criada mesmo com o negócio cadastrado depois. *(caso Paola)*
4. Webhook repetido três vezes → uma única concessão e um único pagamento.
5. Cortesia → visível para sempre, imune a rotinas.
6. Três tentativas de recompra da mesma pessoa → concessões somadas em sequência, nenhuma tela divergente.
7. Falha no envio de e-mail → acesso concedido do mesmo jeito.

## Painel de operação

Uma tela para a administração: pessoa, concessão vigente, próximo vencimento, últimos pagamentos, eventos de webhook recebidos e botão de reprocessar. Substitui o painel de "saúde das assinaturas" e as rotinas de reconciliação.
