import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PRODUCT-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Product payment request received");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { product_id, product_name, product_price, product_description, customer_data, payment_method = "PIX" } = await req.json();

    if (!product_id || !product_name || !product_price || !customer_data) {
      throw new Error("product_id, product_name, product_price and customer_data are required");
    }

    logStep("Processing product payment", { product_id, email: customer_data.email, price: product_price });

    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    if (!asaasApiKey) {
      throw new Error("ASAAS_API_KEY not configured");
    }

    const asaasBase = asaasApiKey.startsWith("$aact_") 
      ? "https://api.asaas.com/v3" 
      : "https://sandbox.asaas.com/api/v3";

    const customerEmail = customer_data.email;
    const customerName = customer_data.full_name;
    const customerCpf = customer_data.cpf?.replace(/\D/g, '');
    const customerPhone = customer_data.phone?.replace(/\D/g, '');

    // Check if customer exists
    const customerCheckResponse = await fetch(
      `${asaasBase}/customers?email=${encodeURIComponent(customerEmail)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
      }
    );

    let customerId: string;

    if (customerCheckResponse.ok) {
      const customerData = await customerCheckResponse.json();
      if (customerData.data && customerData.data.length > 0) {
        customerId = customerData.data[0].id;
        logStep("Existing customer found", { customerId });
      } else {
        const createCustomerResponse = await fetch(`${asaasBase}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
          body: JSON.stringify({
            name: customerName,
            email: customerEmail,
            cpfCnpj: customerCpf || undefined,
            phone: customerPhone || undefined,
          }),
        });

        if (!createCustomerResponse.ok) {
          const errorData = await createCustomerResponse.json();
          throw new Error(`Failed to create customer: ${JSON.stringify(errorData)}`);
        }

        const newCustomer = await createCustomerResponse.json();
        customerId = newCustomer.id;
        logStep("New customer created", { customerId });
      }
    } else {
      throw new Error("Failed to check existing customer");
    }

    // Create payment
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const paymentPayload = {
      customer: customerId,
      billingType: "UNDEFINED",
      value: product_price,
      dueDate: dueDate.toISOString().split('T')[0],
      description: product_description || product_name,
      externalReference: `product_${product_id}_${Date.now()}`,
    };

    logStep("Creating payment", paymentPayload);

    const paymentResponse = await fetch(`${asaasBase}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
      body: JSON.stringify(paymentPayload),
    });

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json();
      throw new Error(`Failed to create payment: ${JSON.stringify(errorData)}`);
    }

    const paymentData = await paymentResponse.json();
    logStep("Payment created successfully", { paymentId: paymentData.id });

    // Create CRM Lead
    try {
      await supabaseClient.from('crm_leads').upsert({
        email: customerEmail,
        full_name: customerName,
        phone: customerPhone,
        cpf: customerCpf,
        source: 'landing_page',
        source_detail: product_name,
        status: 'new',
      }, { onConflict: 'email' });

      await supabaseClient.from('crm_interactions').insert({
        lead_id: null,
        email: customerEmail,
        cpf: customerCpf,
        interaction_type: 'product_purchase_started',
        description: `Iniciou compra: ${product_name}`,
        activity_name: product_name,
        activity_paid: true,
      });
      logStep("CRM integration completed");
    } catch (crmError) {
      logStep("CRM integration failed (non-blocking)", crmError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentData.id,
        checkout_url: paymentData.invoiceUrl,
        bankSlipUrl: paymentData.bankSlipUrl,
        pixQrCodeUrl: paymentData.pixQrCodeUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    logStep("Error occurred", { message: error.message });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
