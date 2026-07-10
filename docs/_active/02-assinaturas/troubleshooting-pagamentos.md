# Troubleshooting: Pagamentos e Consistência de Assinaturas

## Sintomas comuns

### "Cliente pagou mas o negócio está inativo"
1. Confirme o pagamento em `crm_interactions` (procure `subscription_payment_confirmed` recente).
2. Abra **Admin → CRM → Financeiro → Saúde das Assinaturas**.
3. Se aparecer na lista **Inconsistente**, clique **Reconciliar agora**.
4. Se persistir, verifique `v_subscriber_status` para o `user_id` e inspecione o `subscription_status` × `business_active`.

### "Cliente pagou em atraso"
O webhook agora força reativação mesmo após grace period. Se falhar, o reconciliador diário (05:00 UTC) captura via `crm_interactions` das últimas 24h.

### "Duplicidade de assinaturas"
`process_subscription_payment` marca assinaturas antigas como `superseded` automaticamente. Para forçar limpeza histórica, rode a reconciliação manual.

## Funções e cron

| Componente | Frequência | Responsabilidade |
|-----------|-----------|-------------------|
| `asaas-webhook` | On event | Recebe pagamento, marca assinatura correta, renova negócios |
| `process_subscription_payment(user_id, payment_id, amount, subscription_id)` | Chamado pelo webhook | Renova negócios e limpa duplicatas |
| `sync-subscription-status` | Diário 03:00 UTC | Consulta Asaas e ativa/desativa |
| `deactivate_expired_businesses` | Diário 04:00 UTC | Desativa após 5 dias grace |
| `reconcile_subscription_business_consistency` | Diário 05:00 UTC | Corrige `active + business_off`, duplicatas, pagamentos recentes |

## Invariantes

- Um usuário deve ter **no máximo uma** `user_subscriptions.status = 'active'`.
- Se `user_subscriptions.status = 'active'` e negócio não é cortesia, então `businesses.subscription_active = true`.
- Todo `PAYMENT_RECEIVED` deve renovar pelo menos 1 negócio; caso contrário registra `payment_no_business_renewed`.

## View de saúde

`SELECT * FROM v_subscriber_status WHERE health_status = 'inconsistent_active_off';`

## Playbook manual

```sql
-- Reativar manualmente
SELECT renew_business_subscription('<business_uuid>');

-- Marcar assinaturas antigas como superseded
UPDATE user_subscriptions SET status = 'superseded'
WHERE user_id = '<user_uuid>' AND id != '<keep_id>' AND status IN ('active','pending');

-- Rodar reconciliador
SELECT reconcile_subscription_business_consistency();
```