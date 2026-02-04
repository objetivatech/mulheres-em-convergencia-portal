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

// Log sync errors for admin monitoring
const logSyncError = async (supabaseClient: any, error: any, context: any) => {
  try {
    await supabaseClient.from('sync_error_log').insert({
      error_type: 'subscription_sync',
      error_message: error.message || String(error),
      context: context,
      created_at: new Date().toISOString()
    });
  } catch (logError) {
    logStep('Failed to log sync error', { error: logError.message });
  }
};

// Notify admins of critical sync failures
const notifyAdmins = async (supabaseClient: any, message: string, details: any) => {
  try {
    // Get admin emails
    const { data: admins } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('is_admin', true);

    if (admins && admins.length > 0) {
      // Log critical notification (in production, you could send email here)
      logStep('ADMIN NOTIFICATION', { message, details, adminCount: admins.length });
      
      // Store notification for admin dashboard
      await supabaseClient.from('admin_notifications').insert({
        type: 'sync_failure',
        title: 'Falha na Sincronização de Assinatura',
        message,
        metadata: details,
        created_at: new Date().toISOString()
      }).catch(() => {});
    }
  } catch (error) {
    logStep('Failed to notify admins', { error: error.message });
  }
};

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

    // Parse request body for optional user_id parameter
    let specificUserId: string | null = null;
    let forceSync = false;
    try {
      const body = await req.json();
      specificUserId = body?.user_id || null;
      forceSync = body?.force || false;
      logStep("Request body parsed", { specificUserId, forceSync });
    } catch (e) {
      logStep("No request body or invalid JSON, proceeding with full sync");
    }

    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    if (!asaasApiKey) {
      throw new Error('ASAAS API key not configured');
    }

    // Determine ASAAS base URL
    const asaasBaseUrl = asaasApiKey.includes('_test_') 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://www.asaas.com/api/v3';

    // Helper to call ASAAS API
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

    // Fetch subscriptions to sync
    // Include both pending AND active (to verify they're still active in ASAAS)
    let query = supabaseClient
      .from('user_subscriptions')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          email,
          cpf
        )
      `)
      .not('external_subscription_id', 'is', null);

    if (specificUserId) {
      query = query.eq('user_id', specificUserId);
    } else if (!forceSync) {
      // Only sync pending subscriptions in normal mode
      query = query.eq('status', 'pending');
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);
    }

    logStep("Subscriptions to sync", { 
      count: subscriptions?.length || 0,
      specificUser: specificUserId,
      forceSync
    });

    let updatedSubscriptions = 0;
    let activatedBusinesses = 0;
    let syncErrors: any[] = [];
    let requeued: string[] = [];

    // Process each subscription
    for (const subscription of subscriptions || []) {
      try {
        logStep("Processing subscription", { 
          subscriptionId: subscription.id,
          externalId: subscription.external_subscription_id,
          userId: subscription.user_id,
          currentStatus: subscription.status
        });

        const externalId = subscription.external_subscription_id;
        let asaasStatus: string | null = null;
        let isPaymentConfirmed = false;
        let asaasEntityType: 'subscription' | 'payment' | null = null;

        // First, try to get it as a subscription
        try {
          const subscriptionData = await asaasFetch(`/subscriptions/${externalId}`);
          if (subscriptionData && subscriptionData.status) {
            asaasStatus = subscriptionData.status;
            asaasEntityType = 'subscription';
            logStep("Found as ASAAS subscription", { externalId, status: asaasStatus });
            
            // For subscriptions, we need to check if there are RECEIVED/CONFIRMED payments
            if (asaasStatus === 'ACTIVE') {
              try {
                const paymentsData = await asaasFetch(`/payments?subscription=${externalId}&status=RECEIVED&limit=1`);
                if (paymentsData.data && paymentsData.data.length > 0) {
                  isPaymentConfirmed = true;
                  logStep("Subscription has confirmed payments", { count: paymentsData.totalCount });
                }
              } catch (e) {
                // Try CONFIRMED status
                const paymentsData = await asaasFetch(`/payments?subscription=${externalId}&status=CONFIRMED&limit=1`);
                if (paymentsData.data && paymentsData.data.length > 0) {
                  isPaymentConfirmed = true;
                }
              }
            }
          }
        } catch (subError: any) {
          logStep("Not a subscription, trying as payment", { externalId, error: subError.message });
          
          // Try as a single payment
          try {
            const paymentData = await asaasFetch(`/payments/${externalId}`);
            if (paymentData && paymentData.status) {
              asaasStatus = paymentData.status;
              asaasEntityType = 'payment';
              isPaymentConfirmed = paymentData.status === 'RECEIVED' || paymentData.status === 'CONFIRMED';
              logStep("Found as ASAAS payment", { externalId, status: asaasStatus });
            }
          } catch (payError: any) {
            logStep("Not found as payment either", { externalId, error: payError.message });
            
            // Record this as an error for admin review
            syncErrors.push({
              subscriptionId: subscription.id,
              externalId,
              userId: subscription.user_id,
              userName: subscription.profiles?.full_name,
              userEmail: subscription.profiles?.email,
              error: 'External ID not found in ASAAS'
            });
            
            continue;
          }
        }

        // Determine if we should activate
        const shouldActivate = 
          isPaymentConfirmed || 
          asaasStatus === 'ACTIVE' ||
          asaasStatus === 'RECEIVED' || 
          asaasStatus === 'CONFIRMED';

        if (shouldActivate && subscription.status !== 'active') {
          logStep("Activating subscription", { 
            subscriptionId: subscription.id,
            asaasStatus,
            asaasEntityType
          });

          // Update subscription status to active
          const { error: updateError } = await supabaseClient
            .from('user_subscriptions')
            .update({ 
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id);

          if (updateError) {
            logStep("Failed to update subscription", { 
              subscriptionId: subscription.id,
              error: updateError 
            });
            syncErrors.push({
              subscriptionId: subscription.id,
              error: `Failed to update status: ${updateError.message}`
            });
            continue;
          }

          updatedSubscriptions++;

          // Activate businesses for this user - calculate 31 days from now
          const renewalDate = new Date();
          renewalDate.setDate(renewalDate.getDate() + 31);
          
          const { data: businesses, error: bizError } = await supabaseClient
            .from('businesses')
            .update({
              subscription_active: true,
              subscription_expires_at: subscription.expires_at,
              subscription_renewal_date: renewalDate.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('owner_id', subscription.user_id)
            .select('id, name');

          if (bizError) {
            logStep("Failed to activate businesses", { 
              userId: subscription.user_id,
              error: bizError 
            });
          } else {
            activatedBusinesses += businesses?.length || 0;
            logStep("Businesses activated", { 
              userId: subscription.user_id,
              count: businesses?.length || 0,
              businesses: businesses?.map(b => ({ id: b.id, name: b.name }))
            });
          }

          // Log CRM interaction
          try {
            await supabaseClient.from('crm_interactions').insert({
              user_id: subscription.user_id,
              cpf: subscription.profiles?.cpf,
              interaction_type: 'subscription_activated_sync',
              channel: 'system',
              description: `Assinatura sincronizada e ativada via sync-subscription-status`,
              metadata: {
                subscription_id: subscription.id,
                external_id: externalId,
                asaas_status: asaasStatus,
                asaas_entity_type: asaasEntityType,
                businesses_activated: businesses?.length || 0
              }
            });
          } catch (crmError) {
            logStep("Failed to log CRM interaction", { error: crmError });
          }

        } else if (!shouldActivate && subscription.status === 'pending') {
          // Still pending - add to requeue for next sync
          requeued.push(subscription.id);
          logStep("Subscription still pending", { 
            subscriptionId: subscription.id,
            asaasStatus 
          });
        } else if (asaasStatus === 'OVERDUE' || asaasStatus === 'CANCELED') {
          // Handle cancelled/overdue subscriptions
          logStep("Subscription is overdue/cancelled in ASAAS", {
            subscriptionId: subscription.id,
            asaasStatus
          });
          
          // Only deactivate if it was active
          if (subscription.status === 'active') {
            await supabaseClient
              .from('user_subscriptions')
              .update({ 
                status: 'cancelled',
                updated_at: new Date().toISOString()
              })
              .eq('id', subscription.id);
            
            syncErrors.push({
              subscriptionId: subscription.id,
              externalId,
              userId: subscription.user_id,
              userName: subscription.profiles?.full_name,
              warning: `Subscription marked as ${asaasStatus} in ASAAS`
            });
          }
        }
      } catch (error: any) {
        logStep("Error processing subscription", { 
          subscriptionId: subscription.id,
          error: error.message 
        });
        
        syncErrors.push({
          subscriptionId: subscription.id,
          externalId: subscription.external_subscription_id,
          userId: subscription.user_id,
          error: error.message
        });
      }
    }

    // If there were sync errors, notify admins
    if (syncErrors.length > 0) {
      await notifyAdmins(supabaseClient, 
        `${syncErrors.length} erros na sincronização de assinaturas`,
        { errors: syncErrors }
      );
    }

    logStep("Sync completed", { 
      updatedSubscriptions,
      activatedBusinesses,
      totalProcessed: subscriptions?.length || 0,
      errorsCount: syncErrors.length,
      requeuedCount: requeued.length
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Subscription sync completed",
      updatedSubscriptions,
      activatedBusinesses,
      totalProcessed: subscriptions?.length || 0,
      errors: syncErrors,
      requeued: requeued.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in sync function", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
