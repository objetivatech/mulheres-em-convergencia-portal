import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateSubscriptionRequest {
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly' | '6-monthly';
}

// ✅ SEGURANÇA: Schema de validação Zod
const customerSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido").max(255, "Email muito longo"),
  cpfCnpj: z.string().regex(/^\d{11}$|^\d{14}$/, "CPF/CNPJ inválido").optional(),
  phone: z.string().regex(/^\d{10,11}$/, "Telefone inválido"),
  address: z.string().trim().min(5, "Endereço muito curto").max(200, "Endereço muito longo"),
  addressNumber: z.string().max(10, "Número muito longo"),
  complement: z.string().max(100).optional(),
  neighborhood: z.string().max(100).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().length(2, "Estado deve ter 2 caracteres"),
  postalCode: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  province: z.string().trim().max(100).optional()
});

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client with service role key for database operations
    const supabaseServiceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Create regular client for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Optional authentication - function works with or without logged-in user
    const authHeader = req.headers.get("Authorization");
    let user = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data, error: authError } = await supabaseClient.auth.getUser(token);
        
        if (!authError && data.user?.email) {
          user = data.user;
          logStep("User authenticated", { userId: user.id, email: user.email });
        }
      } catch (error) {
        logStep("Authentication failed, continuing without user", { error });
      }
    }
    
    logStep("Processing request", { hasUser: !!user, userEmail: user?.email });

    const body = await req.json();
    const { plan_id, billing_cycle } = body as CreateSubscriptionRequest & { payment_method?: 'PIX' | 'BOLETO' | 'CREDIT_CARD'; customer?: any };
    const payment_method: 'PIX' | 'BOLETO' | 'CREDIT_CARD' = body.payment_method ?? 'PIX';
    const customerInput = body.customer ?? null;
    
    // ✅ SEGURANÇA: Validar dados do cliente com Zod
    if (customerInput) {
      try {
        const validatedCustomer = customerSchema.parse(customerInput);
        // Substituir customerInput pelos dados validados e sanitizados
        Object.assign(customerInput, validatedCustomer);
        logStep("Customer data validated successfully");
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
          logStep("Validation error", { errors: errorMessages });
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Dados inválidos: ${errorMessages}` 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        throw error;
      }
    }
    
    logStep("Request data received", { plan_id, billing_cycle, payment_method, customerProvided: !!customerInput });

    // Get user profile if user is authenticated
    let profile = null;
    if (user) {
      const { data: profileData, error: profileError } = await supabaseServiceClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        logStep("Profile error", { error: profileError });
        throw new Error("Erro ao verificar perfil do usuário.");
      }
      profile = profileData;
    }

    logStep("Profile loaded for validation", { 
      profileId: profile?.id || 'not found', 
      hasName: !!profile?.full_name,
      hasCpf: !!profile?.cpf,
      hasPhone: !!profile?.phone 
    });

    // Smart validation: check both customerInput and profile data
    const getName = () => customerInput?.name || profile?.full_name;
    const getCpfCnpj = () => customerInput?.cpfCnpj || profile?.cpf;
    const getPhone = () => customerInput?.phone || profile?.phone;
    const getCity = () => customerInput?.city || profile?.city;
    const getState = () => customerInput?.state || profile?.state;
    const getEmail = () => customerInput?.email || user?.email;

    // Only validate required fields that are missing from BOTH sources
    const missing: string[] = [];
    if (!getName()) missing.push('name');
    if (!getEmail()) missing.push('email');
    if (!getCpfCnpj() && (payment_method === 'PIX' || payment_method === 'BOLETO')) missing.push('cpfCnpj');
    if (!getPhone()) missing.push('phone');
    if (!customerInput?.postalCode) missing.push('postalCode');
    if (!customerInput?.address) missing.push('address');
    if (!customerInput?.addressNumber) missing.push('addressNumber');
    if (!customerInput?.province) missing.push('province');
    if (!getCity()) missing.push('city');
    if (!getState()) missing.push('state');

    if (missing.length > 0) {
      logStep('Missing required customer data after checking profile', { fields: missing });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Dados obrigatórios não informados: ${missing.join(', ')}. Complete seu perfil ou forneça os dados no formulário.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get plan details using service client
    const { data: plan, error: planError } = await supabaseServiceClient
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      logStep("Plan not found", { plan_id, error: planError });
      throw new Error("Plano não encontrado");
    }

    logStep("Plan found", { planName: plan.display_name, planId: plan.id });

    // Calculate price based on billing cycle
    let price;
    if (billing_cycle === 'yearly') {
      price = plan.price_yearly;
    } else if (billing_cycle === '6-monthly') {
      price = plan.price_6monthly;
    } else {
      price = plan.price_monthly;
    }
    logStep("Price calculated", { price, billing_cycle });
    
    // ASAAS Integration: First, check if customer exists or create one
    logStep("Checking ASAAS customer");
    
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    if (!asaasApiKey) {
      throw new Error('ASAAS API key not configured');
    }

    // Helper to call ASAAS API with automatic environment fallback
    const asaasBases = ['https://www.asaas.com/api/v3', 'https://sandbox.asaas.com/api/v3'];
    const asaasFetch = async (path: string, init: RequestInit = {}) => {
      for (let i = 0; i < asaasBases.length; i++) {
        const base = asaasBases[i];
        try {
          const res = await fetch(`${base}${path}`, {
            ...init,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'access_token': asaasApiKey,
              ...(init.headers || {})
            },
          });
          
          if (res.ok) {
            logStep('ASAAS request successful', { base, status: res.status });
            return { res, base };
          }

          // Try to get error details
          const resClone = res.clone();
          const contentType = res.headers.get('content-type');
          let errorData: any = null;
          let errorText = '';
          
          try {
            if (contentType?.includes('application/json')) {
              errorData = await resClone.json();
              errorText = JSON.stringify(errorData);
            } else {
              errorText = await resClone.text();
            }
          } catch (e) {
            errorText = 'Could not parse error response';
          }

          logStep('ASAAS request failed', { 
            base, 
            status: res.status, 
            error: errorText.slice(0, 300),
            hasJson: !!errorData
          });

          // If we have ASAAS errors in JSON format, return them properly
          if (errorData?.errors && i === asaasBases.length - 1) {
            return { res, base, asaasErrors: errorData.errors };
          }

          // If first base fails with 404 or other non-JSON, try sandbox
          if (i === 0 && (res.status === 404 || !contentType?.includes('application/json'))) {
            logStep('Trying sandbox environment due to API error', { 
              status: res.status, 
              contentType: contentType 
            });
            continue;
          }

          // If we're on the last attempt, return the response anyway
          if (i === asaasBases.length - 1) {
            return { res, base, asaasErrors: errorData?.errors };
          }
        } catch (fetchError) {
          logStep('ASAAS fetch error', { base, error: fetchError.message });
          if (i === asaasBases.length - 1) throw fetchError;
        }
      }
      throw new Error('ASAAS request failed for all environments');
    };

    // Check if customer exists in ASAAS
    const customerEmail = getEmail();
    if (!customerEmail) {
      throw new Error('Email é obrigatório para processar a assinatura');
    }
    
    const { res: customerCheckResponse, base: asaasBase } = await asaasFetch(`/customers?email=${encodeURIComponent(customerEmail)}`, {
      method: 'GET'
    });

    let customerId;
    
    if (customerCheckResponse.ok) {
      const customerData = await customerCheckResponse.json();
      if (customerData.data && customerData.data.length > 0) {
        customerId = customerData.data[0].id;
        logStep("Existing ASAAS customer found", { customerId });
      }
    }

    // If no customer found, create one
    if (!customerId) {
      logStep("Creating new ASAAS customer");
      const customerPayload: any = {
        name: getName(),
        email: customerEmail,
        cpfCnpj: getCpfCnpj(),
        phone: getPhone(),
        postalCode: customerInput?.postalCode,
        address: customerInput?.address,
        addressNumber: customerInput?.addressNumber,
        complement: customerInput?.complement,
        province: customerInput?.province,
        city: getCity(),
        state: getState(),
      };

      const { res: createCustomerResponse, asaasErrors } = await asaasFetch('/customers', {
        method: 'POST',
        body: JSON.stringify(customerPayload),
      });

      if (!createCustomerResponse.ok) {
        logStep("Failed to create ASAAS customer", { status: createCustomerResponse.status, errors: asaasErrors });
        
        if (asaasErrors && asaasErrors.length > 0) {
          const errorMessages = asaasErrors.map((err: any) => err.description || err.message || 'Erro desconhecido');
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: errorMessages.join('; '),
              asaas_errors: asaasErrors
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        throw new Error('Erro ao criar cliente no sistema de pagamento');
      }

      const newCustomer = await createCustomerResponse.json();
      customerId = newCustomer.id;
      logStep("New ASAAS customer created", { customerId });
    }

    // Create ASAAS subscription (not single payment) for recurring billing
    logStep("Creating ASAAS subscription", { customerId, price, payment_method, billing_cycle });
    
    // Calculate the subscription cycle and next due date
    const cycleMapping = {
      'monthly': 'MONTHLY',
      'yearly': 'YEARLY',
      '6-monthly': 'MONTHLY' // ASAAS doesn't support 6-monthly directly, so we use monthly
    };

    // For 6-monthly, we need to calculate the billing period differently
    const getNextDueDate = () => {
      const now = Date.now();
      if (billing_cycle === '6-monthly') {
        return new Date(now + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 6 months
      }
      return new Date(now + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Tomorrow
    };

    const getBillingDescription = () => {
      switch(billing_cycle) {
        case 'yearly': return 'Anual';
        case '6-monthly': return 'Semestral';
        default: return 'Mensal';
      }
    };
    
    const subscriptionPayload: any = {
      customer: customerId,
      billingType: payment_method,
      value: price,
      nextDueDate: getNextDueDate(),
      description: `Assinatura ${plan.display_name} - ${getBillingDescription()}`,
      cycle: cycleMapping[billing_cycle] || 'MONTHLY',
      externalReference: `subscription_${plan_id}_${user?.id || 'guest'}`,
      callback: {
        successUrl: `${req.headers.get("origin") || ''}/planos?payment=success`,
        autoRedirect: false
      }
    };

    // Try to create subscription first, fallback to single payment if needed
    let asaasData;
    let isRecurringSubscription = true;
    let usedAsaasBase;

    try {
      const subscriptionResult = await asaasFetch('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionPayload),
      });

      if (subscriptionResult.res.ok) {
        asaasData = await subscriptionResult.res.json();
        usedAsaasBase = subscriptionResult.base;
        logStep("ASAAS subscription created successfully", { 
          subscriptionId: asaasData.id, 
          environment: usedAsaasBase,
          cycle: subscriptionPayload.cycle
        });
      } else {
        throw new Error('Subscription creation failed, will try single payment');
      }
    } catch (subscriptionError) {
      logStep("Subscription creation failed, falling back to single payment", { error: subscriptionError.message });
      isRecurringSubscription = false;

      // Fallback to single payment
      const paymentPayload: any = {
        customer: customerId,
        billingType: payment_method,
        value: price,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Pagamento ${plan.display_name} - ${billing_cycle === 'yearly' ? 'Anual' : 'Mensal'}`,
        externalReference: `payment_${plan_id}_${user?.id || 'guest'}`,
        callback: {
          successUrl: `${req.headers.get("origin") || ''}/planos?payment=success`,
          autoRedirect: false
        }
      };

      const { res: asaasResponse, base: paymentAsaasBase, asaasErrors: paymentErrors } = await asaasFetch('/payments', {
        method: 'POST',
        body: JSON.stringify(paymentPayload),
      });

      if (!asaasResponse.ok) {
        logStep("ASAAS payment creation failed", { status: asaasResponse.status, errors: paymentErrors });
        
        if (paymentErrors && paymentErrors.length > 0) {
          const errorMessages = paymentErrors.map((err: any) => err.description || err.message || 'Erro desconhecido');
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: errorMessages.join('; '),
              asaas_errors: paymentErrors
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        throw new Error('Erro ao processar pagamento');
      }

      asaasData = await asaasResponse.json();
      usedAsaasBase = paymentAsaasBase;
      logStep("ASAAS single payment created as fallback", { 
        paymentId: asaasData.id, 
        invoiceUrl: asaasData.invoiceUrl, 
        environment: usedAsaasBase 
      });
    }

    // Create pending subscription record using service client (bypasses RLS)
    // Only create if user is authenticated - for guests, they'll need to complete signup first
    if (user) {
      const subscriptionData = {
        user_id: user.id,
        plan_id: plan_id,
        billing_cycle: billing_cycle,
        status: 'pending',
        external_subscription_id: asaasData.id, // This could be subscription ID or payment ID
        payment_provider: 'asaas',
        expires_at: billing_cycle === 'yearly' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : billing_cycle === '6-monthly'
            ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() // 6 months
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { error: subscriptionError } = await supabaseServiceClient
        .from('user_subscriptions')
        .insert(subscriptionData);

      if (subscriptionError) {
        logStep("Subscription creation failed", { error: subscriptionError });
        throw new Error('Erro ao criar assinatura');
      }
      
      logStep("Subscription created successfully", { 
        userId: user.id, 
        planId: plan_id,
        isRecurring: isRecurringSubscription,
        externalId: asaasData.id
      });
    } else {
      logStep("Guest transaction created - subscription will be created on signup", { 
        externalId: asaasData.id,
        isRecurring: isRecurringSubscription
      });
    }

    // Get the correct checkout URL - CRITICAL FIX
    let checkoutUrl = asaasData.invoiceUrl || asaasData.url;
    
    // For recurring subscriptions, we need to get the PENDING payment URL
    if (!checkoutUrl && isRecurringSubscription) {
      try {
        logStep("Fetching PENDING payment for subscription", { subscriptionId: asaasData.id });
        
        // Try to get PENDING payments for this subscription
        const paymentsResponse = await asaasFetch(`/payments?subscription=${asaasData.id}&status=PENDING&limit=1&offset=0`, {
          method: 'GET'
        });

        if (paymentsResponse.res.ok) {
          const paymentsData = await paymentsResponse.res.json();
          if (paymentsData.data && paymentsData.data.length > 0) {
            const pendingPayment = paymentsData.data[0];
            checkoutUrl = pendingPayment.invoiceUrl || pendingPayment.bankSlipUrl;
            logStep("Found PENDING payment for subscription", { 
              paymentId: pendingPayment.id, 
              invoiceUrl: checkoutUrl 
            });
          }
        } else {
          logStep("Failed to fetch subscription payments, trying alternative endpoint");
          
          // Fallback: try alternative endpoint
          const altPaymentsResponse = await asaasFetch(`/subscriptions/${asaasData.id}/payments?status=PENDING&limit=1&offset=0`, {
            method: 'GET'
          });

          if (altPaymentsResponse.res.ok) {
            const altPaymentsData = await altPaymentsResponse.res.json();
            if (altPaymentsData.data && altPaymentsData.data.length > 0) {
              const pendingPayment = altPaymentsData.data[0];
              checkoutUrl = pendingPayment.invoiceUrl || pendingPayment.bankSlipUrl;
              logStep("Found PENDING payment via alternative endpoint", { 
                paymentId: pendingPayment.id, 
                invoiceUrl: checkoutUrl 
              });
            }
          }
        }
      } catch (error) {
        logStep("Error fetching subscription payments", error);
      }
    }
    
    // For single payments, try to fetch payment details if no URL
    if (!checkoutUrl && !isRecurringSubscription) {
      try {
        const { res: paymentResponse } = await asaasFetch(`/payments/${asaasData.id}`, {
          method: 'GET'
        });

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          checkoutUrl = paymentData.invoiceUrl || paymentData.bankSlipUrl;
          logStep("Payment details fetched", { paymentUrl: checkoutUrl });
        }
      } catch (error) {
        logStep("Error fetching single payment details", error);
      }
    }

    // Final validation - never return /c/sub_ URLs
    if (!checkoutUrl || checkoutUrl.includes('/c/sub_')) {
      const errorMsg = 'Não foi possível gerar link de pagamento. Verifique o email enviado pelo ASAAS ou entre em contato conosco.';
      logStep("CRITICAL: No valid checkout URL found", { 
        originalUrl: checkoutUrl, 
        subscriptionId: asaasData.id,
        isRecurring: isRecurringSubscription
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMsg
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Log user activity if authenticated
    if (user) {
      await supabaseServiceClient.rpc('log_user_activity', {
        p_user_id: user.id,
        p_activity_type: 'subscription_created',
        p_description: `Assinatura do plano ${plan.display_name} (${billing_cycle})`,
        p_metadata: {
          plan_id: plan_id,
          plan_name: plan.display_name,
          billing_cycle: billing_cycle,
          amount: price,
          payment_id: asaasData.id,
          subscription_type: isRecurringSubscription ? 'recurring' : 'single'
        }
      });

      // Persist customer data server-side (profile, address, contacts)
      try {
        // Update profile with customer data
        if (getName() || getCpfCnpj() || getPhone()) {
          const { error: profileError } = await supabaseServiceClient
            .from('profiles')
            .update({
              full_name: getName() || undefined,
              cpf: getCpfCnpj() || undefined,
              phone: getPhone() || undefined,
              city: getCity() || undefined,
              state: getState() || undefined,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (!profileError) {
            await supabaseServiceClient.rpc('log_user_activity', {
              p_user_id: user.id,
              p_activity_type: 'profile_updated',
              p_description: 'Perfil atualizado durante assinatura',
              p_metadata: { source: 'subscription', plan_id: plan_id }
            });
            logStep("Profile updated server-side", { userId: user.id });
          }
        }

        // Save billing address
        if (customerInput?.address && getCity() && getState()) {
          const addressData = {
            user_id: user.id,
            address_type: 'billing',
            street: customerInput.address,
            number: customerInput.addressNumber || '',
            complement: customerInput.complement || null,
            neighborhood: customerInput.province || null,
            city: getCity(),
            state: getState(),
            postal_code: customerInput.postalCode || null,
            country: 'Brasil',
            is_primary: true
          };

          const { error: addressError } = await supabaseServiceClient
            .from('user_addresses')
            .insert(addressData);

          if (!addressError) {
            await supabaseServiceClient.rpc('log_user_activity', {
              p_user_id: user.id,
              p_activity_type: 'address_added',
              p_description: 'Endereço de cobrança adicionado durante assinatura',
              p_metadata: { address_type: 'billing', source: 'subscription' }
            });
            logStep("Billing address added server-side", { userId: user.id });
          }
        }

        // Save phone contact
        if (getPhone()) {
          const contactData = {
            user_id: user.id,
            contact_type: 'phone',
            contact_value: getPhone(),
            is_primary: true,
            verified: false
          };

          const { error: contactError } = await supabaseServiceClient
            .from('user_contacts')
            .insert(contactData);

          if (!contactError) {
            await supabaseServiceClient.rpc('log_user_activity', {
              p_user_id: user.id,
              p_activity_type: 'contact_added',
              p_description: 'Contato telefônico adicionado durante assinatura',
              p_metadata: { contact_type: 'phone', source: 'subscription' }
            });
            logStep("Phone contact added server-side", { userId: user.id });
          }
        }

        logStep("Customer data persisted server-side successfully", { userId: user.id });
      } catch (persistError) {
        logStep("Error persisting customer data server-side", { 
          error: persistError.message,
          userId: user.id 
        });
        // Continue anyway - don't fail the subscription for data persistence errors
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: checkoutUrl,
        payment_id: asaasData.id,
        subscription_type: isRecurringSubscription ? 'recurring' : 'single',
        environment: usedAsaasBase?.includes('sandbox') ? 'sandbox' : 'production'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Error in create-subscription function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        success: false 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});