# Sincronização com ASAAS

## Visão Geral

O sistema sincroniza automaticamente o status das assinaturas no ASAAS com o banco de dados local, garantindo que negócios inadimplentes sejam desativados do diretório e que as roles dos usuários sejam consistentes.

## Componentes

### 1. Edge Function: `sync-subscription-status`

Função principal de sincronização. Processa **todas** as assinaturas com status `pending` ou `active`.

**Fluxo:**
1. Busca todas as assinaturas com `external_subscription_id` não nulo
2. Consulta o ASAAS para obter o status real de cada assinatura
3. **Ativa** assinaturas confirmadas (ACTIVE, RECEIVED, CONFIRMED)
4. **Desativa** assinaturas inadimplentes (OVERDUE, CANCELED, EXPIRED)
5. **Verifica expiração local**: mesmo sem resposta do ASAAS, desativa assinaturas com `expires_at` no passado (+ grace period)
6. Ao desativar, remove roles `business_owner` e `subscriber` se não houver outros negócios ativos
7. Registra todas as ações no CRM (`crm_interactions`) e activity log

**Grace Period:** 5 dias após a expiração antes de desativar automaticamente.

**Chamada manual (admin):**
```typescript
supabase.functions.invoke('sync-subscription-status', {
  body: { force: true } // processa todas
  // ou { user_id: 'uuid' } // processa apenas um usuário
});
```

### 2. Edge Function: `renew-business-subscriptions`

Função complementar que:
1. Chama `deactivate_expired_businesses()` para desativar negócios expirados
2. Verifica assinaturas ativas que precisam de renovação de período

### 3. Função SQL: `deactivate_expired_businesses()`

Desativa negócios onde:
- `subscription_renewal_date` está no passado (+ 5 dias grace), OU
- `subscription_renewal_date` é NULL mas `subscription_expires_at` está no passado (+ 5 dias grace)
- **Exclui** negócios com `is_complimentary = true`

Ao desativar:
- Cancela `user_subscriptions` correspondente
- Remove roles `business_owner` e `subscriber` se não houver outros negócios ativos
- Registra no CRM e activity log

### 4. Trigger: `trg_handle_business_deactivation`

Trigger automático em `businesses` que, quando `subscription_active` muda de `true` para `false`:
- Verifica se o owner possui outros negócios ativos
- Se não, remove roles `business_owner` e `subscriber`

## Cron Jobs

| Job | Horário | Função |
|-----|---------|--------|
| `sync-subscriptions-daily` | 03:00 UTC | `sync-subscription-status` com `force: true` |
| `deactivate-expired-daily` | 04:00 UTC | `renew-business-subscriptions` |

## Webhook: PAYMENT_RECEIVED

O `asaas-webhook` processa eventos `PAYMENT_RECEIVED`:
1. Identifica a assinatura pelo `externalReference` (user_id) ou `subscriptionId`
2. Ativa a assinatura e negócio no banco (`subscription_active = true`)
3. Registra interação no CRM como `payment_received`
4. Processa comissão de embaixadora (`processAmbassadorCommission()`):
   - Verifica se a assinatura tem `ambassador_id` associado
   - Cria registro em `ambassador_referrals`
   - Atualiza totais via RPC `increment_ambassador_totals` (atômico)
   - Verifica conquistas e milestones de gamificação

## Webhook: PAYMENT_OVERDUE

O `asaas-webhook` processa eventos `PAYMENT_OVERDUE`:
1. Registra no CRM como `payment_overdue`
2. Conta ocorrências nos últimos 60 dias
3. Após 2+ eventos, desativa a assinatura e negócios do usuário
4. Remove roles se não houver negócios ativos restantes

## Fluxo de Desativação Completo

```
ASAAS reporta OVERDUE/CANCELED
    ↓
sync-subscription-status detecta
    ↓
user_subscriptions.status → 'cancelled'
    ↓
businesses.subscription_active → false (trigger disparado)
    ↓
trg_handle_business_deactivation verifica outros negócios
    ↓
Se nenhum ativo: remove roles business_owner + subscriber
    ↓
CRM interaction registrada
```

## Consistência entre Módulos

### Módulos Afetados
- **user_subscriptions**: Status da assinatura
- **businesses**: Visibilidade no diretório
- **user_roles**: Roles do usuário (business_owner, subscriber)
- **crm_interactions**: Histórico de ações
- **user_activity_log**: Log de atividades

### Regra de Ouro
> Se não há assinatura ativa E o negócio não é cortesia (`is_complimentary = false`), o negócio DEVE estar com `subscription_active = false` e o usuário NÃO DEVE ter a role `business_owner`.

### Exceção: Cortesia
Negócios com `is_complimentary = true` são **permanentes** e nunca são desativados pelo sistema de sincronização.
