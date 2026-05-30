# Ambassador Commission Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two bugs that have silently prevented ambassador commissions from ever being registered, backfill the commission for Lizielli's subscription, and ensure CRM records the referral conversion.

**Architecture:** Two independent bugs work together to suppress commissions: (1) `create-subscription` checks `ambassador[0].active` which the RPC never returns, so `ambassador_id` is always saved as NULL; (2) `asaas-webhook` skips commission processing when `ambassador_id` is null with no fallback via `referral_code`. The fix adds a fallback lookup by `referral_code` in the webhook and removes the false `.active` check in the subscription function. A data backfill task repairs the one existing broken subscription (Lizielli).

**Tech Stack:** Supabase Edge Functions (Deno/TypeScript), PostgreSQL, Supabase MCP (`mcp__supabase__execute_sql`, `mcp__supabase__deploy_edge_function`)

---

## Context for the Implementer

### What went wrong

**Bug #1 — `create-subscription/index.ts` line 118:**
The RPC `get_ambassador_by_referral` returns columns `(id, user_id, commission_rate, asaas_split_config)` — it already filters `active = true` in the WHERE clause. The calling code checks `ambassador[0].active`, which is always `undefined` (not returned), always falsy. Result: `ambassador_id` is always saved as NULL in `user_subscriptions`, even when a valid referral code is present.

**Bug #2 — `asaas-webhook/index.ts` `processAmbassadorCommission()`:**
The function immediately returns `{ success: false }` when `subscription.ambassador_id` is null, with no fallback to resolve the ambassador from `subscription.referral_code`. So no commission has ever been created via webhook.

**Confirmed by data:**
- `SELECT COUNT(*) FROM user_subscriptions WHERE ambassador_id IS NOT NULL` → `0`
- Lizielli's subscription: `referral_code = '408A6DD6'`, `ambassador_id = NULL`
- Code `408A6DD6` belongs to ambassador **Fabiana Alves Dias** (`id = 9ba127b7-6b98-4a76-9367-e180f07aad95`)

### ⚠️ PREREQUISITE — Attribution clarification

**Before executing Task 1**, confirm with the project owner which ambassador should receive the commission for Lizielli's subscription:
- **Option A (tracking-based):** The referral link used was Fabiana Alves Dias's (`408A6DD6`)
- **Option B (manual override):** Attribute to Luciana Bettoni (`id = d525017b-8bbb-4c04-ab3f-e8b6a61803bd`) despite no tracking data

The SQL in Task 1 uses Option A. If Option B is chosen, substitute Luciana's ambassador `id` and `user_id` for Fabiana's wherever they appear.

### Key IDs (verified)
| Entity | ID |
|--------|----|
| Lizielli `user_id` | `e50e2510-ae37-44db-a084-3a160f7c02b1` |
| Lizielli `user_subscriptions.id` | `3fc3d95d-be79-4548-b8cb-86969549a742` |
| Lizielli `external_subscription_id` | `sub_9w50hmh2hx5kyh35` |
| Lizielli `referral_code` | `408A6DD6` |
| Fabiana `ambassadors.id` | `9ba127b7-6b98-4a76-9367-e180f07aad95` |
| Fabiana `user_id` (profiles) | (look up: `SELECT user_id FROM ambassadors WHERE id = '9ba127b7-6b98-4a76-9367-e180f07aad95'`) |
| Luciana `ambassadors.id` | `d525017b-8bbb-4c04-ab3f-e8b6a61803bd` |
| Plan price | R$ 39.90 |
| Commission (15%) | R$ 5.985 → round to R$ 5.99 |
| Payment date | 2026-05-28 (day 28 > cutoff day 20) → `payout_eligible_date = 2026-07-10` |

---

## Task 1: Backfill Lizielli's commission data

> ⚠️ Confirm attribution (Fabiana vs Luciana) with project owner before executing. SQL below uses Fabiana (Option A).

**Files:** Supabase DB only (no code files — SQL via MCP)

- [ ] **Step 1: Verify current state before touching anything**

Run via `mcp__supabase__execute_sql` (project `ngqymbjatenxztrjjdxa`):

```sql
SELECT us.id, us.referral_code, us.ambassador_id, us.status,
       ar.id as referral_record_id,
       a.total_sales, a.pending_commission
FROM user_subscriptions us
LEFT JOIN ambassador_referrals ar ON ar.subscription_id = us.id
LEFT JOIN ambassadors a ON a.id = '9ba127b7-6b98-4a76-9367-e180f07aad95'
WHERE us.id = '3fc3d95d-be79-4548-b8cb-86969549a742';
```

Expected: `ambassador_id = NULL`, `referral_record_id = NULL`, `total_sales = 0`, `pending_commission = 0.00`

- [ ] **Step 2: Set `ambassador_id` on the subscription**

```sql
UPDATE user_subscriptions
SET 
  ambassador_id = '9ba127b7-6b98-4a76-9367-e180f07aad95',
  updated_at    = NOW()
WHERE id = '3fc3d95d-be79-4548-b8cb-86969549a742';
```

Expected: `UPDATE 1`

- [ ] **Step 3: Create the `ambassador_referrals` record**

```sql
INSERT INTO ambassador_referrals (
  ambassador_id,
  referred_user_id,
  subscription_id,
  plan_name,
  sale_amount,
  commission_rate,
  commission_amount,
  status,
  payment_confirmed_at,
  payout_eligible_date
) VALUES (
  '9ba127b7-6b98-4a76-9367-e180f07aad95',
  'e50e2510-ae37-44db-a084-3a160f7c02b1',
  '3fc3d95d-be79-4548-b8cb-86969549a742',
  'Plano Iniciante',
  39.90,
  15.00,
  5.99,
  'confirmed',
  '2026-05-28T01:08:21.537252+00:00',
  '2026-07-10'
);
```

Expected: `INSERT 1`

- [ ] **Step 4: Update ambassador totals**

```sql
UPDATE ambassadors
SET
  total_sales       = total_sales + 1,
  pending_commission = pending_commission + 5.99,
  updated_at        = NOW()
WHERE id = '9ba127b7-6b98-4a76-9367-e180f07aad95';
```

Expected: `UPDATE 1`

- [ ] **Step 5: Create CRM `referral_converted` interaction for the ambassador's contact**

First, get the ambassador's CRM lead id:

```sql
SELECT cl.id AS lead_id, cl.cpf
FROM crm_leads cl
JOIN profiles p ON (p.email = cl.email OR p.cpf = cl.cpf)
WHERE p.id = (SELECT user_id FROM ambassadors WHERE id = '9ba127b7-6b98-4a76-9367-e180f07aad95')
LIMIT 1;
```

Then insert an interaction (substitute `<lead_id>` and `<cpf>` from the result above; if no lead found, set both to `NULL`):

```sql
INSERT INTO crm_interactions (
  lead_id,
  user_id,
  cpf,
  interaction_type,
  channel,
  description,
  form_source,
  metadata
) VALUES (
  '<lead_id_or_NULL>',
  (SELECT user_id FROM ambassadors WHERE id = '9ba127b7-6b98-4a76-9367-e180f07aad95'),
  '<cpf_or_NULL>',
  'referral_converted',
  'system',
  'Indicação convertida em assinatura: Lizielli Gertge Silva — Plano Iniciante R$ 39,90 | Comissão: R$ 5,99',
  'backfill',
  jsonb_build_object(
    'subscription_id', '3fc3d95d-be79-4548-b8cb-86969549a742',
    'referred_user_id', 'e50e2510-ae37-44db-a084-3a160f7c02b1',
    'referred_user_name', 'Lizielli Gertge Silva',
    'commission_amount', 5.99,
    'referral_code', '408A6DD6',
    'backfilled_at', NOW()
  )
);
```

- [ ] **Step 6: Verify final state**

```sql
SELECT 
  us.ambassador_id,
  ar.id AS referral_id, ar.commission_amount, ar.status, ar.payout_eligible_date,
  a.total_sales, a.pending_commission
FROM user_subscriptions us
JOIN ambassador_referrals ar ON ar.subscription_id = us.id
JOIN ambassadors a ON a.id = us.ambassador_id
WHERE us.id = '3fc3d95d-be79-4548-b8cb-86969549a742';
```

Expected: `ambassador_id` set, `referral_id` present, `commission_amount = 5.99`, `total_sales = 1`, `pending_commission = 5.99`

---

## Task 2: Fix `create-subscription` — remove false `.active` check

**Files:**
- Modify: `supabase/functions/create-subscription/index.ts` (around line 112–124)

- [ ] **Step 1: Locate the broken condition**

Open `supabase/functions/create-subscription/index.ts`. Find this block (around line 112):

```typescript
    let ambassadorId = null;
    if (referral_code) {
      const { data: ambassador, error: ambassadorError } = await supabaseServiceClient
        .rpc('get_ambassador_by_referral', { referral_code });
      
      if (ambassadorError) {
        logStep("Error checking ambassador", { error: ambassadorError });
      } else if (ambassador && ambassador.length > 0 && ambassador[0].active) {
        ambassadorId = ambassador[0].id;
        logStep("Ambassador found for referral", { ambassadorId, ambassadorCode: referral_code });
      } else {
        logStep("Ambassador not found or inactive", { referralCode: referral_code });
      }
    }
```

**Why it's broken:** The RPC returns `(id, user_id, commission_rate, asaas_split_config)` — no `active` field. `ambassador[0].active` is always `undefined` → falsy → `ambassadorId` is never set.

- [ ] **Step 2: Apply the fix**

Replace the `else if` condition — remove `&& ambassador[0].active`:

```typescript
    let ambassadorId = null;
    if (referral_code) {
      const { data: ambassador, error: ambassadorError } = await supabaseServiceClient
        .rpc('get_ambassador_by_referral', { referral_code });
      
      if (ambassadorError) {
        logStep("Error checking ambassador", { error: ambassadorError });
      } else if (ambassador && ambassador.length > 0) {
        ambassadorId = ambassador[0].id;
        logStep("Ambassador found for referral", { ambassadorId, ambassadorCode: referral_code });
      } else {
        logStep("Ambassador not found or inactive", { referralCode: referral_code });
      }
    }
```

Note: the RPC's WHERE clause (`AND a.active = true`) already guarantees that only active ambassadors are returned. The extra check was redundant AND broken.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/create-subscription/index.ts
git commit -m "fix: remove false ambassador[0].active check in create-subscription

The get_ambassador_by_referral RPC already filters active=true in its
WHERE clause and does not return the active column. Checking
ambassador[0].active was always undefined (falsy), causing ambassador_id
to never be populated in user_subscriptions.

This bug silently suppressed all ambassador commissions."
```

---

## Task 3: Fix `asaas-webhook` — add `referral_code` fallback in commission processing

**Files:**
- Modify: `supabase/functions/asaas-webhook/index.ts` (`processAmbassadorCommission` function, top ~10 lines)

- [ ] **Step 1: Locate `processAmbassadorCommission`**

Open `supabase/functions/asaas-webhook/index.ts`. Find the function:

```typescript
const processAmbassadorCommission = async (supabaseClient: any, subscription: any, payment: any) => {
  if (!subscription.ambassador_id) {
    logStep("No ambassador for this subscription");
    return { success: false };
  }
```

- [ ] **Step 2: Replace the early return with a fallback lookup**

Replace those 4 lines with:

```typescript
const processAmbassadorCommission = async (supabaseClient: any, subscription: any, payment: any) => {
  // Resolve ambassador_id: use stored value or fall back to referral_code lookup.
  // The fallback handles subscriptions created before the .active bug was fixed
  // (those have referral_code set but ambassador_id = NULL).
  let resolvedAmbassadorId = subscription.ambassador_id;

  if (!resolvedAmbassadorId && subscription.referral_code) {
    logStep('ambassador_id missing — resolving from referral_code', { referralCode: subscription.referral_code });
    const { data: ambassador } = await supabaseClient
      .rpc('get_ambassador_by_referral', { referral_code: subscription.referral_code });

    if (ambassador && ambassador.length > 0) {
      resolvedAmbassadorId = ambassador[0].id;
      // Backfill the subscription so future webhook events (renewals) don't need this path
      const { error: backfillError } = await supabaseClient
        .from('user_subscriptions')
        .update({ ambassador_id: resolvedAmbassadorId })
        .eq('id', subscription.id);
      if (backfillError) {
        logStep('Failed to backfill ambassador_id on subscription', { error: String(backfillError) });
      } else {
        logStep('ambassador_id backfilled on subscription', { ambassadorId: resolvedAmbassadorId, subscriptionId: subscription.id });
      }
    }
  }

  if (!resolvedAmbassadorId) {
    logStep("No ambassador for this subscription");
    return { success: false };
  }
```

- [ ] **Step 3: Replace `subscription.ambassador_id` usages inside the function with `resolvedAmbassadorId`**

The rest of the function uses `subscription.ambassador_id` in two places. Replace both:

Find:
```typescript
  const commissionRate = 0.15; // 15%
  const commissionAmount = payment.value * commissionRate;
  // ...
  const { error: refError } = await supabaseClient
    .from('ambassador_referrals')
    .insert({
      ambassador_id: subscription.ambassador_id,
```

Change `ambassador_id: subscription.ambassador_id` to `ambassador_id: resolvedAmbassadorId`.

Find the second usage (in the `increment_ambassador_totals` RPC fallback):
```typescript
      await supabaseClient
        .from('ambassadors')
        .update({ ... })
        .eq('id', subscription.ambassador_id);
```

Change `.eq('id', subscription.ambassador_id)` to `.eq('id', resolvedAmbassadorId)`.

Also find the RPC call:
```typescript
  const { error: updateError } = await supabaseClient.rpc('increment_ambassador_totals', {
    p_ambassador_id: subscription.ambassador_id,
```

Change to `p_ambassador_id: resolvedAmbassadorId`.

- [ ] **Step 4: Add CRM `referral_converted` interaction after successful commission creation**

Find the end of the `processAmbassadorCommission` function, just before `return { success: true, commissionAmount };`. Add:

```typescript
  // CRM: register referral_converted interaction on the ambassador's contact timeline
  try {
    const { data: ambassadorProfile } = await supabaseClient
      .from('profiles')
      .select('id, cpf, email')
      .eq('id', (await supabaseClient
        .from('ambassadors')
        .select('user_id')
        .eq('id', resolvedAmbassadorId)
        .single()
      ).data?.user_id)
      .maybeSingle();

    const { data: ambassadorLead } = await supabaseClient
      .from('crm_leads')
      .select('id')
      .or(`email.eq.${ambassadorProfile?.email},cpf.eq.${ambassadorProfile?.cpf}`)
      .maybeSingle();

    await supabaseClient.from('crm_interactions').insert({
      lead_id: ambassadorLead?.id || null,
      user_id: ambassadorProfile?.id || null,
      cpf: ambassadorProfile?.cpf || null,
      interaction_type: 'referral_converted',
      channel: 'system',
      description: `Indicação convertida em assinatura — R$ ${payment.value?.toFixed(2)} | Comissão: R$ ${commissionAmount.toFixed(2)}`,
      form_source: 'asaas_webhook',
      metadata: {
        ambassador_id: resolvedAmbassadorId,
        referred_user_id: subscription.user_id,
        subscription_id: subscription.id,
        commission_amount: commissionAmount,
        payout_eligible_date: payoutEligibleDate.toISOString().split('T')[0],
      },
    });
    logStep('CRM referral_converted interaction created for ambassador');
  } catch (crmError) {
    logStep('CRM referral_converted interaction failed (non-blocking)', { error: String(crmError) });
  }

  return { success: true, commissionAmount };
```

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/asaas-webhook/index.ts
git commit -m "fix: resolve ambassador_id from referral_code when null in webhook

When ambassador_id is NULL but referral_code exists on a subscription
(caused by the .active bug in create-subscription), fall back to
resolving ambassador via get_ambassador_by_referral RPC and backfill
the subscription row.

Also adds CRM referral_converted interaction when a commission is
successfully processed, completing the Fase 7 CRM integration."
```

---

## Task 4: Deploy both Edge Functions

**Files:** Supabase Edge Functions (deploy via MCP)

- [ ] **Step 1: Deploy `create-subscription`**

Use `mcp__supabase__deploy_edge_function`:
- `project_id`: `ngqymbjatenxztrjjdxa`
- `name`: `create-subscription`
- `entrypoint_path`: `index.ts`
- `verify_jwt`: `true`
- `files`: full content of `supabase/functions/create-subscription/index.ts`

Expected response: `"status": "ACTIVE"` with a new version number > current.

- [ ] **Step 2: Deploy `asaas-webhook`**

Use `mcp__supabase__deploy_edge_function`:
- `project_id`: `ngqymbjatenxztrjjdxa`
- `name`: `asaas-webhook`
- `entrypoint_path`: `index.ts`
- `verify_jwt`: `false`
- `files`: full content of `supabase/functions/asaas-webhook/index.ts`

Expected response: `"status": "ACTIVE"` with a new version number > 117.

- [ ] **Step 3: Verify both are active**

Use `mcp__supabase__execute_sql` to check Supabase logs for a few seconds after deployment, or confirm via the version numbers returned by the deploy calls.

- [ ] **Step 4: Commit the deploy confirmation note**

```bash
git add supabase/functions/create-subscription/index.ts supabase/functions/asaas-webhook/index.ts
git commit -m "deploy: redeploy create-subscription and asaas-webhook with commission fixes" --allow-empty
```

(If the deploy step is tracked only via MCP and there's nothing new to stage, skip the git step — the code commits from Tasks 2 and 3 are sufficient.)

---

## Task 5: Update ambassador system documentation

**Files:**
- Modify: `docs/_active/10-embaixadoras/02-fase2-rastreamento.md`
- Modify: `docs/_active/10-embaixadoras/07-fase7-integracao-crm.md`

- [ ] **Step 1: Add bug-fix section to `02-fase2-rastreamento.md`**

Append to the end of `docs/_active/10-embaixadoras/02-fase2-rastreamento.md`:

```markdown
---

## Correções (2026-05-29)

### Bug corrigido: `ambassador[0].active` nunca verdadeiro

**Arquivo:** `supabase/functions/create-subscription/index.ts`

**Problema:** O RPC `get_ambassador_by_referral` retorna apenas `(id, user_id, commission_rate, asaas_split_config)` — já filtra `active = true` no WHERE. O código chamador verificava `ambassador[0].active`, que sempre é `undefined` (campo não existe no resultado), causando `ambassador_id = NULL` em todas as assinaturas via indicação.

**Correção:** Removida a verificação `&& ambassador[0].active`. A condição correta é `ambassador && ambassador.length > 0`.

### Bug corrigido: webhook sem fallback por `referral_code`

**Arquivo:** `supabase/functions/asaas-webhook/index.ts` — `processAmbassadorCommission()`

**Problema:** Quando `subscription.ambassador_id` é `NULL`, a função retornava imediatamente sem tentar resolver o embaixador pelo `referral_code`. Como o primeiro bug garantia que `ambassador_id` sempre seria `NULL`, nenhuma comissão foi criada desde a implantação do módulo.

**Correção:** Adicionado fallback: quando `ambassador_id` é null mas `referral_code` existe, a função chama `get_ambassador_by_referral` para resolver o embaixador e faz backfill do campo `ambassador_id` na assinatura.

### Dados corrigidos

- Assinatura da Lizielli Gertge Silva: `ambassador_id` preenchido com o embaixador correto, registro em `ambassador_referrals` criado, totais do embaixador atualizados.
- Nenhuma outra assinatura afetada (apenas 1 assinatura com `referral_code` e `ambassador_id = NULL`).

### Interação CRM adicionada

Quando uma comissão é processada com sucesso no webhook, agora é criada uma interação do tipo `referral_converted` na timeline CRM do embaixador, completando a integração descrita na Fase 7.
```

- [ ] **Step 2: Add changelog entry to `07-fase7-integracao-crm.md`**

Append to the Changelog table in `docs/_active/10-embaixadoras/07-fase7-integracao-crm.md`:

```markdown
| 2026-05-29 | Adicionada interação `referral_converted` no webhook `asaas-webhook` ao processar comissão. Antes, essa interação existia apenas na documentação mas não era criada. |
```

- [ ] **Step 3: Commit documentation**

```bash
git add docs/_active/10-embaixadoras/02-fase2-rastreamento.md
git add docs/_active/10-embaixadoras/07-fase7-integracao-crm.md
git commit -m "docs: document ambassador commission bug fixes and data backfill (2026-05-29)"
```

---

## Self-Review

**Spec coverage:**
- ✅ Bug #1 fixed: `create-subscription` `.active` check removed (Task 2)
- ✅ Bug #2 fixed: webhook fallback by `referral_code` (Task 3)
- ✅ Lizielli's commission backfilled (Task 1)
- ✅ `referral_converted` CRM interaction added (Task 3, Step 4)
- ✅ Both functions deployed (Task 4)
- ✅ Documentation updated (Task 5)
- ✅ Attribution prerequisite flagged clearly for human decision

**Placeholder scan:** No TBDs or vague steps. All SQL and TypeScript code is complete.

**Type consistency:**
- `resolvedAmbassadorId` introduced in Task 3 is used consistently throughout `processAmbassadorCommission`
- `commissionAmount` and `payoutEligibleDate` are already defined in the original function; the CRM block in Step 4 references them after they are computed

**Not in scope (intentional):**
- Duplicate referral click tracking (cosmetic data quality, tracked 18+ clicks for one session): the core commission flow is not affected by this; fixing it requires client-side changes outside this plan's scope.
- Other subscriptions with broken ambassador links: data query confirmed only 1 row affected (Lizielli's).
