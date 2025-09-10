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
    logStep("Sync subscription status started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    if (!asaasApiKey) {
      throw new Error("ASAAS_API_KEY not configured");
    }

    // Buscar assinaturas pendentes com external_subscription_id
    const { data: pendingSubscriptions, error: fetchError } = await supabaseClient
      .from("user_subscriptions")
      .select("*")
      .eq("status", "pending")
      .not("external_subscription_id", "is", null);

    if (fetchError) {
      throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);
    }

    logStep("Found pending subscriptions", { count: pendingSubscriptions?.length || 0 });

    if (!pendingSubscriptions || pendingSubscriptions.length === 0) {
      return new Response(JSON.stringify({ 
        success: true,
        message: "No pending subscriptions to sync" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let updatedCount = 0;
    let activatedBusinesses = 0;

    // Verificar cada assinatura pendente no ASAAS
    for (const subscription of pendingSubscriptions) {
      try {
        logStep("Checking subscription in ASAAS", { 
          subscriptionId: subscription.id,
          paymentId: subscription.external_subscription_id 
        });

        // Consultar status do pagamento no ASAAS
        const asaasResponse = await fetch(
          `https://www.asaas.com/api/v3/payments/${subscription.external_subscription_id}`,
          {
            method: "GET",
            headers: {
              "access_token": asaasApiKey,
              "Content-Type": "application/json",
            },
          }
        );

        if (!asaasResponse.ok) {
          logStep("ASAAS API error", { 
            status: asaasResponse.status,
            paymentId: subscription.external_subscription_id 
          });
          continue;
        }

        const paymentData = await asaasResponse.json();
        logStep("ASAAS payment status", { 
          paymentId: subscription.external_subscription_id,
          status: paymentData.status 
        });

        // Se o pagamento foi confirmado no ASAAS
        if (paymentData.status === "RECEIVED" || paymentData.status === "CONFIRMED") {
          // Atualizar status da assinatura
          const { error: updateError } = await supabaseClient
            .from("user_subscriptions")
            .update({ 
              status: "active",
              updated_at: new Date().toISOString()
            })
            .eq("id", subscription.id);

          if (updateError) {
            logStep("Error updating subscription", { error: updateError });
            continue;
          }

          updatedCount++;
          logStep("Subscription activated", { subscriptionId: subscription.id });

          // Ativar negócios do usuário
          const { data: businesses, error: bizError } = await supabaseClient
            .from("businesses")
            .update({
              subscription_active: true,
              subscription_expires_at: subscription.expires_at,
              updated_at: new Date().toISOString()
            })
            .eq("owner_id", subscription.user_id)
            .select("id, name");

          if (bizError) {
            logStep("Error updating businesses", { error: bizError });
          } else {
            activatedBusinesses += businesses?.length || 0;
            logStep("Businesses activated", { 
              userId: subscription.user_id,
              businessCount: businesses?.length || 0 
            });
          }
        }

      } catch (error) {
        logStep("Error processing subscription", { 
          subscriptionId: subscription.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Sync completed",
      subscriptionsUpdated: updatedCount,
      businessesActivated: activatedBusinesses
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in sync process", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});