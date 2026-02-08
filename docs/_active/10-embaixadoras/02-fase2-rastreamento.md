# Fase 2: Rastreamento e Atribuição de Indicações

## Visão Geral

A Fase 2 implementa o rastreamento de indicações desde o clique no link até a confirmação do pagamento, calculando automaticamente as comissões das embaixadoras.

## Componentes Implementados

### 1. Hook `useReferralTracking`
**Arquivo:** `src/hooks/useReferralTracking.ts`

Gerencia o ciclo de vida do código de indicação:

```typescript
const { getReferralCode, setReferralCode, trackClick, clearReferralCode } = useReferralTracking();

// Rastrear clique no link
await trackClick('ABC123');

// Recuperar código do cookie
const code = getReferralCode(); // 'ABC123'

// Limpar após conversão
clearReferralCode();
```

**Detalhes:**
- **Cookie de 30 dias:** `mec_referral` armazenado com expiração de 30 dias
- **First-click attribution:** Não sobrescreve código existente
- **RPC `track_referral_click_extended`:** Registra cliques com UTM parameters
- **Segurança:** Try-catch para não quebrar fluxo em caso de erro

### 2. Atualização `create-subscription`
**Arquivo:** `supabase/functions/create-subscription/index.ts`

Integração do código de referral no fluxo de assinatura:

```typescript
// Request body agora suporta referral_code
{
  "plan_id": "...",
  "billing_cycle": "monthly",
  "referral_code": "ABC123", // NOVO
  "customer": { ... }
}
```

**Fluxo:**
1. Recebe `referral_code` do body
2. Valida embaixadora via RPC `get_ambassador_by_referral`
3. Obtém `ambassador_id` se embaixadora ativa
4. Salva `referral_code` e `ambassador_id` na tabela `user_subscriptions`

**Logs:**
- ✅ `"Ambassador found for referral"` - embaixadora validada
- ℹ️ `"Ambassador not found or inactive"` - código inválido ou embaixadora inativa

### 3. Atualização `asaas-webhook`
**Arquivo:** `supabase/functions/asaas-webhook/index.ts`

Processamento de comissões ao confirmar pagamento de assinatura.

#### Função `processAmbassadorCommission()`
Acionada quando pagamento é confirmado:

```typescript
await processAmbassadorCommission(supabaseClient, subscription, payment);
```

**Lógica de Cálculo:**
1. **Taxa:** 15% sobre `payment.value`
2. **Data de Elegibilidade (dia 20/10):**
   - Se pagamento até dia 20: pago no dia 10 do mês seguinte
   - Se pagamento após dia 20: pago no dia 10 do mês subsequente
3. **Registros Criados:**
   - `ambassador_referrals` - registro da venda
   - Atualiza `ambassadors` - totals (`total_earnings`, `pending_commission`)

**Exemplo de Cálculo:**
```
Pagamento: 5 de fevereiro 2026, R$ 100,00
↓
Comissão: 15% × R$ 100,00 = R$ 15,00
Status: 'confirmed'
Data de Pagamento: 10 de março 2026 (próximo mês após cutoff)

---

Pagamento: 25 de fevereiro 2026, R$ 100,00
↓
Comissão: 15% × R$ 100,00 = R$ 15,00
Status: 'confirmed'
Data de Pagamento: 10 de abril 2026 (dois meses após cutoff)
```

## Fluxo Completo: Cookie → Assinatura → Comissão

```
┌─────────────────────────────────────────┐
│ 1. Visitante clica link de embaixadora   │
│    /convite/ABC123?utm_source=whatsapp  │
└────────────────────┬────────────────────┘
                     │
                     ▼
            ┌────────────────────┐
            │ trackClick('ABC123')│
            │ - RPC tracked      │
            │ - Cookie saved     │
            └────────────┬───────┘
                         │
                         ▼
            ┌────────────────────┐
            │ 2. Landing Page    │
            │ /convite/ABC123    │
            │ (mostra embaixadora)│
            └────────────┬───────┘
                         │
                         ▼
            ┌────────────────────┐
            │ 3. Cadastro        │
            │ /entrar (signup)   │
            │ (cookie mantido)   │
            └────────────┬───────┘
                         │
                         ▼
            ┌────────────────────┐
            │ 4. Assinatura      │
            │ getReferralCode()  │
            │ → ABC123           │
            │ ambassador_id OK   │
            └────────────┬───────┘
                         │
                         ▼
            ┌────────────────────┐
            │ 5. Pagamento Asaas │
            │ externalRef:       │
            │ subscription_...   │
            └────────────┬───────┘
                         │
                         ▼
            ┌────────────────────┐
            │ 6. Webhook         │
            │ PAYMENT_RECEIVED   │
            │ processAmbassador()│
            │ → Comissão criada  │
            └────────────────────┘
```

## Dados Armazenados

### Tabela `user_subscriptions`
Campos novos:
```sql
referral_code TEXT              -- 'ABC123'
ambassador_id UUID REFERENCES   -- ID da embaixadora
```

### Tabela `ambassador_referral_clicks`
```sql
id UUID
ambassador_id UUID
referral_code TEXT
visitor_ip TEXT
user_agent TEXT
utm_source TEXT                 -- 'whatsapp', 'instagram', etc
utm_medium TEXT
utm_campaign TEXT
created_at TIMESTAMPTZ          -- Timestamp do clique
```

### Tabela `ambassador_referrals`
```sql
id UUID
ambassador_id UUID
referred_user_id UUID
subscription_id UUID
plan_name TEXT                  -- Ex: 'Plan Pro'
sale_amount NUMERIC             -- Ex: 99.90
commission_rate NUMERIC         -- 15.00
commission_amount NUMERIC       -- Ex: 14.99
status TEXT                     -- 'confirmed', 'paid'
payment_confirmed_at TIMESTAMPTZ
payout_eligible_date DATE       -- '2026-03-10'
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### Tabela `ambassadors`
Campos atualizados:
```sql
total_earnings NUMERIC          -- Soma de todas as comissões
pending_commission NUMERIC      -- Comissões não pagas
next_payout_date DATE          -- Próximo pagamento previsto
```

## Tratamento de Erros

### Referral Code Inválido
```javascript
// Se referral_code não encontrar embaixadora ativa
// A assinatura é criada mas SEM embaixadora
ambassadorId = null
```

### Webhook Falha na Comissão
```javascript
// Se processAmbassadorCommission falhar:
// - Assinatura é ativada normalmente
// - Comissão não é criada (log de erro registrado)
// - Pode ser reprocessada manualmente via admin
```

## Segurança

1. **RLS Policies:** Embaixadoras só veem seus `ambassador_referrals` (via `ambassador_id`)
2. **Validação de Embaixadora:** Apenas embaixadoras ativas (`active = true`) recebem comissões
3. **Idempotência:** Webhook valida se evento já foi processado
4. **Auditoria:** Todos os eventos registrados em `webhook_events_log`

## Próximos Passos

- **Fase 3:** Landing Page dinâmica `/convite/[codigo]`
- **Fase 4:** Dashboard da embaixadora para visualizar comissões
- **Fase 5:** Admin panel para gestão de pagamentos
