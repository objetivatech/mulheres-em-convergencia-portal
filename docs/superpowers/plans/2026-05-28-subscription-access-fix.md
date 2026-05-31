# Correção do Sistema de Acesso por Assinatura

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the critical bug where users who pay via PIX receive payment confirmation in ASAAS but never get the `business_owner` role, preventing them from accessing "Gestão de Negócios"; also fix business plan cancellation handling and fill in missing CRM timeline labels.

**Architecture:** The primary fix is in `supabase/functions/asaas-webhook/index.ts`. The `PAYMENT_CONFIRMED` handler activates the subscription and renews businesses but never grants roles — roles are only granted in the `SUBSCRIPTION_CONFIRMED` event, which ASAAS may not always fire for PIX payments. The `SUBSCRIPTION_DELETED`/`SUBSCRIPTION_EXPIRED` handler only handles Academy subscriptions, silently ignoring business plan cancellations. `ContactTimeline.tsx` renders raw interaction type strings for subscription-related events because the label maps are incomplete.

**Tech Stack:** Deno/TypeScript (Supabase Edge Functions), Supabase PostgreSQL (RPC), React/TypeScript (shadcn/ui frontend)

---

## Root Cause Summary

```
User pays via PIX
  → ASAAS fires PAYMENT_CONFIRMED webhook
  → asaas-webhook/index.ts handles it
  → user_subscriptions.status = 'active'            ✅
  → process_subscription_payment() RPC called        ✅
      → renews existing businesses (0 if new user)   ✅/😐
      → does NOT grant business_owner role           ❌
  → CRM records written                             ✅
  → ROLE NEVER GRANTED                              ❌

  SUBSCRIPTION_CONFIRMED may not fire for PIX      ❌
  Sync button can fix it BUT only if status='active'
  AND external_subscription_id is not null          ✅
```

The sync button **would** fix Lizielli if triggered manually for her user_id because the sync function correctly grants roles. But users should never need manual intervention after paying.

---

## File Map

| File | Change |
|---|---|
| `supabase/functions/asaas-webhook/index.ts` | Task 2 + Task 3 |
| `src/components/admin/crm/ContactTimeline.tsx` | Task 4 |
| No new migrations needed | — |

---

### Task 1: Diagnose and immediately fix Lizielli's access

No code changes. Run SQL directly in Supabase Studio → SQL Editor.

**Files:** None (Supabase Studio only)

- [ ] **Step 1: Find Lizielli's user ID and subscription state**

Open Supabase Studio → SQL Editor and run:

```sql
-- Find Lizielli's profile
SELECT id, email, full_name, cpf
FROM profiles
WHERE full_name ILIKE '%Lizielli%'
   OR email ILIKE '%lizielli%';
```

Save the `id` value (uuid). Use it as `<USER_ID>` below.

- [ ] **Step 2: Verify her subscription, businesses, and roles**

```sql
-- Replace <USER_ID> with her actual uuid
SELECT 'subscription' AS record_type, id::text, status, plan_id, external_subscription_id, created_at::text
FROM user_subscriptions
WHERE user_id = '<USER_ID>'

UNION ALL

SELECT 'business', id::text, subscription_active::text, name, null, created_at::text
FROM businesses
WHERE owner_id = '<USER_ID>'

UNION ALL

SELECT 'role', id::text, role, null, null, created_at::text
FROM user_roles
WHERE user_id = '<USER_ID>';
```

Expected findings:
- `user_subscriptions`: 1 row, `status = 'active'` (was activated by webhook)
- `businesses`: 0 rows OR 1+ rows with `subscription_active = false`
- `user_roles`: NO row with `role = 'business_owner'` — this is the bug

- [ ] **Step 3: Grant roles to Lizielli**

```sql
-- Replace <USER_ID> with her actual uuid
-- Safe: ON CONFLICT DO NOTHING prevents duplicates
INSERT INTO user_roles (user_id, role)
VALUES ('<USER_ID>', 'business_owner')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
VALUES ('<USER_ID>', 'subscriber')
ON CONFLICT (user_id, role) DO NOTHING;
```

- [ ] **Step 4: Activate her subscription via sync function**

Now trigger the sync for her user_id specifically (this will activate businesses and update expiry dates):

```bash
# From terminal in the project root
supabase functions invoke sync-subscription-status \
  --body '{"user_id":"<USER_ID>","force":true}'
```

Or use the admin sync button in the portal while passing `user_id` manually.

- [ ] **Step 5: Verify the fix**

```sql
SELECT 'subscription' AS record_type, id::text, status, expires_at::text
FROM user_subscriptions
WHERE user_id = '<USER_ID>'

UNION ALL

SELECT 'business', id::text, subscription_active::text, subscription_expires_at::text
FROM businesses
WHERE owner_id = '<USER_ID>'

UNION ALL

SELECT 'role', id::text, role, null
FROM user_roles
WHERE user_id = '<USER_ID>';
```

Expected: `user_roles` now has `business_owner` + `subscriber`. Any businesses have `subscription_active = true`. Lizielli should now appear in "Gestão de Negócios".

---

### Task 2: Grant roles in `PAYMENT_CONFIRMED` handler

This is the permanent fix preventing recurrence for all future subscribers.

**Files:**
- Modify: `supabase/functions/asaas-webhook/index.ts` (after line 670, within the business subscription section)

- [ ] **Step 1: Read the current state of the PAYMENT_CONFIRMED handler**

Open `supabase/functions/asaas-webhook/index.ts`. Find this line (around line 668):
```typescript
        // Processar comissão de embaixadora
        const commissionResult = await processAmbassadorCommission(supabaseClient, subscription, payment);
```

The role grant block goes **immediately before** the ambassador commission block.

- [ ] **Step 2: Insert the role grant block**

Add the following block between the `process_subscription_payment` call result log (around line 670) and the `processAmbassadorCommission` call (around line 672). The inserted code:

```typescript
        // Grant business_owner and subscriber roles (idempotent upsert)
        try {
          const { data: existingOwnerRole } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', subscription.user_id)
            .eq('role', 'business_owner')
            .maybeSingle();

          if (!existingOwnerRole) {
            await supabaseClient
              .from('user_roles')
              .insert({ user_id: subscription.user_id, role: 'business_owner' });
            logStep('Role business_owner granted', { userId: subscription.user_id });
          } else {
            logStep('Role business_owner already exists — skipping', { userId: subscription.user_id });
          }

          const { data: existingSubRole } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', subscription.user_id)
            .eq('role', 'subscriber')
            .maybeSingle();

          if (!existingSubRole) {
            await supabaseClient
              .from('user_roles')
              .insert({ user_id: subscription.user_id, role: 'subscriber' });
            logStep('Role subscriber granted', { userId: subscription.user_id });
          }
        } catch (roleError) {
          // Non-blocking: log prominently so admin can spot it in Function logs
          logStep('CRITICAL: Failed to grant roles after payment — manual fix may be needed', {
            userId: subscription.user_id,
            error: String(roleError),
          });
        }
```

After inserting, the block order in the PAYMENT_CONFIRMED handler should be:

1. Check complimentary businesses → early return if complimentary ✓ (already there)
2. Update `user_subscriptions.status` to `active` ✓ (already there)
3. Call `process_subscription_payment()` RPC ✓ (already there)
4. **[NEW] Grant `business_owner` + `subscriber` roles**
5. Process ambassador commission ✓ (already there)
6. Update CRM ✓ (already there)
7. Mark event processed + return 200 ✓ (already there)

- [ ] **Step 3: Verify the full modified section looks correct**

After your edit, lines ~655–695 of `asaas-webhook/index.ts` should read:

```typescript
        // Process 31-day renewal
        const { data: renewalResult, error: renewalError } = await supabaseClient
          .rpc('process_subscription_payment', {
            p_user_id: subscription.user_id,
            p_external_payment_id: payment.id,
            p_amount: payment.value
          });

        if (renewalError) {
          logStep('Failed to process subscription renewal', { error: renewalError });
        } else {
          logStep('Businesses activated for 31 days', {
            count: renewalResult?.businesses_renewed || 0,
            renewal_date: renewalResult?.renewal_date || null
          });
        }

        // Grant business_owner and subscriber roles (idempotent upsert)
        try {
          const { data: existingOwnerRole } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', subscription.user_id)
            .eq('role', 'business_owner')
            .maybeSingle();

          if (!existingOwnerRole) {
            await supabaseClient
              .from('user_roles')
              .insert({ user_id: subscription.user_id, role: 'business_owner' });
            logStep('Role business_owner granted', { userId: subscription.user_id });
          } else {
            logStep('Role business_owner already exists — skipping', { userId: subscription.user_id });
          }

          const { data: existingSubRole } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', subscription.user_id)
            .eq('role', 'subscriber')
            .maybeSingle();

          if (!existingSubRole) {
            await supabaseClient
              .from('user_roles')
              .insert({ user_id: subscription.user_id, role: 'subscriber' });
            logStep('Role subscriber granted', { userId: subscription.user_id });
          }
        } catch (roleError) {
          logStep('CRITICAL: Failed to grant roles after payment — manual fix may be needed', {
            userId: subscription.user_id,
            error: String(roleError),
          });
        }

        // Processar comissão de embaixadora
        const commissionResult = await processAmbassadorCommission(supabaseClient, subscription, payment);
```

- [ ] **Step 4: Commit**

```bash
git checkout -b fix/subscription-access-role-grant
git add supabase/functions/asaas-webhook/index.ts
git commit -m "fix: grant business_owner role on PAYMENT_CONFIRMED webhook

Previously the role was only assigned on SUBSCRIPTION_CONFIRMED which
ASAAS does not always fire for PIX payments. This caused new subscribers
to have an active subscription record but no portal access."
```

---

### Task 3: Handle business plan cancellations in `SUBSCRIPTION_DELETED`/`SUBSCRIPTION_EXPIRED`

Currently these events only cancel Academy subscriptions. Business plan cancellations are silently ignored, leaving `user_subscriptions.status = 'active'` forever even after ASAAS cancels the plan.

**Files:**
- Modify: `supabase/functions/asaas-webhook/index.ts` (around line 983, in the `SUBSCRIPTION_DELETED`/`SUBSCRIPTION_EXPIRED` block)

- [ ] **Step 1: Locate the handler**

Find this block starting around line 983:

```typescript
    // Academy subscription cancellation
    else if (webhookData.event === "SUBSCRIPTION_DELETED" || 
             webhookData.event === "SUBSCRIPTION_EXPIRED") {
      const subscription = webhookData.subscription;
      if (subscription?.id) {
        const { data: academySub } = await supabaseClient
          .from("academy_subscriptions")
          ...
        if (academySub) {
          // ... academy cancel code ...
        }
        // <-- business plan cancellation is MISSING here
      }
    }
```

- [ ] **Step 2: Add the business plan cancellation block**

Inside the `if (subscription?.id)` block, after the `if (academySub) { ... }` block, add:

```typescript
        } else {
          // Business subscription cancellation
          const { data: businessSub } = await supabaseClient
            .from("user_subscriptions")
            .select("id, user_id")
            .eq("external_subscription_id", subscription.id)
            .maybeSingle();

          if (businessSub) {
            const newStatus = webhookData.event === "SUBSCRIPTION_DELETED" ? "cancelled" : "expired";

            await supabaseClient
              .from("user_subscriptions")
              .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("id", businessSub.id);
            logStep("Business subscription cancelled/expired", { subId: businessSub.id, status: newStatus });

            // Deactivate non-complimentary businesses
            const { data: deactivated } = await supabaseClient
              .from("businesses")
              .update({
                subscription_active: false,
                updated_at: new Date().toISOString(),
              })
              .eq("owner_id", businessSub.user_id)
              .eq("is_complimentary", false)
              .select("id, name");
            logStep("Business profiles deactivated", { count: deactivated?.length || 0 });

            // Revoke roles only if no active businesses remain (handles multi-business plans)
            const { data: remaining } = await supabaseClient
              .from("businesses")
              .select("id")
              .eq("owner_id", businessSub.user_id)
              .eq("subscription_active", true)
              .limit(1);

            if (!remaining || remaining.length === 0) {
              await supabaseClient
                .from("user_roles")
                .delete()
                .eq("user_id", businessSub.user_id)
                .in("role", ["business_owner", "subscriber"]);
              logStep("Roles revoked — no active businesses remain", { userId: businessSub.user_id });
            }

            // CRM interaction
            await supabaseClient.from("crm_interactions").insert({
              user_id: businessSub.user_id,
              interaction_type: "subscription_cancelled",
              channel: "system",
              description: `Assinatura business ${webhookData.event === "SUBSCRIPTION_DELETED" ? "cancelada" : "expirada"} via ASAAS`,
              form_source: "asaas_webhook",
              metadata: {
                asaas_subscription_id: subscription.id,
                user_id: businessSub.user_id,
                event: webhookData.event,
              },
            });
          } else {
            logStep("No matching business subscription for deleted/expired event", { asaasSubId: subscription.id });
          }
        }
```

After the change, the full `if (subscription?.id)` block should be:

```typescript
      if (subscription?.id) {
        const { data: academySub } = await supabaseClient
          .from("academy_subscriptions")
          .select("id, user_id")
          .eq("asaas_subscription_id", subscription.id)
          .maybeSingle();

        if (academySub) {
          await supabaseClient
            .from("academy_subscriptions")
            .update({
              status: webhookData.event === "SUBSCRIPTION_DELETED" ? "cancelled" : "expired",
              cancelled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", academySub.id);
          logStep("Academy subscription cancelled/expired", { subId: academySub.id });

          await supabaseClient.from("crm_interactions").insert({
            interaction_type: "academy_subscription_cancelled",
            channel: "system",
            description: `Assinatura MeC Academy ${webhookData.event === "SUBSCRIPTION_DELETED" ? "cancelada" : "expirada"}`,
            form_source: "asaas_webhook",
            metadata: { subscription_id: subscription.id, user_id: academySub.user_id },
          });
        } else {
          // Business subscription cancellation
          const { data: businessSub } = await supabaseClient
            .from("user_subscriptions")
            .select("id, user_id")
            .eq("external_subscription_id", subscription.id)
            .maybeSingle();

          if (businessSub) {
            const newStatus = webhookData.event === "SUBSCRIPTION_DELETED" ? "cancelled" : "expired";

            await supabaseClient
              .from("user_subscriptions")
              .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("id", businessSub.id);
            logStep("Business subscription cancelled/expired", { subId: businessSub.id, status: newStatus });

            const { data: deactivated } = await supabaseClient
              .from("businesses")
              .update({
                subscription_active: false,
                updated_at: new Date().toISOString(),
              })
              .eq("owner_id", businessSub.user_id)
              .eq("is_complimentary", false)
              .select("id, name");
            logStep("Business profiles deactivated", { count: deactivated?.length || 0 });

            const { data: remaining } = await supabaseClient
              .from("businesses")
              .select("id")
              .eq("owner_id", businessSub.user_id)
              .eq("subscription_active", true)
              .limit(1);

            if (!remaining || remaining.length === 0) {
              await supabaseClient
                .from("user_roles")
                .delete()
                .eq("user_id", businessSub.user_id)
                .in("role", ["business_owner", "subscriber"]);
              logStep("Roles revoked — no active businesses remain", { userId: businessSub.user_id });
            }

            await supabaseClient.from("crm_interactions").insert({
              user_id: businessSub.user_id,
              interaction_type: "subscription_cancelled",
              channel: "system",
              description: `Assinatura business ${webhookData.event === "SUBSCRIPTION_DELETED" ? "cancelada" : "expirada"} via ASAAS`,
              form_source: "asaas_webhook",
              metadata: {
                asaas_subscription_id: subscription.id,
                user_id: businessSub.user_id,
                event: webhookData.event,
              },
            });
          } else {
            logStep("No matching business subscription for deleted/expired event", { asaasSubId: subscription.id });
          }
        }
      }
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/asaas-webhook/index.ts
git commit -m "fix: handle business plan cancellations in SUBSCRIPTION_DELETED/EXPIRED

Previously only Academy subscriptions were handled. Business plan
cancellations were silently ignored, leaving user_subscriptions.status
active even after ASAAS cancelled the plan."
```

---

### Task 4: Add missing interaction types to `ContactTimeline.tsx`

The timeline currently renders raw interaction type strings (e.g., `subscription_payment_confirmed`) instead of human-readable labels because those keys are absent from the maps.

**Files:**
- Modify: `src/components/admin/crm/ContactTimeline.tsx` (lines 32–109)

- [ ] **Step 1: Add missing icons to `interactionIcons`**

Current `interactionIcons` ends at line 63. The block to add goes right before the closing `};` of that object:

```typescript
  // Subscription lifecycle
  subscription_payment_confirmed: DollarSign,
  subscription_payment_processed: DollarSign,
  subscription_activated_sync: CheckCircle,
  subscription_deactivated_sync: AlertCircle,
  subscription_deactivated_overdue: AlertCircle,
  subscription_expired_local: AlertCircle,
  subscription_cancelled: AlertCircle,
  payment_overdue: AlertCircle,
  // Academy
  academy_payment_confirmed: DollarSign,
  academy_subscription_cancelled: AlertCircle,
```

After the change, the `interactionIcons` object (lines 32–63) should end with:

```typescript
const interactionIcons: Record<string, React.ElementType> = {
  // Email interactions
  email_sent: Mail,
  email_opened: Mail,
  email_clicked: Mail,
  email_confirmation_request: Mail,
  email_welcome: Mail,
  email_reminder: Mail,
  email_reminder_2h: Clock,
  // Event interactions
  event_registration: Calendar,
  event_presence_confirmed: CheckCircle,
  event_check_in: CheckCircle,
  event_registration_removed: AlertCircle,
  // Communication
  phone_call: Phone,
  message: MessageSquare,
  contact_form: FileText,
  newsletter_subscription: Mail,
  business_contact: MessageSquare,
  // Transactions
  purchase: DollarSign,
  product_purchase_started: DollarSign,
  product_purchase_confirmed: DollarSign,
  event_payment_confirmed: DollarSign,
  donation: Gift,
  // Subscription lifecycle
  subscription_payment_confirmed: DollarSign,
  subscription_payment_processed: DollarSign,
  subscription_activated_sync: CheckCircle,
  subscription_deactivated_sync: AlertCircle,
  subscription_deactivated_overdue: AlertCircle,
  subscription_expired_local: AlertCircle,
  subscription_cancelled: AlertCircle,
  payment_overdue: AlertCircle,
  // Academy
  academy_payment_confirmed: DollarSign,
  academy_subscription_cancelled: AlertCircle,
  // Other
  signup: UserPlus,
  form_submit: FileText,
  campaign: Megaphone,
  other: Clock,
};
```

- [ ] **Step 2: Add missing labels to `interactionLabels`**

Current `interactionLabels` ends at line 100. Add before the closing `};`:

```typescript
  // Subscription lifecycle
  subscription_payment_confirmed: 'Pagamento de assinatura confirmado',
  subscription_payment_processed: 'Pagamento de assinatura processado',
  subscription_activated_sync: 'Assinatura ativada (sincronização)',
  subscription_deactivated_sync: 'Assinatura desativada (sincronização)',
  subscription_deactivated_overdue: 'Assinatura desativada por inadimplência',
  subscription_expired_local: 'Assinatura expirada localmente',
  subscription_cancelled: 'Assinatura cancelada',
  payment_overdue: 'Pagamento em atraso',
  // Academy
  academy_payment_confirmed: 'Pagamento Academy confirmado',
  academy_subscription_cancelled: 'Assinatura Academy cancelada/expirada',
```

- [ ] **Step 3: Add missing milestone labels to `milestoneLabels`**

Current `milestoneLabels` (lines 102–109) is missing `subscription_activated` and `product_purchase`. Replace the entire object:

```typescript
const milestoneLabels: Record<string, string> = {
  first_contact: 'Primeiro Contato',
  first_event: 'Primeiro Evento',
  first_purchase: 'Primeira Compra',
  became_subscriber: 'Tornou-se Assinante',
  became_ambassador: 'Tornou-se Embaixadora',
  lead_converted: 'Lead Convertido',
  subscription_activated: 'Assinatura Business Ativada',
  product_purchase: 'Compra de Produto',
};
```

- [ ] **Step 4: TypeScript build check**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors related to `ContactTimeline.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/crm/ContactTimeline.tsx
git commit -m "fix: add missing subscription interaction types to ContactTimeline

subscription_payment_confirmed, subscription_cancelled, payment_overdue
and related types were missing from interactionIcons and interactionLabels,
causing raw enum strings to appear in the contact timeline."
```

---

### Task 5: Deploy Edge Function and validate

- [ ] **Step 1: Deploy `asaas-webhook` to Supabase**

```bash
supabase functions deploy asaas-webhook
```

If the Supabase CLI is not linked yet:
```bash
supabase link --project-ref <project-ref>
supabase functions deploy asaas-webhook
```

Find the project ref in Supabase Dashboard → Project Settings → General → Reference ID.

Expected output:
```
Deploying Function 'asaas-webhook'...
Done: Deployed Function asaas-webhook
```

- [ ] **Step 2: Verify the deploy in Supabase Dashboard**

Open Supabase Dashboard → Edge Functions → `asaas-webhook` → check the deployment timestamp matches your deploy.

- [ ] **Step 3: Test role grant with a real sync for a test user**

Run the sync function for a known `pending` or `active` subscription user (use your own test account or a staging account):

```bash
supabase functions invoke sync-subscription-status \
  --body '{"user_id":"<YOUR_TEST_USER_ID>"}'
```

Check the response JSON — it should show `activatedBusinesses > 0` or at least `updatedSubscriptions > 0` if not already active.

- [ ] **Step 4: Check Edge Function logs for any role-grant errors**

Open Supabase Dashboard → Edge Functions → `asaas-webhook` → Logs. Filter by "CRITICAL" — should be zero such entries for recent invocations.

- [ ] **Step 5: Build and run the frontend locally**

```bash
npm run dev
```

Navigate to a contact in the CRM that has `subscription_payment_confirmed` interactions. Confirm labels render as "Pagamento de assinatura confirmado" instead of the raw string.

- [ ] **Step 6: Final commit and push**

```bash
git push origin fix/subscription-access-role-grant
```

Open a PR targeting `main`. Title: "fix: grant business_owner role on PAYMENT_CONFIRMED + handle subscription cancellations".

---

## Self-Review

**Spec coverage:**
- ✅ Lizielli immediate fix: Task 1
- ✅ `business_owner` role not granted on `PAYMENT_CONFIRMED`: Task 2
- ✅ `SUBSCRIPTION_DELETED`/`SUBSCRIPTION_EXPIRED` ignores business plans: Task 3
- ✅ `ContactTimeline.tsx` missing labels: Task 4
- ✅ Deploy and validate: Task 5

**Placeholder scan:** None found — all code blocks are complete and self-contained.

**Type consistency:**
- `subscription.user_id` used consistently throughout (matches `user_subscriptions.user_id` column)
- `businessSub.user_id` is the correct field name from the `user_subscriptions` select in Task 3
- `interaction_type: "subscription_cancelled"` matches the new label key in Task 4

**Edge cases covered:**
- Role already exists → `maybeSingle()` check prevents duplicate insert (Task 2)
- User has multiple businesses → only revoke role if ALL businesses deactivated (Task 3)
- Academy subscription deleted → existing code path unchanged; `else` branch ensures only one path executes (Task 3)
- New user with no businesses → role still granted regardless of `businesses_renewed` count (Task 2, key fix)
