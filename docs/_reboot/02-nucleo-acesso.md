# Reboot — Núcleo de Acesso

O módulo que resolve a dor central: status de assinante divergente entre telas e negócio que não reativa após pagamento em atraso.

## Regra única

> Uma pessoa tem acesso a um recurso quando existe **uma concessão de acesso vigente** para ela. Nada mais concede acesso. Nenhuma tabela guarda uma cópia dessa resposta.

`businesses.subscription_active`, `businesses.is_complimentary` e `user_subscriptions.status` deixam de existir como fontes de verdade. Visibilidade no diretório, acesso ao Conecta+, ao Academy e aos painéis passam todos a ser consequência da mesma consulta.

## Como o legado falha hoje

Reconstituição do caso Luciana Bettoni a partir do que está no banco:

1. Vencimento passa, `deactivate_expired_businesses` roda às 04:00 e marca `subscription_active = false`.
2. Trigger `handle_business_deactivation` remove as roles `business_owner` e `subscriber`.
3. Pagamento atrasado chega no Asaas → `PAYMENT_RECEIVED`.
4. O webhook procura uma assinatura `pending`/`active` para casar. Não acha (está `cancelled`), ou casa com a linha errada quando há duplicatas.
5. `crm_interactions` registra "pagamento confirmado" — daí a Jornada do Cliente mostrar pago.
6. `businesses` continua inativo e as roles continuam removidas — daí Gestão de Usuários mostrar inativo.

Três telas, três respostas, porque cada uma lê uma tabela diferente que ninguém garantiu estarem de acordo. As correções que já aplicamos (reconciliador diário, `v_subscriber_status`, painel de saúde) tratam o sintoma: existem justamente porque o estado consegue divergir.

## Estrutura nova

Três camadas com responsabilidades separadas:

**1. Eventos de pagamento (bruto, imutável)**
Todo callback do Asaas é gravado antes de qualquer interpretação: payload completo, tipo, identificadores, data de recebimento, status de processamento. Nunca é editado. Se a interpretação falhar ou estiver errada, o evento é reprocessado a partir do registro original — hoje isso é impossível.

**2. Concessões de acesso**
Cada concessão registra: quem, qual recurso, vigência (início e fim), origem (pagamento, cortesia, decisão administrativa, importação), quem concedeu e o evento que a originou. Concessões nunca são apagadas nem editadas retroativamente — uma nova substitui a anterior, preservando o histórico.

Consequências diretas:
- **Pagamento atrasado** é o caminho normal: o evento gera uma concessão nova, com vigência a partir da data do pagamento. Não existe estado "cancelado demais para reativar".
- **Cortesia** é uma concessão de origem administrativa, com ou sem prazo. Não é uma flag no negócio.
- **Duplicidade** deixa de importar: se há duas concessões vigentes, a pessoa tem acesso — sem `superseded`, sem deduplicação.

**3. Leitura de acesso**
Uma única função responde, para uma pessoa e um recurso: tem acesso, até quando, por qual origem. Todas as telas, políticas de segurança e edge functions usam essa função. Nenhuma recalcula.

## O que some junto

- Cron `deactivate-expired-daily`, `sync-subscriptions-daily`, `reconcile-subscription-business-daily`
- Funções `process_subscription_payment`, `reconcile_subscription_business_consistency`, `deactivate_expired_businesses`, `renew_business_subscription`, `handle_business_deactivation`
- View `v_subscriber_status` e o painel "Saúde das Assinaturas" — sem estado duplicado, não há inconsistência para monitorar

Permanece uma tarefa agendada única: conciliação com o Asaas, que compara concessões vigentes com as cobranças reais e **relata** divergências sem corrigir silenciosamente.

## Roles e acesso

Roles continuam em tabela própria com verificação por função de segurança — esse padrão está correto e se mantém. A mudança: roles deixam de ser criadas e removidas por triggers de pagamento. `business_owner` e `subscriber` viram consequência de concessão vigente, não linhas manipuladas em cascata.

## Critério de aceite da Fase 1

Reproduzir no ambiente novo, com verificação, os casos que quebraram:

1. Pagamento em dia → acesso imediato, negócio no diretório
2. Pagamento 15 dias após o vencimento → acesso restabelecido, sem intervenção manual
3. Cortesia concedida pelo admin → acesso sem cobrança, sem prazo
4. Duas cobranças do mesmo assinante → um único acesso coerente
5. Webhook recebido duas vezes → resultado idêntico (idempotência)
6. Webhook com payload inesperado → registrado, marcado como não processado, sem quebrar o fluxo
7. Cancelamento → acesso cessa no fim da vigência paga, não na hora
