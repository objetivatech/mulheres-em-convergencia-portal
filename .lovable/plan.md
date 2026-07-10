## Diagnóstico

Investiguei os dois casos e o pipeline completo `asaas-webhook` → `process_subscription_payment` → `deactivate_expired_businesses` → `sync-subscription-status`. Encontrei **4 falhas estruturais**:

### 1. Múltiplas assinaturas duplicadas por usuário (raiz do caso Luciana)
Luciana tem **3 registros** em `user_subscriptions` com `external_subscription_id` diferentes (`sub_dvl9wx1xlolcw8yg`, `sub_z6dqcfomjnbqujjd`, e uma nova de 08/07). Cada tentativa de recompra cria uma nova linha em vez de reativar a existente. O webhook casa o pagamento com uma delas, mas `process_subscription_payment` usa `ORDER BY created_at DESC LIMIT 1` — não garante que renove a assinatura que recebeu o pagamento, e não há reconciliação entre as demais.

### 2. Nenhum mecanismo de reativação após pagamento em atraso
`deactivate_expired_businesses()` roda diariamente e desativa negócios com `subscription_renewal_date + 5 dias < hoje`. Se a cliente paga **depois** disso (Luciana pagou em 08/07 com vencimento em 30/06), o webhook `PAYMENT_RECEIVED` chega, mas:
- Se a assinatura interna está `cancelled/expired`, o webhook até tenta reativá-la (linha 739), porém `renew_business_subscription` pode falhar silenciosamente (retorna `false` sem log de erro).
- Não há verificação de sanidade "assinatura ativa ⇒ negócio ativo".

### 3. Divergência entre módulos (Gestão de Usuários × Jornada × Contatos)
- **Gestão de Usuários** lê `businesses.subscription_active` direto.
- **Jornada do Cliente** lê `crm_deals.stage`.
- **Contatos/Timeline** lê `crm_interactions` e `crm_conversion_milestones`.

Como o webhook grava milestones e deals mesmo quando a renovação do negócio falha, os três módulos ficam inconsistentes. Não existe uma **view única de verdade** do status do assinante.

### 4. Caso Paola (assinou 08/07)
`user_subscriptions.status = 'active'` mas `businesses.subscription_active = false` e `subscription_renewal_date = NULL`. Ou o webhook processou antes do `INSERT` do business estar visível, ou `renew_business_subscription` executou com 0 linhas afetadas e retornou `false` sem alertar ninguém. **Nenhum reconciliador detecta esse desvio.**

---

## Plano de correção

### Fase 1 — Correções imediatas (dados)
1. **Reconciliação manual** de Luciana Bettoni e Paola Dias:
   - Executar `renew_business_subscription` para ambos os negócios.
   - Marcar `user_subscriptions.status = 'active'` na assinatura correta e `'superseded'` nas antigas de Luciana.
2. **Varredura de inconsistências** — migration que identifica e corrige:
   - `user_subscriptions.status = 'active'` **AND** `businesses.subscription_active = false` (não cortesia).
   - Usuários com múltiplas linhas `active/pending` em `user_subscriptions`.

### Fase 2 — Endurecer o webhook `asaas-webhook`
1. Ao processar `PAYMENT_RECEIVED/CONFIRMED`, chamar **sempre** `renew_business_subscription` para **todos** os negócios do usuário e **falhar alto** (logStep CRITICAL + `crm_interactions` de alerta) se `renewal_count = 0`.
2. Marcar como `superseded` outras `user_subscriptions` do mesmo usuário que não correspondem à assinatura paga.
3. Se `businesses` tem `subscription_active=false` e recebemos pagamento válido, forçar reativação (chamar `renew_business_subscription`) e registrar `late_payment_recovery` no CRM.

### Fase 3 — Refatorar `process_subscription_payment` (SQL)
- Aceitar `p_subscription_id` como argumento para renovar **a assinatura certa**.
- Renovar negócios mesmo quando a linha `user_subscriptions` esteja `cancelled` mas o Asaas retornou `PAYMENT_RECEIVED` recente.
- Emitir `RAISE WARNING` quando `renewal_count = 0` para aparecer nos logs.

### Fase 4 — Reconciliador diário
- Nova função SQL `reconcile_subscription_business_consistency()`:
  - Detecta `user_subscriptions.status = active` + `businesses.subscription_active = false` e reativa.
  - Detecta múltiplas subs ativas por usuário e mantém só a mais recente.
  - Registra tudo em `crm_interactions` com `interaction_type='auto_reconciliation'`.
- Cron diário às 05:00 UTC (após `sync-subscription-status` e `deactivate_expired_businesses`).

### Fase 5 — View única de verdade
- Criar view `public.v_subscriber_status` unindo `profiles`, `user_subscriptions`, `businesses`, último `PAYMENT_RECEIVED` do Asaas e último `crm_milestone`.
- Substituir as leituras dos 3 painéis (Gestão de Usuários, Jornada, Contatos) por essa view → elimina divergências.

### Fase 6 — Painel admin de saúde de assinaturas
- Nova aba em `/admin/crm/financeiro` "Saúde das Assinaturas":
  - Contadores: `active_ok`, `active_business_off` (alerta vermelho), `overdue_grace`, `duplicadas`.
  - Botão "Reconciliar agora" que chama `reconcile_subscription_business_consistency()`.

### Fase 7 — Varredura de features similares
Aplicar o mesmo padrão de reconciliação para:
- `academy_subscriptions` (mesmo risco).
- `event_registrations` com `payment_status=paid` mas contador do evento não atualizado.
- `ambassador_referrals` sem `commission_amount` calculado.

### Fase 8 — Memória e documentação
- Nova memória `mem://architecture/subscription-business-consistency-standard`.
- Atualizar `docs/_active/02-assinaturas/sync-asaas.md` com:
  - Fluxo revisado, invariantes de consistência, cron jobs, contatos de suporte, playbook para "cliente pagou mas ficou inativo".
- Criar `docs/_active/02-assinaturas/troubleshooting-pagamentos.md` com o playbook de reconciliação.

---

## Detalhes técnicos

- Migrations: novas funções SQL + cron; view; UPDATEs de reconciliação para Luciana/Paola.
- Edge functions: `asaas-webhook` (endurecer), novo `admin-reconcile-subscriptions` (chamado pelo botão do painel).
- Front: nova aba `AdminSubscriptionHealth.tsx`.
- Todas as políticas RLS reaproveitam `has_role('admin')`.
- Nenhum breaking change de esquema — apenas adições e correções.

Posso executar tudo em uma única thread, ou dividir por fase para revisão intermediária. Confirma prosseguir?