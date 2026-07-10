---
name: Subscription-Business Consistency Standard
description: Invariantes e ferramentas para manter user_subscriptions e businesses sincronizados após pagamentos Asaas
type: feature
---
Regra de ouro: se `user_subscriptions.status = 'active'` e `businesses.is_complimentary = false`, então `businesses.subscription_active = true`. Um usuário deve ter no máximo UMA linha `active`.

Fluxo revisado:
- `asaas-webhook` (PAYMENT_RECEIVED/CONFIRMED) chama `process_subscription_payment(user_id, payment_id, amount, subscription_id)` passando SEMPRE o `subscription_id` da linha que casou.
- `process_subscription_payment` marca outras assinaturas ativas do usuário como `superseded`, renova TODOS os negócios não-cortesia por 31 dias, e emite `payment_no_business_renewed` se nada foi renovado.
- `reconcile_subscription_business_consistency()` roda diariamente às 05:00 UTC (cron `reconcile-subscription-business-daily`): reativa negócios inconsistentes, deduplica assinaturas, força reativação após pagamento recente.
- View `public.v_subscriber_status` com coluna `health_status` (`healthy`, `inconsistent_active_off`, `grace_period`, `inactive`, `complimentary`) é a fonte única para painéis admin.
- Painel `SubscriptionHealthPanel` em `/admin/crm/financeiro` (aba "Saúde das Assinaturas") mostra inconsistências e permite reconciliação manual via edge function `admin-reconcile-subscriptions`.

Nunca criar novas linhas em `user_subscriptions` para o mesmo usuário sem marcar as anteriores como `superseded`.