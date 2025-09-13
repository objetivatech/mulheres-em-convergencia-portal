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
    try {
      const body = await req.json();
      specificUserId = body?.user_id || null;
      logStep("Request body parsed", { specificUserId });
    } catch (e) {
      logStep("No request body or invalid JSON, proceeding with full sync");
    }

    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    if (!asaasApiKey) {
      throw new Error('ASAAS API key not configured');
    }

    // Helper to call ASAAS API with environment fallback
    const asaasBases = ['https://www.asaas.com/api/v3', 'https://sandbox.asaas.com/api/v3'];
    const asaasFetch = async (path: string) => {
      for (const base of asaasBases) {
        try {
          const res = await fetch(`${base}${path}`, {
            headers: {
              'Content-Type': 'application/json',
              'access_token': asaasApiKey,
            },
          });
          
          if (res.ok) {
            logStep('ASAAS request successful', { base, path });
            return await res.json();
          }
        } catch (error) {
          logStep('ASAAS request failed', { base, path, error: error.message });
        }
      }
      throw new Error(`Failed to fetch from ASAAS: ${path}`);
    };

    // Fetch pending subscriptions, optionally filtered by user
    let query = supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'pending')
      .not('external_subscription_id', 'is', null);

    if (specificUserId) {
      query = query.eq('user_id', specificUserId);
    }

    const { data: pendingSubscriptions, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);
    }

    logStep("Pending subscriptions found", { 
      count: pendingSubscriptions?.length || 0,
      specificUser: specificUserId 
    });

    let updatedSubscriptions = 0;
    let activatedBusinesses = 0;

    // Process each pending subscription
    for (const subscription of pendingSubscriptions || []) {
      try {
        logStep("Processing subscription", { 
          subscriptionId: subscription.id,
          externalId: subscription.external_subscription_id,
          userId: subscription.user_id
        });

        let paymentStatus = null;
        let subscriptionStatus = null;

        // Try to get status as both subscription and payment
        try {
          // First, try as subscription
          const subscriptionData = await asaasFetch(`/subscriptions/${subscription.external_subscription_id}`);
          if (subscriptionData && subscriptionData.status) {
            subscriptionStatus = subscriptionData.status;
            logStep("Found as ASAAS subscription", { 
              externalId: subscription.external_subscription_id,
              status: subscriptionStatus 
            });
          }
        } catch (subError) {
          logStep("Not found as subscription, trying as payment", { 
            externalId: subscription.external_subscription_id 
          });
          
          // If not subscription, try as payment
          try {
            const paymentData = await asaasFetch(`/payments/${subscription.external_subscription_id}`);
            if (paymentData && paymentData.status) {
              paymentStatus = paymentData.status;
              logStep("Found as ASAAS payment", { 
                externalId: subscription.external_subscription_id,
                status: paymentStatus 
              });
            }
          } catch (payError) {
            logStep("Not found as payment either", { 
              externalId: subscription.external_subscription_id,
              error: payError.message 
            });
            continue;
          }
        }

        // Check if payment/subscription is confirmed
        const isConfirmed = 
          paymentStatus === 'RECEIVED' || 
          paymentStatus === 'CONFIRMED' ||
          subscriptionStatus === 'ACTIVE';

        if (isConfirmed) {
          logStep("Confirming subscription", { 
            subscriptionId: subscription.id,
            paymentStatus,
            subscriptionStatus 
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
            continue;
          }

          updatedSubscriptions++;

          // Activate businesses for this user
          const { data: businesses, error: bizError } = await supabaseClient
            .from('businesses')
            .update({
              subscription_active: true,
              subscription_expires_at: subscription.expires_at,
              updated_at: new Date().toISOString()
            })
            .eq('owner_id', subscription.user_id)
            .eq('subscription_active', false)
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
        } else {
          logStep("Payment/subscription not confirmed yet", { 
            externalId: subscription.external_subscription_id,
            paymentStatus,
            subscriptionStatus 
          });
        }
      } catch (error) {
        logStep("Error processing subscription", { 
          subscriptionId: subscription.id,
          error: error.message 
        });
      }
    }

    logStep("Sync completed", { 
      updatedSubscriptions,
      activatedBusinesses,
      totalProcessed: pendingSubscriptions?.length || 0
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Subscription sync completed",
      updatedSubscriptions,
      activatedBusinesses,
      totalProcessed: pendingSubscriptions?.length || 0
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
