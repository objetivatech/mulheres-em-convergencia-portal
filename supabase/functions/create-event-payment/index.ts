import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-EVENT-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Event payment request received");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { event_id, registration_data, payment_method = "PIX" } = await req.json();

    if (!event_id || !registration_data) {
      throw new Error("event_id and registration_data are required");
    }

    logStep("Processing event payment", { event_id, email: registration_data.email });

    // Fetch event details
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found");
    }

    if (event.free || !event.price || event.price <= 0) {
      throw new Error("This event is free - no payment required");
    }

    logStep("Event found", { title: event.title, price: event.price });

    // Get Asaas API key
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    if (!asaasApiKey) {
      throw new Error("ASAAS_API_KEY not configured");
    }

    const asaasBase = asaasApiKey.startsWith("$aact_") 
      ? "https://api.asaas.com/v3" 
      : "https://sandbox.asaas.com/api/v3";

    // Create or find customer in Asaas
    const customerEmail = registration_data.email;
    const customerName = registration_data.full_name;
    const customerCpf = registration_data.cpf?.replace(/\D/g, '');
    const customerPhone = registration_data.phone?.replace(/\D/g, '');

    // Check if customer exists
    const customerCheckResponse = await fetch(
      `${asaasBase}/customers?email=${encodeURIComponent(customerEmail)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        },
      }
    );

    let customerId: string;

    if (customerCheckResponse.ok) {
      const customerData = await customerCheckResponse.json();
      if (customerData.data && customerData.data.length > 0) {
        customerId = customerData.data[0].id;
        logStep("Existing customer found", { customerId });
      } else {
        // Create new customer
        const createCustomerResponse = await fetch(`${asaasBase}/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': asaasApiKey,
          },
          body: JSON.stringify({
            name: customerName,
            email: customerEmail,
            cpfCnpj: customerCpf || undefined,
            phone: customerPhone || undefined,
          }),
        });

        if (!createCustomerResponse.ok) {
          const errorData = await createCustomerResponse.json();
          logStep("Failed to create customer", errorData);
          throw new Error("Failed to create customer in payment system");
        }

        const newCustomer = await createCustomerResponse.json();
        customerId = newCustomer.id;
        logStep("New customer created", { customerId });
      }
    } else {
      throw new Error("Failed to check existing customer");
    }

    // Create pending registration first
    const { data: registration, error: regError } = await supabaseClient
      .from('event_registrations')
      .insert({
        event_id: event_id,
        full_name: registration_data.full_name,
        email: registration_data.email,
        phone: registration_data.phone || null,
        cpf: customerCpf || null,
        status: 'pending',
        paid: false,
        payment_amount: event.price,
        metadata: registration_data.custom_fields || {},
      })
      .select()
      .single();

    if (regError) {
      logStep("Failed to create registration", regError);
      throw new Error("Failed to create registration");
    }

    logStep("Registration created", { registrationId: registration.id });

    // Create payment in Asaas
    const paymentPayload = {
      customer: customerId,
      // Use UNDEFINED to allow all payment methods (PIX, Boleto, Credit Card) in ASAAS checkout
      billingType: "UNDEFINED",
      value: event.price,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
      description: `Inscrição: ${event.title}`,
      externalReference: `event_registration_${registration.id}`,
      callback: {
        successUrl: `${req.headers.get("origin") || ''}/eventos/confirmacao?registration=${registration.id}`,
        autoRedirect: true
      }
    };

    const paymentResponse = await fetch(`${asaasBase}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify(paymentPayload),
    });

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json();
      logStep("Failed to create payment", errorData);
      
      // Rollback registration
      await supabaseClient.from('event_registrations').delete().eq('id', registration.id);
      
      throw new Error("Failed to create payment");
    }

    const paymentData = await paymentResponse.json();
    logStep("Payment created", { paymentId: paymentData.id, invoiceUrl: paymentData.invoiceUrl });

    // Update registration with payment info
    await supabaseClient
      .from('event_registrations')
      .update({
        payment_id: paymentData.id,
      })
      .eq('id', registration.id);

    // Create CRM lead if CPF provided
    if (customerCpf) {
      const { data: existingLead } = await supabaseClient
        .from('crm_leads')
        .select('id')
        .eq('cpf', customerCpf)
        .maybeSingle();

      let leadId: string | null = existingLead?.id || null;

      if (!existingLead) {
        const { data: newLead } = await supabaseClient
          .from('crm_leads')
          .insert({
            full_name: customerName,
            email: customerEmail,
            phone: customerPhone,
            cpf: customerCpf,
            source: 'evento',
            source_detail: event.title,
            status: 'new',
            first_activity_type: 'event_registration',
            first_activity_date: new Date().toISOString(),
            cost_center_id: event.cost_center_id,
          })
          .select()
          .single();

        leadId = newLead?.id || null;
        logStep("Lead created", { leadId });
      }

      // Update registration with lead_id
      if (leadId) {
        await supabaseClient
          .from('event_registrations')
          .update({ lead_id: leadId })
          .eq('id', registration.id);

        // Create interaction
        await supabaseClient
          .from('crm_interactions')
          .insert({
            lead_id: leadId,
            cpf: customerCpf,
            interaction_type: 'event_registration',
            activity_name: event.title,
            activity_paid: !event.free,
            description: `Inscrição em evento: ${event.title}`,
            cost_center_id: event.cost_center_id,
            form_source: 'public_event_page',
          });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        registration_id: registration.id,
        payment_id: paymentData.id,
        checkout_url: paymentData.invoiceUrl,
        bankSlipUrl: paymentData.bankSlipUrl,
        pixQrCodeUrl: paymentData.pixQrCodeUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
