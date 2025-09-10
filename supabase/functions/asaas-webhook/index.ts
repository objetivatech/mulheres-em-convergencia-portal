import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ASAAS-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const webhookData = await req.json();
    logStep("Webhook data received", { 
      event: webhookData.event, 
      paymentId: webhookData.payment?.id 
    });

    // Processar apenas eventos de pagamento confirmado
    if (webhookData.event === "PAYMENT_RECEIVED" || webhookData.event === "PAYMENT_CONFIRMED") {
      const paymentId = webhookData.payment?.id;
      
      if (!paymentId) {
        throw new Error("Payment ID not found in webhook");
      }

      logStep("Processing payment confirmation", { paymentId });

      // Buscar assinatura pelo external_subscription_id
      const { data: subscription, error: subError } = await supabaseClient
        .from("user_subscriptions")
        .select("*")
        .eq("external_subscription_id", paymentId)
        .single();

      if (subError || !subscription) {
        logStep("Subscription not found", { paymentId, error: subError });
        return new Response("Subscription not found", { 
          status: 404,
          headers: corsHeaders 
        });
      }

      logStep("Subscription found", { 
        subscriptionId: subscription.id,
        currentStatus: subscription.status 
      });

      // Atualizar status da assinatura para active
      const { error: updateError } = await supabaseClient
        .from("user_subscriptions")
        .update({ 
          status: "active",
          updated_at: new Date().toISOString()
        })
        .eq("id", subscription.id);

      if (updateError) {
        throw new Error(`Failed to update subscription: ${updateError.message}`);
      }

      logStep("Subscription status updated to active");

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
        logStep("Businesses activated", { businesses });
      }

      return new Response(JSON.stringify({ 
        success: true,
        message: "Payment processed successfully",
        subscriptionId: subscription.id,
        businessesActivated: businesses?.length || 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Para outros eventos, apenas logar
    logStep("Event ignored", { event: webhookData.event });
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Event received but not processed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook processing", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});