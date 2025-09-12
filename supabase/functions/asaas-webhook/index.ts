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

// Função para verificar se evento já foi processado (idempotência)
const isEventProcessed = async (supabaseClient: any, eventId: string, paymentId: string) => {
  const { data } = await supabaseClient
    .from("webhook_events_log")
    .select("id")
    .eq("event_id", eventId)
    .eq("payment_id", paymentId)
    .maybeSingle();
  
  return !!data;
};

// Função para marcar evento como processado
const markEventAsProcessed = async (supabaseClient: any, eventId: string, paymentId: string, eventType: string, webhookData?: any) => {
  await supabaseClient
    .from("webhook_events_log")
    .insert({
      event_id: eventId,
      payment_id: paymentId,
      subscription_id: webhookData?.subscription?.id || null,
      event_type: eventType,
      webhook_data: webhookData || null,
      processed_at: new Date().toISOString()
    });
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received", { method: req.method, url: req.url });

    // ASAAS usa validação por IP (já configurado no Supabase)
    // Removida validação X-Webhook-Token conforme documentação oficial

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const webhookData = await req.json();
    logStep("Webhook data received", { 
      event: webhookData.event, 
      paymentId: webhookData.payment?.id,
      subscriptionId: webhookData.subscription?.id
    });

    // Eventos de pagamento
    if (webhookData.event === "PAYMENT_RECEIVED" || 
        webhookData.event === "PAYMENT_CONFIRMED" || 
        webhookData.event === "PAYMENT_UPDATED") {
      
      const payment = webhookData.payment;
      if (!payment?.id) {
        throw new Error("Payment ID not found in webhook");
      }

      // Verificar se já foi processado (idempotência)
      const eventId = `${webhookData.event}_${payment.id}_${Date.now()}`;
      if (await isEventProcessed(supabaseClient, eventId, payment.id)) {
        logStep("Event already processed", { eventId, paymentId: payment.id });
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Event already processed" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Processar apenas pagamentos confirmados
      if (payment.status === "RECEIVED" || payment.status === "CONFIRMED") {
        logStep("Processing payment confirmation", { 
          paymentId: payment.id, 
          status: payment.status,
          value: payment.value 
        });

        // Buscar assinatura pelo external_subscription_id
        const { data: subscription, error: subError } = await supabaseClient
          .from("user_subscriptions")
          .select("*")
          .eq("external_subscription_id", payment.id)
          .maybeSingle();

        if (subError) {
          logStep("Error searching subscription", { paymentId: payment.id, error: subError });
          throw new Error(`Database error: ${subError.message}`);
        }

        if (!subscription) {
          logStep("Subscription not found for payment", { paymentId: payment.id });
          // Marcar como processado mesmo assim para evitar reprocessamento
          await markEventAsProcessed(supabaseClient, eventId, payment.id, webhookData.event, webhookData);
          return new Response(JSON.stringify({ 
            success: true, 
            message: "Subscription not found - payment may be unrelated" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        logStep("Subscription found", { 
          subscriptionId: subscription.id,
          currentStatus: subscription.status,
          userId: subscription.user_id
        });

        // Só atualizar se não estiver ativo
        if (subscription.status !== "active") {
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
        } else {
          logStep("Subscription already active, skipping update");
        }

        // Ativar negócios do usuário
        const { data: businesses, error: bizError } = await supabaseClient
          .from("businesses")
          .update({
            subscription_active: true,
            subscription_expires_at: subscription.expires_at,
            updated_at: new Date().toISOString()
          })
          .eq("owner_id", subscription.user_id)
          .eq("subscription_active", false) // Só atualizar os inativos
          .select("id, name");

        if (bizError) {
          logStep("Error updating businesses", { error: bizError });
        } else {
          logStep("Businesses activated", { 
            count: businesses?.length || 0,
            businesses: businesses?.map(b => ({ id: b.id, name: b.name }))
          });
        }

        // Marcar evento como processado
        await markEventAsProcessed(supabaseClient, eventId, payment.id, webhookData.event, webhookData);

        return new Response(JSON.stringify({ 
          success: true,
          message: "Payment processed successfully",
          subscriptionId: subscription.id,
          businessesActivated: businesses?.length || 0
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        logStep("Payment not confirmed yet", { paymentId: payment.id, status: payment.status });
      }
    }
    
    // Eventos de assinatura recorrente
    else if (webhookData.event === "SUBSCRIPTION_RECEIVED" || 
             webhookData.event === "SUBSCRIPTION_CONFIRMED") {
      
      const subscription = webhookData.subscription;
      if (!subscription?.id) {
        throw new Error("Subscription ID not found in webhook");
      }

      logStep("Processing subscription event", { 
        subscriptionId: subscription.id,
        status: subscription.status,
        event: webhookData.event
      });

      // Buscar assinatura local pelo external_subscription_id
      const { data: localSub, error: subError } = await supabaseClient
        .from("user_subscriptions")
        .select("*")
        .eq("external_subscription_id", subscription.id)
        .maybeSingle();

      if (localSub && subscription.status === "ACTIVE") {
        // Ativar assinatura e negócios
        await supabaseClient
          .from("user_subscriptions")
          .update({ 
            status: "active",
            updated_at: new Date().toISOString()
          })
          .eq("id", localSub.id);

        await supabaseClient
          .from("businesses")
          .update({
            subscription_active: true,
            subscription_expires_at: localSub.expires_at,
            updated_at: new Date().toISOString()
          })
          .eq("owner_id", localSub.user_id);

        logStep("Subscription activated", { subscriptionId: localSub.id });
      }
    }

    // Para outros eventos, apenas logar
    logStep("Event processed", { 
      event: webhookData.event,
      processed: true 
    });
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Event processed successfully" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook processing", { 
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});