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

    // Check if customer exists in ASAAS
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

    // Create payment in ASAAS
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    // Calculate max installments based on minimum installment value of R$20
    const MIN_INSTALLMENT_VALUE = 20;
    const MAX_INSTALLMENTS = 12;
    const calculatedMaxInstallments = Math.floor(product_price / MIN_INSTALLMENT_VALUE);
    const maxInstallmentCount = Math.min(Math.max(1, calculatedMaxInstallments), MAX_INSTALLMENTS);

    // Create unique reference for this product purchase
    const externalReference = `product_${product_id}_${Date.now()}`;

    const paymentPayload: Record<string, any> = {
      customer: customerId,
      billingType: "UNDEFINED",
      value: product_price,
      dueDate: dueDate.toISOString().split('T')[0],
      description: product_description || product_name,
      externalReference: externalReference,
    };

    // Enable installments for credit card if value allows (minimum R$20 per installment)
    if (maxInstallmentCount > 1) {
      paymentPayload.maxInstallmentCount = maxInstallmentCount;
      logStep("Installments enabled", { maxInstallments: maxInstallmentCount, minInstallmentValue: MIN_INSTALLMENT_VALUE });
    }

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

    // ========================================
    // CRM INTEGRATION - Complete Flow
    // ========================================
    let leadId: string | null = null;
    let userId: string | null = null;
    let dealId: string | null = null;

    try {
      // 1. Check if user exists by email or CPF
      if (customerEmail) {
        const { data: existingProfile } = await supabaseClient
          .from('profiles')
          .select('id, cpf, phone')
          .eq('email', customerEmail)
          .maybeSingle();

        if (existingProfile) {
          userId = existingProfile.id;
          logStep("Found existing user profile", { userId });
          
          // Update profile with new data if provided and missing
          const updates: Record<string, any> = {};
          if (customerCpf && !existingProfile.cpf) {
            updates.cpf = customerCpf;
          }
          if (customerPhone && !existingProfile.phone) {
            updates.phone = customerPhone;
          }
          
          if (Object.keys(updates).length > 0) {
            await supabaseClient
              .from('profiles')
              .update({ ...updates, updated_at: new Date().toISOString() })
              .eq('id', userId);
            logStep("Updated profile with new data", updates);
          }

          // Add new phone to user_contacts if different
          if (customerPhone) {
            const { data: existingContact } = await supabaseClient
              .from('user_contacts')
              .select('id')
              .eq('user_id', userId)
              .eq('contact_type', 'phone')
              .eq('contact_value', customerPhone)
              .maybeSingle();
            
            if (!existingContact) {
              await supabaseClient
                .from('user_contacts')
                .insert({
                  user_id: userId,
                  contact_type: 'phone',
                  contact_value: customerPhone,
                  is_primary: false,
                });
              logStep("Added new phone to user_contacts");
            }
          }
        }
      }

      // 2. Find or create CRM lead
      // First check by CPF (primary identifier)
      if (customerCpf) {
        const { data: existingLeadByCpf } = await supabaseClient
          .from('crm_leads')
          .select('id, email, phone')
          .eq('cpf', customerCpf)
          .maybeSingle();
        
        if (existingLeadByCpf) {
          leadId = existingLeadByCpf.id;
          logStep("Found lead by CPF", { leadId });
          
          // Update lead with any new info
          const leadUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
          if (!existingLeadByCpf.email && customerEmail) leadUpdates.email = customerEmail;
          if (!existingLeadByCpf.phone && customerPhone) leadUpdates.phone = customerPhone;
          
          await supabaseClient.from('crm_leads').update(leadUpdates).eq('id', leadId);
        }
      }

      // If not found by CPF, check by email
      if (!leadId && customerEmail) {
        const { data: existingLeadByEmail } = await supabaseClient
          .from('crm_leads')
          .select('id, cpf, phone')
          .eq('email', customerEmail)
          .maybeSingle();
        
        if (existingLeadByEmail) {
          leadId = existingLeadByEmail.id;
          logStep("Found lead by email", { leadId });
          
          // Update lead with CPF if missing
          const leadUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
          if (!existingLeadByEmail.cpf && customerCpf) leadUpdates.cpf = customerCpf;
          if (!existingLeadByEmail.phone && customerPhone) leadUpdates.phone = customerPhone;
          
          await supabaseClient.from('crm_leads').update(leadUpdates).eq('id', leadId);
        }
      }

      // If no lead found, create new one
      if (!leadId) {
        const { data: newLead, error: leadError } = await supabaseClient
          .from('crm_leads')
          .insert({
            full_name: customerName,
            email: customerEmail,
            phone: customerPhone,
            cpf: customerCpf,
            source: 'landing_page',
            source_detail: product_name,
            status: 'new',
            first_activity_type: 'product_purchase',
            first_activity_date: new Date().toISOString(),
            first_activity_paid: true,
            first_activity_online: false,
            converted_user_id: userId,
          })
          .select('id')
          .single();

        if (leadError) {
          logStep("Error creating lead", leadError);
        } else if (newLead) {
          leadId = newLead.id;
          logStep("Created new CRM lead", { leadId });
        }
      }

      // 3. Create interaction for purchase start
      await supabaseClient.from('crm_interactions').insert({
        lead_id: leadId,
        user_id: userId,
        cpf: customerCpf,
        interaction_type: 'product_purchase_started',
        channel: 'website',
        description: `Iniciou compra: ${product_name} - Valor: R$ ${product_price.toFixed(2)}`,
        activity_name: product_name,
        activity_paid: true,
        activity_online: false,
        form_source: 'landing_page',
        metadata: {
          product_id,
          product_name,
          product_price,
          payment_id: paymentData.id,
          external_reference: externalReference,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        },
      });
      logStep("Created purchase started interaction");

      // 4. Get or create deal in vendas pipeline
      const { data: vendasPipeline } = await supabaseClient
        .from('crm_pipelines')
        .select('id, stages')
        .eq('pipeline_type', 'vendas')
        .eq('active', true)
        .maybeSingle();

      if (vendasPipeline) {
        // Check if deal already exists for this lead and product
        const { data: existingDeal } = await supabaseClient
          .from('crm_deals')
          .select('id')
          .eq('lead_id', leadId)
          .eq('product_id', product_id)
          .eq('won', false)
          .maybeSingle();

        if (existingDeal) {
          dealId = existingDeal.id;
          // Update existing deal
          await supabaseClient
            .from('crm_deals')
            .update({
              stage: 'negotiation',
              value: product_price,
              updated_at: new Date().toISOString(),
              metadata: {
                payment_id: paymentData.id,
                external_reference: externalReference,
                last_updated_reason: 'payment_started',
              },
            })
            .eq('id', dealId);
          logStep("Updated existing deal", { dealId });
        } else {
          // Create new deal
          const { data: newDeal, error: dealError } = await supabaseClient
            .from('crm_deals')
            .insert({
              title: `${product_name} - ${customerName}`,
              value: product_price,
              pipeline_id: vendasPipeline.id,
              stage: 'negotiation',
              lead_id: leadId,
              user_id: userId,
              cpf: customerCpf,
              product_id: product_id,
              product_type: 'landing_page',
              description: `Compra iniciada via LP: ${product_name}`,
              expected_close_date: dueDate.toISOString().split('T')[0],
              metadata: {
                payment_id: paymentData.id,
                external_reference: externalReference,
                checkout_url: paymentData.invoiceUrl,
              },
            })
            .select('id')
            .single();

          if (dealError) {
            logStep("Error creating deal", dealError);
          } else if (newDeal) {
            dealId = newDeal.id;
            logStep("Created new CRM deal", { dealId });
          }
        }
      } else {
        logStep("Vendas pipeline not found - skipping deal creation");
      }

      // 5. Record in donations table if applicable (for tracking financial impact)
      // This is useful for nonprofit reporting
      await supabaseClient.from('donations').insert({
        donor_name: customerName,
        email: customerEmail,
        phone: customerPhone,
        cpf: customerCpf,
        amount: product_price,
        type: 'product_sale',
        status: 'pending',
        payment_id: paymentData.id,
        payment_method: 'undefined',
        campaign: product_name,
        project: 'landing_page',
        metadata: {
          product_id,
          external_reference: externalReference,
          deal_id: dealId,
          lead_id: leadId,
        },
      });
      logStep("Created donation record for financial tracking");

      logStep("CRM integration completed successfully", { leadId, dealId, userId });
    } catch (crmError) {
      logStep("CRM integration failed (non-blocking)", { error: crmError });
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentData.id,
        checkout_url: paymentData.invoiceUrl,
        bankSlipUrl: paymentData.bankSlipUrl,
        pixQrCodeUrl: paymentData.pixQrCodeUrl,
        lead_id: leadId,
        deal_id: dealId,
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