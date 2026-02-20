import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-ACADEMY-SUB] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Não autenticado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Autenticação inválida" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    const customer = body.customer;

    if (!customer?.name || !customer?.email || !customer?.cpfCnpj || !customer?.phone) {
      return new Response(JSON.stringify({ success: false, error: "Dados do cliente incompletos" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check existing active subscription
    const { data: existingSub } = await supabaseService
      .from("academy_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (existingSub) {
      return new Response(JSON.stringify({ success: false, error: "Você já possui uma assinatura ativa" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // ASAAS integration
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    if (!asaasApiKey) throw new Error("ASAAS_API_KEY not configured");

    const asaasBase = "https://www.asaas.com/api/v3";
    const asaasHeaders = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "access_token": asaasApiKey,
    };

    // Find or create Asaas customer
    let customerId: string | null = null;

    const searchRes = await fetch(`${asaasBase}/customers?cpfCnpj=${customer.cpfCnpj}`, {
      headers: asaasHeaders,
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.data?.length > 0) {
        customerId = searchData.data[0].id;
        logStep("Existing customer found", { customerId });
      }
    }

    if (!customerId) {
      const createRes = await fetch(`${asaasBase}/customers`, {
        method: "POST",
        headers: asaasHeaders,
        body: JSON.stringify({
          name: customer.name,
          email: customer.email,
          cpfCnpj: customer.cpfCnpj,
          phone: customer.phone,
          postalCode: customer.postalCode,
          address: customer.address,
          addressNumber: customer.addressNumber,
          province: customer.province,
          city: customer.city,
          state: customer.state,
        }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}));
        logStep("Failed to create customer", { error: errData });
        throw new Error("Erro ao criar cliente no Asaas");
      }

      const newCustomer = await createRes.json();
      customerId = newCustomer.id;
      logStep("Customer created", { customerId });
    }

    // Create subscription
    const nextDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const subRes = await fetch(`${asaasBase}/subscriptions`, {
      method: "POST",
      headers: asaasHeaders,
      body: JSON.stringify({
        customer: customerId,
        billingType: "UNDEFINED",
        value: 29.90,
        nextDueDate,
        description: "MeC Academy - Assinatura Mensal",
        cycle: "MONTHLY",
        externalReference: `academy_${user.id}`,
        callback: {
          successUrl: `${req.headers.get("origin") || ""}/academy/catalogo?payment=success`,
          autoRedirect: false,
        },
      }),
    });

    if (!subRes.ok) {
      const errData = await subRes.json().catch(() => ({}));
      logStep("Failed to create subscription", { error: errData });
      throw new Error("Erro ao criar assinatura no Asaas");
    }

    const asaasSub = await subRes.json();
    logStep("Asaas subscription created", { subscriptionId: asaasSub.id });

    // Save to database
    await supabaseService.from("academy_subscriptions").insert({
      user_id: user.id,
      status: "pending",
      asaas_subscription_id: asaasSub.id,
      asaas_customer_id: customerId,
      billing_cycle: "monthly",
      price: 29.90,
      started_at: new Date().toISOString(),
    });

    // NOTE: Student role is NOT granted here. It will be granted by the webhook
    // only after payment is confirmed (PAYMENT_RECEIVED/PAYMENT_CONFIRMED).

    // CRM integration
    try {
      // Create/find lead
      const { data: profile } = await supabaseService
        .from("profiles")
        .select("full_name, cpf, phone")
        .eq("id", user.id)
        .single();

      const { data: existingLead } = await supabaseService
        .from("crm_leads")
        .select("id")
        .eq("email", customer.email)
        .maybeSingle();

      let leadId = existingLead?.id;

      if (!leadId) {
        const { data: newLead } = await supabaseService
          .from("crm_leads")
          .insert({
            full_name: customer.name,
            email: customer.email,
            phone: customer.phone,
            cpf: customer.cpfCnpj,
            source: "academy",
            source_detail: "assinatura_paga",
            status: "qualified",
          })
          .select("id")
          .single();
        leadId = newLead?.id;
      }

      if (leadId) {
        // Create interaction
        await supabaseService.from("crm_interactions").insert({
          lead_id: leadId,
          interaction_type: "academy_subscription",
          channel: "website",
          description: "Assinatura MeC Academy - R$29,90/mês",
          activity_paid: true,
          metadata: { subscription_id: asaasSub.id, value: 29.90 },
        });

        // Create deal in planos pipeline
        const { data: pipeline } = await supabaseService
          .from("crm_pipelines")
          .select("id, stages")
          .eq("pipeline_type", "planos")
          .eq("active", true)
          .maybeSingle();

        if (pipeline) {
          await supabaseService.from("crm_deals").insert({
            title: `${customer.name} - MeC Academy`,
            value: 29.90,
            pipeline_id: pipeline.id,
            stage: "interesse",
            lead_id: leadId,
            product_type: "academy",
          });
        }
      }
    } catch (crmError) {
      logStep("CRM integration error (non-blocking)", { error: crmError });
    }

    // Get payment URL
    let paymentUrl = asaasSub.invoiceUrl || "";
    if (!paymentUrl && asaasSub.id) {
      const paymentsRes = await fetch(`${asaasBase}/subscriptions/${asaasSub.id}/payments`, {
        headers: asaasHeaders,
      });
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        if (paymentsData.data?.length > 0) {
          paymentUrl = paymentsData.data[0].invoiceUrl || paymentsData.data[0].bankSlipUrl || "";
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      subscriptionId: asaasSub.id,
      paymentUrl,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ success: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
