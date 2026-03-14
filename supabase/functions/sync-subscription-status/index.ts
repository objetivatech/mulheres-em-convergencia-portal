import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-SUBSCRIPTION] ${step}${detailsStr}`);
};

const GRACE_PERIOD_DAYS = 5;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Sync function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    let specificUserId: string | null = null;
    let forceSync = false;
    try {
      const body = await req.json();
      specificUserId = body?.user_id || null;
      forceSync = body?.force || false;
    } catch (e) {
      logStep("No request body, proceeding with full sync");
    }

    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    if (!asaasApiKey) {
      throw new Error('ASAAS API key not configured');
    }

    const asaasBaseUrl = asaasApiKey.includes('_test_') 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://www.asaas.com/api/v3';

    const asaasFetch = async (path: string) => {
      const res = await fetch(`${asaasBaseUrl}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        },
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`ASAAS API error ${res.status}: ${errorText.substring(0, 200)}`);
      }
      return await res.json();
    };

    // =====================================================
    // STEP 1: Fetch ALL subscriptions (not just pending)
    // =====================================================
    let query = supabaseClient
      .from('user_subscriptions')
      .select('*')
      .not('external_subscription_id', 'is', null)
      .in('status', ['pending', 'active']); // Process both pending AND active

    if (specificUserId) {
      query = query.eq('user_id', specificUserId);
    }

    const { data: subscriptions, error: fetchError } = await query;
    if (fetchError) throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);

    logStep("Subscriptions to sync", { count: subscriptions?.length || 0 });

    let updatedSubscriptions = 0;
    let activatedBusinesses = 0;
    let deactivatedBusinesses = 0;
    let rolesRemoved = 0;
    let syncErrors: any[] = [];

    for (const subscription of subscriptions || []) {
      try {
        const externalId = subscription.external_subscription_id;
        let asaasStatus: string | null = null;
        let isPaymentConfirmed = false;

        // =====================================================
        // STEP 2: Check status in ASAAS
        // =====================================================
        try {
          const subscriptionData = await asaasFetch(`/subscriptions/${externalId}`);
          if (subscriptionData?.status) {
            asaasStatus = subscriptionData.status;
            logStep("ASAAS subscription status", { externalId, status: asaasStatus });
            
            if (asaasStatus === 'ACTIVE') {
              try {
                const paymentsData = await asaasFetch(`/payments?subscription=${externalId}&status=RECEIVED&limit=1`);
                if (paymentsData.data?.length > 0) {
                  isPaymentConfirmed = true;
                }
              } catch (e) {
                try {
                  const paymentsData = await asaasFetch(`/payments?subscription=${externalId}&status=CONFIRMED&limit=1`);
                  if (paymentsData.data?.length > 0) isPaymentConfirmed = true;
                } catch (_) {}
              }
            }
          }
        } catch (subError: any) {
          // Try as single payment
          try {
            const paymentData = await asaasFetch(`/payments/${externalId}`);
            if (paymentData?.status) {
              asaasStatus = paymentData.status;
              isPaymentConfirmed = paymentData.status === 'RECEIVED' || paymentData.status === 'CONFIRMED';
            }
          } catch (payError: any) {
            logStep("External ID not found in ASAAS", { externalId });
            syncErrors.push({
              subscriptionId: subscription.id,
              externalId,
              userId: subscription.user_id,
              error: 'External ID not found in ASAAS'
            });
            continue;
          }
        }

        // =====================================================
        // STEP 3: Determine action based on status
        // =====================================================
        const shouldActivate = isPaymentConfirmed || asaasStatus === 'ACTIVE' || asaasStatus === 'RECEIVED' || asaasStatus === 'CONFIRMED';
        const shouldDeactivate = asaasStatus === 'OVERDUE' || asaasStatus === 'CANCELED' || asaasStatus === 'EXPIRED';

        // --- ACTIVATE ---
        if (shouldActivate && subscription.status !== 'active') {
          logStep("Activating subscription", { id: subscription.id, asaasStatus });

          await supabaseClient
            .from('user_subscriptions')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', subscription.id);
          updatedSubscriptions++;

          const renewalDate = new Date();
          renewalDate.setDate(renewalDate.getDate() + 31);

          const { data: businesses } = await supabaseClient
            .from('businesses')
            .update({
              subscription_active: true,
              subscription_expires_at: subscription.expires_at,
              subscription_renewal_date: renewalDate.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('owner_id', subscription.user_id)
            .eq('is_complimentary', false)
            .select('id, name');

          activatedBusinesses += businesses?.length || 0;

          // Ensure business_owner role
          const { data: existingRole } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', subscription.user_id)
            .eq('role', 'business_owner')
            .maybeSingle();

          if (!existingRole) {
            await supabaseClient.from('user_roles').insert({ user_id: subscription.user_id, role: 'business_owner' });
          }

          // Ensure subscriber role
          const { data: existingSub } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', subscription.user_id)
            .eq('role', 'subscriber')
            .maybeSingle();

          if (!existingSub) {
            await supabaseClient.from('user_roles').insert({ user_id: subscription.user_id, role: 'subscriber' });
          }

          // CRM log
          try {
            await supabaseClient.from('crm_interactions').insert({
              user_id: subscription.user_id,
              interaction_type: 'subscription_activated_sync',
              channel: 'system',
              description: `Assinatura sincronizada e ativada via sync-subscription-status`,
              metadata: { subscription_id: subscription.id, external_id: externalId, asaas_status: asaasStatus, businesses_activated: businesses?.length || 0 }
            });
          } catch (_) {}

        // --- DEACTIVATE (from ASAAS status) ---
        } else if (shouldDeactivate && subscription.status === 'active') {
          logStep("Deactivating subscription (ASAAS status)", { id: subscription.id, asaasStatus });

          await supabaseClient
            .from('user_subscriptions')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', subscription.id);
          updatedSubscriptions++;

          // Deactivate non-complimentary businesses
          const { data: deactivated } = await supabaseClient
            .from('businesses')
            .update({ subscription_active: false, updated_at: new Date().toISOString() })
            .eq('owner_id', subscription.user_id)
            .eq('is_complimentary', false)
            .select('id, name');

          deactivatedBusinesses += deactivated?.length || 0;

          // Check if user has any remaining active businesses
          const { data: remaining } = await supabaseClient
            .from('businesses')
            .select('id')
            .eq('owner_id', subscription.user_id)
            .eq('subscription_active', true)
            .limit(1);

          if (!remaining || remaining.length === 0) {
            await supabaseClient
              .from('user_roles')
              .delete()
              .eq('user_id', subscription.user_id)
              .in('role', ['business_owner', 'subscriber']);
            rolesRemoved++;
          }

          // CRM log
          await supabaseClient.from('crm_interactions').insert({
            user_id: subscription.user_id,
            interaction_type: 'subscription_deactivated_sync',
            channel: 'system',
            description: `Assinatura desativada via sincronização. Status ASAAS: ${asaasStatus}. ${deactivated?.length || 0} negócio(s) desativado(s).`,
            metadata: { subscription_id: subscription.id, external_id: externalId, asaas_status: asaasStatus, businesses_deactivated: deactivated?.map(b => b.name) }
          }).catch(() => {});
        }

        // =====================================================
        // STEP 4: Check local expiration (even if ASAAS is fine)
        // =====================================================
        if (subscription.status === 'active' && subscription.expires_at && !shouldDeactivate) {
          const expiresAt = new Date(subscription.expires_at);
          const graceDate = new Date(expiresAt);
          graceDate.setDate(graceDate.getDate() + GRACE_PERIOD_DAYS);

          if (graceDate < new Date()) {
            logStep("Subscription expired locally (past grace)", { id: subscription.id, expires_at: subscription.expires_at });

            await supabaseClient
              .from('user_subscriptions')
              .update({ status: 'expired', updated_at: new Date().toISOString() })
              .eq('id', subscription.id);
            updatedSubscriptions++;

            const { data: deactivated } = await supabaseClient
              .from('businesses')
              .update({ subscription_active: false, updated_at: new Date().toISOString() })
              .eq('owner_id', subscription.user_id)
              .eq('is_complimentary', false)
              .select('id, name');

            deactivatedBusinesses += deactivated?.length || 0;

            const { data: remaining } = await supabaseClient
              .from('businesses')
              .select('id')
              .eq('owner_id', subscription.user_id)
              .eq('subscription_active', true)
              .limit(1);

            if (!remaining || remaining.length === 0) {
              await supabaseClient
                .from('user_roles')
                .delete()
                .eq('user_id', subscription.user_id)
                .in('role', ['business_owner', 'subscriber']);
              rolesRemoved++;
            }

            await supabaseClient.from('crm_interactions').insert({
              user_id: subscription.user_id,
              interaction_type: 'subscription_expired_local',
              channel: 'system',
              description: `Assinatura expirada localmente (expires_at: ${subscription.expires_at}). ${deactivated?.length || 0} negócio(s) desativado(s).`,
              metadata: { subscription_id: subscription.id, expires_at: subscription.expires_at }
            }).catch(() => {});
          }
        }

      } catch (error: any) {
        logStep("Error processing subscription", { id: subscription.id, error: error.message });
        syncErrors.push({ subscriptionId: subscription.id, error: error.message });
      }
    }

    // =====================================================
    // STEP 5: Also run deactivate_expired_businesses for safety
    // =====================================================
    try {
      const { data: expiredCount } = await supabaseClient.rpc('deactivate_expired_businesses');
      logStep("deactivate_expired_businesses result", { expiredCount });
    } catch (e: any) {
      logStep("deactivate_expired_businesses error", { error: e.message });
    }

    const result = {
      success: true,
      message: "Subscription sync completed",
      updatedSubscriptions,
      activatedBusinesses,
      deactivatedBusinesses,
      rolesRemoved,
      totalProcessed: subscriptions?.length || 0,
      errors: syncErrors,
    };

    logStep("Sync completed", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in sync function", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage, success: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
