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

// Validação de assinatura do webhook
const validateWebhookSignature = async (supabaseClient: any, req: Request, body: any) => {
  const signature = req.headers.get('asaas-access-token') || req.headers.get('x-webhook-token');
  
  try {
    await supabaseClient
      .from('webhook_signatures')
      .insert({
        webhook_provider: 'asaas',
        signature_header: signature ? 'asaas-access-token' : 'none',
        signature_value: signature,
        request_body: JSON.stringify(body).substring(0, 1000),
        validated: signature ? null : false,
        validation_error: signature ? null : 'No signature provided'
      });
  } catch (error) {
    logStep('Failed to log webhook signature', { error });
  }
  
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

// Process product payment confirmation - updates CRM, deals, donations
const processProductPayment = async (supabaseClient: any, payment: any, externalReference: string) => {
  logStep("Processing product payment confirmation", { paymentId: payment.id, externalReference });
  
  // Parse product info from external reference: product_{product_id}_{timestamp}
  const parts = externalReference.split('_');
  const productId = parts.length >= 2 ? parts[1] : null;
  
  // 1. Find the deal by payment_id in metadata
  const { data: deal } = await supabaseClient
    .from('crm_deals')
    .select('id, lead_id, user_id, cpf, value, title')
    .or(`metadata->payment_id.eq.${payment.id},metadata->external_reference.eq.${externalReference}`)
    .maybeSingle();
  
  if (deal) {
    // Update deal to won
    await supabaseClient
      .from('crm_deals')
      .update({
        stage: 'won',
        won: true,
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          payment_confirmed_at: new Date().toISOString(),
          payment_status: payment.status,
          payment_value: payment.value,
        },
      })
      .eq('id', deal.id);
    logStep("Deal marked as won", { dealId: deal.id });

    // 2. Update lead status to converted
    if (deal.lead_id) {
      await supabaseClient
        .from('crm_leads')
        .update({
          status: 'converted',
          converted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', deal.lead_id);
      logStep("Lead marked as converted", { leadId: deal.lead_id });
    }

    // 3. Create interaction for payment confirmed
    await supabaseClient.from('crm_interactions').insert({
      lead_id: deal.lead_id,
      user_id: deal.user_id,
      cpf: deal.cpf,
      interaction_type: 'product_purchase_confirmed',
      channel: 'payment_gateway',
      description: `Pagamento confirmado: ${deal.title} - Valor: R$ ${payment.value?.toFixed(2) || deal.value?.toFixed(2)}`,
      activity_name: deal.title,
      activity_paid: true,
      form_source: 'asaas_webhook',
      metadata: {
        payment_id: payment.id,
        payment_status: payment.status,
        payment_value: payment.value,
        deal_id: deal.id,
      },
    });
    logStep("Created payment confirmed interaction");

    // 4. Create conversion milestone
    await supabaseClient.from('crm_conversion_milestones').insert({
      milestone_type: 'product_purchase',
      milestone_name: `Compra: ${deal.title}`,
      cpf: deal.cpf,
      user_id: deal.user_id,
      total_value: payment.value || deal.value,
      metadata: {
        payment_id: payment.id,
        deal_id: deal.id,
        product_id: productId,
      },
    });
    logStep("Created conversion milestone");
  } else {
    logStep("No deal found for payment - checking donations");
  }

  // 5. Update donation status
  const { data: donation } = await supabaseClient
    .from('donations')
    .select('id')
    .eq('payment_id', payment.id)
    .maybeSingle();
  
  if (donation) {
    await supabaseClient
      .from('donations')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString(),
        metadata: {
          payment_confirmed_at: new Date().toISOString(),
          payment_status: payment.status,
        },
      })
      .eq('id', donation.id);
    logStep("Donation status updated to confirmed", { donationId: donation.id });
  }

  return { success: true, dealId: deal?.id };
};

// ✅ NOVO: Process ambassador commission from subscription payment
const processAmbassadorCommission = async (supabaseClient: any, subscription: any, payment: any) => {
  // Resolve ambassador_id: use stored value or fall back to referral_code lookup.
  // The fallback handles subscriptions created before the .active bug was fixed
  // (those have referral_code set but ambassador_id = NULL).
  let resolvedAmbassadorId = subscription.ambassador_id;

  if (!resolvedAmbassadorId && subscription.referral_code) {
    logStep('ambassador_id missing — resolving from referral_code', { referralCode: subscription.referral_code });
    const { data: ambassador, error: rpcError } = await supabaseClient
      .rpc('get_ambassador_by_referral', { referral_code: subscription.referral_code });
    if (rpcError) {
      logStep('get_ambassador_by_referral RPC failed', { error: String(rpcError) });
    }

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

  logStep("Processing ambassador commission", {
    ambassadorId: resolvedAmbassadorId,
    saleAmount: payment.value,
    subscriptionId: subscription.id
  });

  const commissionRate = 0.15; // 15%
  const commissionAmount = payment.value * commissionRate;

  // Calculate payout eligible date (vendas até dia 20 = pago dia 10 seguinte)
  const paymentDate = new Date();
  const cutoffDay = 20;
  let payoutEligibleDate;

  if (paymentDate.getDate() <= cutoffDay) {
    // Pago no mês seguinte
    payoutEligibleDate = new Date(
      paymentDate.getFullYear(),
      paymentDate.getMonth() + 1,
      10
    );
  } else {
    // Pago em dois meses
    payoutEligibleDate = new Date(
      paymentDate.getFullYear(),
      paymentDate.getMonth() + 2,
      10
    );
  }

  // Create ambassador referral record
  const { error: refError } = await supabaseClient
    .from('ambassador_referrals')
    .insert({
      ambassador_id: resolvedAmbassadorId,
      referred_user_id: subscription.user_id,
      subscription_id: subscription.id,
      plan_name: subscription.plan_id, // Will be enriched with plan details
      sale_amount: payment.value,
      commission_rate: commissionRate * 100,
      commission_amount: commissionAmount,
      status: 'confirmed',
      payment_confirmed_at: new Date().toISOString(),
      payout_eligible_date: payoutEligibleDate.toISOString().split('T')[0],
    });

  if (refError) {
    logStep("Error creating ambassador referral", { error: refError });
    return { success: false };
  }

  logStep("Ambassador referral created", {
    ambassadorId: resolvedAmbassadorId,
    commissionAmount,
    payoutEligibleDate: payoutEligibleDate.toISOString().split('T')[0]
  });

  // Update ambassador totals using RPC for atomic increment
  const { error: updateError } = await supabaseClient.rpc('increment_ambassador_totals', {
    p_ambassador_id: resolvedAmbassadorId,
    p_commission_amount: commissionAmount,
  });

  if (updateError) {
    // Fallback: fetch current values and update manually
    logStep("RPC increment failed, falling back to manual update", { error: updateError });
    const { data: currentAmbassador } = await supabaseClient
      .from('ambassadors')
      .select('total_earnings, total_sales, pending_commission')
      .eq('id', resolvedAmbassadorId)
      .single();

    if (currentAmbassador) {
      await supabaseClient
        .from('ambassadors')
        .update({
          total_earnings: (currentAmbassador.total_earnings || 0) + commissionAmount,
          total_sales: (currentAmbassador.total_sales || 0) + 1,
          pending_commission: (currentAmbassador.pending_commission || 0) + commissionAmount,
        })
        .eq('id', resolvedAmbassadorId);
      logStep("Ambassador totals updated via fallback");
    }
  } else {
    logStep("Ambassador totals updated via RPC");
  }

  // CRM: register referral_converted interaction on the ambassador's contact timeline
  try {
    const { data: ambData } = await supabaseClient
      .from('ambassadors')
      .select('user_id')
      .eq('id', resolvedAmbassadorId)
      .single();

    if (ambData?.user_id) {
      const { data: ambassadorProfile } = await supabaseClient
        .from('profiles')
        .select('cpf, email')
        .eq('id', ambData.user_id)
        .maybeSingle();

      const orFilters = [
        ambassadorProfile?.email ? `email.eq.${ambassadorProfile.email}` : null,
        ambassadorProfile?.cpf ? `cpf.eq.${ambassadorProfile.cpf}` : null,
      ].filter(Boolean) as string[];

      const ambassadorLead = orFilters.length > 0
        ? (await supabaseClient
            .from('crm_leads')
            .select('id')
            .or(orFilters.join(','))
            .maybeSingle()).data
        : null;

      await supabaseClient.from('crm_interactions').insert({
        lead_id: ambassadorLead?.id || null,
        user_id: ambData.user_id,
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
    }
  } catch (crmError) {
    logStep('CRM referral_converted interaction failed (non-blocking)', { error: String(crmError) });
  }

  return { success: true, commissionAmount };
};

// Process event registration payment
const processEventPayment = async (supabaseClient: any, payment: any, registrationId: string) => {
  logStep("Processing event registration payment", { registrationId, paymentId: payment.id });
  
  // Get registration details
  const { data: registration, error: regError } = await supabaseClient
    .from('event_registrations')
    .select('id, event_id, email, cpf, lead_id, full_name')
    .eq('id', registrationId)
    .single();
  
  if (regError || !registration) {
    logStep("Registration not found", { registrationId, error: regError });
    return { success: false };
  }

  // Update registration status
  const { error: updateError } = await supabaseClient
    .from('event_registrations')
    .update({
      status: 'confirmed',
      paid: true,
      payment_id: payment.id,
      payment_amount: payment.value,
      updated_at: new Date().toISOString(),
    })
    .eq('id', registrationId);
  if (updateError) {
    logStep("Failed to update event registration", { registrationId, error: updateError });
    return { success: false };
  }
  logStep("Event registration confirmed", { registrationId });

  // Increment event participants count
  const { error: incrError } = await supabaseClient.rpc('increment_event_participants', {
    p_event_id: registration.event_id
  });
  if (incrError) logStep("increment_event_participants RPC not available");

  // Update CRM deal for event if exists
  if (registration.lead_id) {
    const { data: eventDeal } = await supabaseClient
      .from('crm_deals')
      .select('id')
      .eq('lead_id', registration.lead_id)
      .or(`metadata->event_id.eq.${registration.event_id},stage.eq.inscrito`)
      .maybeSingle();
    
    if (eventDeal) {
      await supabaseClient
        .from('crm_deals')
        .update({
          stage: 'pago',
          updated_at: new Date().toISOString(),
          metadata: {
            payment_id: payment.id,
            payment_confirmed_at: new Date().toISOString(),
          },
        })
        .eq('id', eventDeal.id);
      logStep("Event deal updated to pago stage", { dealId: eventDeal.id });
    }

    // Update lead
    await supabaseClient
      .from('crm_leads')
      .update({
        status: 'qualified',
        updated_at: new Date().toISOString(),
      })
      .eq('id', registration.lead_id);
  }

  // Create interaction
  await supabaseClient.from('crm_interactions').insert({
    lead_id: registration.lead_id,
    cpf: registration.cpf,
    interaction_type: 'event_payment_confirmed',
    channel: 'payment_gateway',
    description: `Pagamento confirmado para evento`,
    activity_paid: true,
    form_source: 'asaas_webhook',
    metadata: {
      registration_id: registrationId,
      payment_id: payment.id,
      event_id: registration.event_id,
    },
  });

  return { success: true };
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
    
    // Validar assinatura do webhook
    await validateWebhookSignature(supabaseClient, req, webhookData);
    
    logStep("Webhook data received", { 
      event: webhookData.event, 
      paymentId: webhookData.payment?.id,
      externalReference: webhookData.payment?.externalReference,
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
      // Usa o ID único do evento Asaas (webhookData.id) quando disponível;
      // fallback para event+payment para garantir que o mesmo pagamento não seja reprocessado.
      const eventId = webhookData.id ?? `${webhookData.event}_${payment.id}`;
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
          value: payment.value,
          externalReference: payment.externalReference
        });

        const externalReference = payment.externalReference || '';

        // ==========================================
        // PRODUCT PURCHASE (from Landing Page)
        // ==========================================
        if (externalReference.startsWith('product_')) {
          const result = await processProductPayment(supabaseClient, payment, externalReference);
          await markEventAsProcessed(supabaseClient, eventId, payment.id, webhookData.event, webhookData);
          
          return new Response(JSON.stringify({ 
            success: true,
            message: "Product payment processed successfully",
            ...result
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // ==========================================
        // EVENT REGISTRATION PAYMENT
        // ==========================================
        if (externalReference.startsWith('event_registration_')) {
          const registrationId = externalReference.replace('event_registration_', '');
          const result = await processEventPayment(supabaseClient, payment, registrationId);
          await markEventAsProcessed(supabaseClient, eventId, payment.id, webhookData.event, webhookData);
          
          return new Response(JSON.stringify({ 
            success: true,
            message: "Event payment processed successfully",
            ...result
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // ==========================================
        // ACADEMY SUBSCRIPTION PAYMENT
        // ==========================================
        if (externalReference.startsWith('academy_')) {
          logStep("Processing Academy subscription payment", { paymentId: payment.id, externalReference });

          // Find academy subscription by asaas_subscription_id
          let academySub = null;
          if (payment.subscription) {
            const { data } = await supabaseClient
              .from("academy_subscriptions")
              .select("*")
              .eq("asaas_subscription_id", payment.subscription)
              .maybeSingle();
            academySub = data;
          }

          if (academySub) {
            // Activate subscription
            await supabaseClient
              .from("academy_subscriptions")
              .update({
                status: "active",
                started_at: academySub.started_at || new Date().toISOString(),
                expires_at: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", academySub.id);
            logStep("Academy subscription activated", { subId: academySub.id });

            // Ensure student role
            const { data: existingRole } = await supabaseClient
              .from("user_roles")
              .select("role")
              .eq("user_id", academySub.user_id)
              .eq("role", "student")
              .maybeSingle();

            if (!existingRole) {
              await supabaseClient
                .from("user_roles")
                .insert({ user_id: academySub.user_id, role: "student" });
              logStep("Student role assigned", { userId: academySub.user_id });
            }

            // CRM: update deal to won
            const { data: academyDeal } = await supabaseClient
              .from("crm_deals")
              .select("id, lead_id")
              .eq("product_type", "academy")
              .or(`metadata->subscription_id.eq.${payment.subscription}`)
              .maybeSingle();

            if (academyDeal) {
              await supabaseClient.from("crm_deals").update({
                stage: "won",
                won: true,
                closed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }).eq("id", academyDeal.id);

              await supabaseClient.from("crm_interactions").insert({
                lead_id: academyDeal.lead_id,
                interaction_type: "academy_payment_confirmed",
                channel: "payment_gateway",
                description: `Pagamento Academy confirmado - R$ ${payment.value?.toFixed(2)}`,
                activity_paid: true,
                form_source: "asaas_webhook",
                metadata: { payment_id: payment.id, subscription_id: payment.subscription },
              });
            }
          } else {
            logStep("No Academy subscription found for payment", { paymentId: payment.id });
          }

          await markEventAsProcessed(supabaseClient, eventId, payment.id, webhookData.event, webhookData);
          return new Response(JSON.stringify({
            success: true,
            message: "Academy subscription payment processed",
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // ==========================================
        // SUBSCRIPTION PAYMENT (Business Plans)
        // ==========================================
        // Buscar assinatura pelo payment.subscription
        let subscription = null;

        if (payment.subscription) {
          const { data, error } = await supabaseClient
            .from("user_subscriptions")
            .select("*")
            .eq("external_subscription_id", payment.subscription)
            .maybeSingle();
          
          subscription = data;
          if (error) {
            logStep("Error searching subscription", { error });
          }
        }

        if (!subscription) {
          // Try by payment ID
          const { data } = await supabaseClient
            .from("user_subscriptions")
            .select("*")
            .eq("external_subscription_id", payment.id)
            .maybeSingle();
          
          subscription = data;
        }

        if (!subscription) {
          logStep("No subscription found for payment", { 
            paymentId: payment.id, 
            subscriptionId: payment.subscription,
            externalReference 
          });
          await markEventAsProcessed(supabaseClient, eventId, payment.id, webhookData.event, webhookData);
          return new Response(JSON.stringify({ 
            success: true, 
            message: "Payment processed - no matching subscription or product" 
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

        // Check if user has complimentary businesses
        const { data: complimentaryBusinesses } = await supabaseClient
          .from('businesses')
          .select('id, name')
          .eq('owner_id', subscription.user_id)
          .eq('is_complimentary', true);

        if (complimentaryBusinesses && complimentaryBusinesses.length > 0) {
          logStep('User has complimentary businesses', {
            userId: subscription.user_id,
            complimentaryCount: complimentaryBusinesses.length
          });
          
          await markEventAsProcessed(supabaseClient, eventId, payment.id, webhookData.event, webhookData);
          
          return new Response(JSON.stringify({ 
            success: true, 
            message: "Payment skipped - user has complimentary businesses",
            complimentaryBusinesses: complimentaryBusinesses.length
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Update subscription if not active
        if (subscription.status !== "active") {
          await supabaseClient
            .from('user_subscriptions')
            .update({ 
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id);
          logStep('Subscription status updated to active');
        }
        
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
            const { error: ownerInsertError } = await supabaseClient
              .from('user_roles')
              .insert({ user_id: subscription.user_id, role: 'business_owner' });
            if (ownerInsertError) throw ownerInsertError;
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
            const { error: subInsertError } = await supabaseClient
              .from('user_roles')
              .insert({ user_id: subscription.user_id, role: 'subscriber' });
            if (subInsertError) throw subInsertError;
            logStep('Role subscriber granted', { userId: subscription.user_id });
          } else {
            logStep('Role subscriber already exists — skipping', { userId: subscription.user_id });
          }
        } catch (roleError) {
          // Non-blocking: log prominently so admin can spot it in Function logs
          logStep('CRITICAL: Failed to grant roles after payment — manual fix may be needed', {
            userId: subscription.user_id,
            error: String(roleError),
          });
        }

        // Processar comissão de embaixadora
        const commissionResult = await processAmbassadorCommission(supabaseClient, subscription, payment);
        if (commissionResult.success) {
          logStep('Ambassador commission processed', {
            commissionAmount: commissionResult.commissionAmount
          });
        }

        // Atualizar CRM: marcar lead como convertido e registrar interação
        try {
          // Buscar perfil do usuário para obter CPF e email
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('id, cpf, email, full_name')
            .eq('id', subscription.user_id)
            .maybeSingle();

          const userCpf = profile?.cpf || null;
          const userEmail = profile?.email || null;

          // Buscar lead por CPF ou email
          let leadId: string | null = null;
          if (userCpf) {
            const { data: leadByCpf } = await supabaseClient
              .from('crm_leads')
              .select('id')
              .eq('cpf', userCpf)
              .maybeSingle();
            if (leadByCpf) leadId = leadByCpf.id;
          }
          if (!leadId && userEmail) {
            const { data: leadByEmail } = await supabaseClient
              .from('crm_leads')
              .select('id')
              .eq('email', userEmail.toLowerCase())
              .maybeSingle();
            if (leadByEmail) leadId = leadByEmail.id;
          }

          // Atualizar deal existente ou registrar interação diretamente
          if (leadId) {
            await supabaseClient
              .from('crm_leads')
              .update({
                status: 'converted',
                converted_at: new Date().toISOString(),
                converted_user_id: subscription.user_id,
                updated_at: new Date().toISOString(),
              })
              .eq('id', leadId);
            logStep('CRM lead marked as converted', { leadId });

            // Atualizar deal para won se existir
            const { data: existingDeal } = await supabaseClient
              .from('crm_deals')
              .select('id')
              .eq('lead_id', leadId)
              .neq('stage', 'won')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (existingDeal) {
              await supabaseClient
                .from('crm_deals')
                .update({
                  stage: 'won',
                  won: true,
                  closed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  metadata: {
                    payment_id: payment.id,
                    payment_confirmed_at: new Date().toISOString(),
                    subscription_id: subscription.id,
                  },
                })
                .eq('id', existingDeal.id);
              logStep('CRM deal marked as won', { dealId: existingDeal.id });
            }
          }

          // Registrar interação de pagamento confirmado
          await supabaseClient.from('crm_interactions').insert({
            lead_id: leadId,
            user_id: subscription.user_id,
            cpf: userCpf,
            interaction_type: 'subscription_payment_confirmed',
            channel: 'payment_gateway',
            description: `Assinatura business confirmada - R$ ${payment.value?.toFixed(2) || '0.00'}`,
            activity_paid: true,
            form_source: 'asaas_webhook',
            metadata: {
              payment_id: payment.id,
              subscription_id: subscription.id,
              plan_id: subscription.plan_id,
              payment_value: payment.value,
            },
          });

          // Criar milestone de conversão
          await supabaseClient.from('crm_conversion_milestones').insert({
            milestone_type: 'subscription_activated',
            milestone_name: 'Assinatura Business Ativada',
            cpf: userCpf,
            user_id: subscription.user_id,
            total_value: payment.value,
            metadata: {
              payment_id: payment.id,
              subscription_id: subscription.id,
            },
          });
          logStep('CRM interaction and milestone created for subscription payment');
        } catch (crmError) {
          logStep('CRM update failed (non-blocking)', { error: String(crmError) });
        }

        // Marcar evento como processado
        await markEventAsProcessed(supabaseClient, eventId, payment.id, webhookData.event, webhookData);

        return new Response(JSON.stringify({ 
          success: true,
          message: "Subscription payment processed - 31 day renewal applied",
          subscriptionId: subscription.id,
          businessesActivated: renewalResult?.businesses_renewed || 0
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
    } else {
        logStep("Payment not confirmed yet", { paymentId: payment.id, status: payment.status });
      }
    }

    // ==========================================
    // PAYMENT_OVERDUE - Pagamento atrasado
    // ==========================================
    else if (webhookData.event === "PAYMENT_OVERDUE") {
      const payment = webhookData.payment;
      if (payment?.id) {
        logStep("Processing PAYMENT_OVERDUE", { paymentId: payment.id, subscription: payment.subscription });

        // Find subscription
        let subscription = null;
        if (payment.subscription) {
          const { data } = await supabaseClient
            .from("user_subscriptions")
            .select("*, profiles:user_id (id, full_name, email, cpf)")
            .eq("external_subscription_id", payment.subscription)
            .maybeSingle();
          subscription = data;
        }

        if (subscription) {
          // Log CRM interaction
          await supabaseClient.from('crm_interactions').insert({
            user_id: subscription.user_id,
            cpf: subscription.profiles?.cpf,
            interaction_type: 'payment_overdue',
            channel: 'payment_gateway',
            description: `Pagamento atrasado detectado. ID: ${payment.id}. Valor: R$ ${payment.value?.toFixed(2) || '0.00'}`,
            form_source: 'asaas_webhook',
            metadata: {
              payment_id: payment.id,
              subscription_id: subscription.id,
              external_subscription_id: payment.subscription,
              value: payment.value,
              due_date: payment.dueDate,
            },
          });

          // Count consecutive overdue events for this subscription
          const { count: overdueCount } = await supabaseClient
            .from('crm_interactions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', subscription.user_id)
            .eq('interaction_type', 'payment_overdue')
            .gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()); // last 60 days

          logStep("Overdue count for user", { userId: subscription.user_id, overdueCount });

          // After 2+ overdue events, start deactivation
          if (overdueCount && overdueCount >= 2) {
            logStep("Multiple overdue payments - deactivating", { userId: subscription.user_id });

            await supabaseClient
              .from('user_subscriptions')
              .update({ status: 'cancelled', updated_at: new Date().toISOString() })
              .eq('id', subscription.id);

            await supabaseClient
              .from('businesses')
              .update({ subscription_active: false, updated_at: new Date().toISOString() })
              .eq('owner_id', subscription.user_id)
              .eq('is_complimentary', false);

            // Check if user has remaining active businesses
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
            }

            await supabaseClient.from('crm_interactions').insert({
              user_id: subscription.user_id,
              interaction_type: 'subscription_deactivated_overdue',
              channel: 'system',
              description: `Assinatura desativada por inadimplência (${overdueCount} pagamentos atrasados).`,
              metadata: { subscription_id: subscription.id, overdue_count: overdueCount },
            });
          }

          // Log activity
          await supabaseClient.from('user_activity_log').insert({
            user_id: subscription.user_id,
            activity_type: 'payment_overdue',
            activity_description: `Pagamento atrasado: R$ ${payment.value?.toFixed(2) || '0.00'}`,
            metadata: { payment_id: payment.id },
          });
        }
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

      // Check if it's an Academy subscription
      const { data: academySub } = await supabaseClient
        .from("academy_subscriptions")
        .select("*")
        .eq("asaas_subscription_id", subscription.id)
        .maybeSingle();

      if (academySub) {
        if (subscription.status === "ACTIVE") {
          await supabaseClient
            .from("academy_subscriptions")
            .update({ status: "active", updated_at: new Date().toISOString() })
            .eq("id", academySub.id);
          logStep("Academy subscription confirmed active", { subId: academySub.id });
        }
      } else {
        // Business subscription
        const { data: localSub } = await supabaseClient
          .from("user_subscriptions")
          .select("*")
          .eq("external_subscription_id", subscription.id)
          .maybeSingle();

        if (localSub && subscription.status === "ACTIVE") {
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

          // Assign business_owner and subscriber roles (idempotent)
          const { data: existingOwnerRole } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', localSub.user_id)
            .eq('role', 'business_owner')
            .maybeSingle();

          if (!existingOwnerRole) {
            const { error: ownerInsertError } = await supabaseClient
              .from('user_roles')
              .insert({ user_id: localSub.user_id, role: 'business_owner' });
            if (ownerInsertError) logStep("Failed to assign role business_owner", { userId: localSub.user_id, error: String(ownerInsertError) });
            else logStep("Role business_owner assigned", { userId: localSub.user_id });
          } else {
            logStep("Role business_owner already exists — skipping", { userId: localSub.user_id });
          }

          const { data: existingSubRole } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', localSub.user_id)
            .eq('role', 'subscriber')
            .maybeSingle();

          if (!existingSubRole) {
            const { error: subInsertError } = await supabaseClient
              .from('user_roles')
              .insert({ user_id: localSub.user_id, role: 'subscriber' });
            if (subInsertError) logStep("Failed to assign role subscriber", { userId: localSub.user_id, error: String(subInsertError) });
            else logStep("Role subscriber assigned", { userId: localSub.user_id });
          } else {
            logStep("Role subscriber already exists — skipping", { userId: localSub.user_id });
          }

          logStep("Subscription activated", { subscriptionId: localSub.id });
        }
      }
    }

    // Academy subscription cancellation
    else if (webhookData.event === "SUBSCRIPTION_DELETED" || 
             webhookData.event === "SUBSCRIPTION_EXPIRED") {
      const subscription = webhookData.subscription;
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

          // CRM interaction
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

            const { error: subUpdateError } = await supabaseClient
              .from("user_subscriptions")
              .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("id", businessSub.id);
            if (subUpdateError) logStep("Failed to update business subscription status", { error: subUpdateError });
            else logStep("Business subscription cancelled/expired", { subId: businessSub.id, status: newStatus });

            // Deactivate non-complimentary businesses
            const { data: deactivated, error: bizUpdateError } = await supabaseClient
              .from("businesses")
              .update({
                subscription_active: false,
                updated_at: new Date().toISOString(),
              })
              .eq("owner_id", businessSub.user_id)
              .eq("is_complimentary", false)
              .select("id, name");
            if (bizUpdateError) logStep("Failed to deactivate businesses", { error: bizUpdateError });
            else logStep("Business profiles deactivated", { count: deactivated?.length || 0 });

            // Revoke roles only if no active paid businesses remain (handles multi-business plans;
            // complimentary businesses do not count as active paid subscriptions)
            const { data: remaining, error: remainingError } = await supabaseClient
              .from("businesses")
              .select("id")
              .eq("owner_id", businessSub.user_id)
              .eq("subscription_active", true)
              .eq("is_complimentary", false)
              .limit(1);

            if (remainingError) {
              logStep("Could not check remaining businesses — roles NOT revoked (safe default)", {
                userId: businessSub.user_id,
                error: remainingError,
              });
            } else if (!remaining || remaining.length === 0) {
              const { error: roleDeleteError } = await supabaseClient
                .from("user_roles")
                .delete()
                .eq("user_id", businessSub.user_id)
                .in("role", ["business_owner", "subscriber"]);
              if (roleDeleteError) {
                logStep("Failed to revoke roles", { userId: businessSub.user_id, error: roleDeleteError });
              } else {
                logStep("Roles revoked — no active businesses remain", { userId: businessSub.user_id });
              }
            } else {
              logStep("Roles retained — user still has active businesses", { userId: businessSub.user_id });
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
      }
    }

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