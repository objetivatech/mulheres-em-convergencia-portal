# Desativação de Inadimplentes

## Visão Geral

O sistema desativa automaticamente negócios de usuários inadimplentes, removendo-os do diretório e ajustando suas roles no portal.

## Cenários de Desativação

### 1. Expiração por Data (Local)
- `subscription_expires_at` ou `subscription_renewal_date` no passado + 5 dias de grace period
- Processado pela função SQL `deactivate_expired_businesses()` e pelo cron `deactivate-expired-daily`

### 2. Inadimplência no ASAAS
- Status OVERDUE, CANCELED ou EXPIRED detectado via `sync-subscription-status`
- Processado pelo cron `sync-subscriptions-daily`

### 3. Pagamentos Atrasados Recorrentes
- 2+ eventos `PAYMENT_OVERDUE` nos últimos 60 dias
- Processado pelo webhook `asaas-webhook`

### 4. Desativação Manual (Admin)
- Admin pode desativar negócios via painel `/admin/negocios`
- Botão "Desativar Manualmente" no modal de detalhes

## Grace Period

O sistema aplica um **grace period de 5 dias** após a data de expiração antes de desativar. Isso evita desativações por atrasos temporários no processamento do ASAAS.

## Efeitos da Desativação

1. `businesses.subscription_active` → `false`
2. `user_subscriptions.status` → `cancelled` ou `expired`
3. Negócio removido do diretório (não aparece em buscas)
4. Se não houver outros negócios ativos do mesmo owner:
   - Remove role `business_owner` de `user_roles`
   - Remove role `subscriber` de `user_roles`
5. CRM interaction registrada com tipo `subscription_expired_auto` ou `subscription_deactivated_overdue`
6. Activity log registrado

## Proteção de Cortesia

Negócios com `is_complimentary = true` são **sempre protegidos** e nunca são desativados pelo sistema automático.

## Monitoramento Admin

O painel `/admin/negocios` exibe:
- **Alerta de inconsistências**: Banner vermelho quando há negócios com assinatura expirada mas ainda ativos
- **Filtro "Inconsistentes"**: Mostra apenas negócios em estado inconsistente
- **Dias de expiração**: Mostra quantos dias desde a expiração
- **Botão de sincronização**: Força sincronização com ASAAS individual ou em massa
