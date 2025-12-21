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

// ✅ SEGURANÇA: Validação de assinatura do webhook
const validateWebhookSignature = async (supabaseClient: any, req: Request, body: any) => {
  // Por enquanto, apenas registra a tentativa
  const signature = req.headers.get('asaas-access-token') || req.headers.get('x-webhook-token');
  
  try {
    await supabaseClient
      .from('webhook_signatures')
      .insert({
        webhook_provider: 'asaas',
        signature_header: signature ? 'asaas-access-token' : 'none',
        signature_value: signature,
        request_body: JSON.stringify(body).substring(0, 1000), // Limitar tamanho
        validated: signature ? null : false,
        validation_error: signature ? null : 'No signature provided'
      });
  } catch (error) {
    logStep('Failed to log webhook signature', { error });
  }
  
  // Validar assinatura do webhook
  const webhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
  if (!webhookToken) {
    throw new Error('ASAAS_WEBHOOK_TOKEN not configured');
  }
  
  if (signature !== webhookToken) {
    await supabaseClient
      .from('webhook_signatures')
      .update({ 
        validated: false,
        validation_error: 'Invalid signature - token mismatch'
      })
      .eq('signature_value', signature);
    throw new Error('Invalid webhook signature');
  }
  
  // Marcar como validado
  await supabaseClient
    .from('webhook_signatures')
    .update({ 
      validated: true,
      validation_error: null
    })
    .eq('signature_value', signature);
  
  return true;
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const webhookData = await req.json();
    
    // ✅ SEGURANÇA: Validar assinatura do webhook (registra tentativa)
    await validateWebhookSignature(supabaseClient, req, webhookData);
    
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

        // Buscar assinatura pelo payment.subscription (se pagamento for de assinatura)
        let subscription = null;
        let subError = null;

        if (payment.subscription) {
          // Se payment tem subscription, buscar pela subscription ID
          const result = await supabaseClient
            .from("user_subscriptions")
            .select("*")
            .eq("external_subscription_id", payment.subscription)
            .maybeSingle();
          
          subscription = result.data;
          subError = result.error;
        } else {
          // Fallback: buscar por payment ID (para pagamentos avulsos)
          const result = await supabaseClient
            .from("user_subscriptions")
            .select("*")
            .eq("external_subscription_id", payment.id)
            .maybeSingle();
          
          subscription = result.data;
          subError = result.error;
        }

        if (subError) {
          logStep("Error searching subscription", { paymentId: payment.id, error: subError });
          throw new Error(`Database error: ${subError.message}`);
        }

        if (!subscription) {
          logStep("Subscription not found for payment", { 
            paymentId: payment.id, 
            subscriptionId: payment.subscription 
          });
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

        // Check if user has complimentary businesses - don't process payment for them
        const { data: complimentaryBusinesses } = await supabaseClient
          .from('businesses')
          .select('id, name')
          .eq('owner_id', subscription.user_id)
          .eq('is_complimentary', true);

        if (complimentaryBusinesses && complimentaryBusinesses.length > 0) {
          logStep('User has complimentary businesses - cancelling active subscription', {
            userId: subscription.user_id,
            complimentaryCount: complimentaryBusinesses.length
          });
          
          // ✅ NOVO: Cancelar assinatura ativa se existir
          const { data: activeSubscription } = await supabaseClient
            .from('user_subscriptions')
            .select('id, external_subscription_id')
            .eq('user_id', subscription.user_id)
            .eq('status', 'active')
            .maybeSingle();

          if (activeSubscription) {
            // Invocar subscription-management para cancelar
            try {
              const authHeader = req.headers.get('authorization');
              await supabaseClient.functions.invoke('subscription-management', {
                body: {
                  action: 'cancel',
                  subscriptionId: activeSubscription.id
                },
                headers: authHeader ? { Authorization: authHeader } : {}
              });

              logStep('Active subscription cancelled for complimentary business', {
                userId: subscription.user_id,
                subscriptionId: activeSubscription.id
              });
            } catch (cancelError) {
              logStep('Error cancelling subscription via edge function', { error: cancelError });
              // Fallback: cancelar localmente
              await supabaseClient
                .from('user_subscriptions')
                .update({ 
                  status: 'cancelled',
                  updated_at: new Date().toISOString()
                })
                .eq('id', activeSubscription.id);
            }
          }
          
          await markEventAsProcessed(supabaseClient, eventId, payment.id, webhookData.event, webhookData);
          
          return new Response(JSON.stringify({ 
            success: true, 
            message: "Payment skipped and subscription cancelled - user has complimentary businesses",
            complimentaryBusinesses: complimentaryBusinesses.length,
            subscriptionCancelled: !!activeSubscription
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Só atualizar se não estiver ativo
        if (subscription.status !== "active") {
          // Update subscription status to active
          const { error: updateError } = await supabaseClient
            .from('user_subscriptions')
            .update({ 
              status: 'active'
            })
            .eq('id', subscription.id);

          if (updateError) {
            logStep('Failed to update subscription status', { error: updateError });
          } else {
            logStep('Subscription status updated to active');
          }
        }
        
        // Use new 31-day renewal system
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

        // Marcar evento como processado
        await markEventAsProcessed(supabaseClient, eventId, payment.id, webhookData.event, webhookData);

        return new Response(JSON.stringify({ 
          success: true,
          message: "Payment processed successfully - 31 day renewal applied",
          subscriptionId: subscription.id,
          businessesActivated: renewalResult?.businesses_renewed || 0,
          renewal_date: renewalResult?.renewal_date || null
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

        // Atribuir role business_owner ao usuário
        const { data: existingRole } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', localSub.user_id)
          .eq('role', 'business_owner')
          .maybeSingle();

        if (!existingRole) {
          await supabaseClient
            .from('user_roles')
            .insert({
              user_id: localSub.user_id,
              role: 'business_owner'
            });
          logStep("Role business_owner assigned", { userId: localSub.user_id });
        }

        logStep("Subscription activated", { subscriptionId: localSub.id });
      }
    }
    
    // Handle event registration payments
    else if (webhookData.event === "PAYMENT_RECEIVED" || 
             webhookData.event === "PAYMENT_CONFIRMED") {
      const payment = webhookData.payment;
      
      // Check if this is an event registration payment
      if (payment?.externalReference?.startsWith('event_registration_')) {
        const registrationId = payment.externalReference.replace('event_registration_', '');
        
        logStep("Processing event registration payment", { registrationId, paymentId: payment.id });
        
        // Update registration status
        const { error: updateError } = await supabaseClient
          .from('event_registrations')
          .update({
            status: 'confirmed',
            paid: true,
            payment_id: payment.id,
          })
          .eq('id', registrationId);
        
        if (updateError) {
          logStep("Failed to update event registration", { error: updateError });
        } else {
          logStep("Event registration confirmed", { registrationId });
          
          // Increment event participants count
          const { data: registration } = await supabaseClient
            .from('event_registrations')
            .select('event_id')
            .eq('id', registrationId)
            .single();
          
          if (registration) {
            await supabaseClient.rpc('increment_event_participants', { 
              p_event_id: registration.event_id 
            }).catch(() => {
              // Fallback if RPC doesn't exist
              supabaseClient
                .from('events')
                .update({ current_participants: supabaseClient.rpc('get_event_participants', { p_event_id: registration.event_id }) })
                .eq('id', registration.event_id);
            });
          }
        }
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