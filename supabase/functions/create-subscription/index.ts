import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateSubscriptionRequest {
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
}

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header missing");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError) {
      logStep("Authentication error", { error: authError });
      throw new Error(`Authentication failed: ${authError.message}`);
    }

    const user = data.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    logStep("User authenticated", { userId: user.id, email: user.email });

    const { plan_id, billing_cycle }: CreateSubscriptionRequest = await req.json();
    logStep("Request data received", { plan_id, billing_cycle });

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

    // Get user profile using service client (bypasses RLS)
    const { data: profile, error: profileError } = await supabaseServiceClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      logStep("Profile error", { error: profileError });
      throw new Error("Erro ao verificar perfil do usuário.");
    }

    if (!profile) {
      logStep("Profile not found - this should not happen after migration", { userId: user.id });
      throw new Error("Perfil do usuário não encontrado. Tente fazer logout e login novamente.");
    }

    logStep("Profile found", { profileId: profile.id, email: profile.email });

    // Calculate price based on billing cycle
    const price = billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    logStep("Price calculated", { price, billing_cycle });
    
    // ASAAS Integration: First, check if customer exists or create one
    logStep("Checking ASAAS customer");
    
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    if (!asaasApiKey) {
      throw new Error('ASAAS API key not configured');
    }

    // Check if customer exists in ASAAS
    const customerCheckResponse = await fetch(`https://sandbox.asaas.com/api/v3/customers?email=${encodeURIComponent(user.email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
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
      const createCustomerResponse = await fetch('https://sandbox.asaas.com/api/v3/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        },
        body: JSON.stringify({
          name: profile.full_name || user.email,
          email: user.email,
          cpfCnpj: profile.cpf || undefined,
          phone: profile.phone || undefined,
        }),
      });

      if (!createCustomerResponse.ok) {
        const errorText = await createCustomerResponse.text();
        logStep("Failed to create ASAAS customer", { error: errorText });
        throw new Error('Erro ao criar cliente no sistema de pagamento');
      }

      const newCustomer = await createCustomerResponse.json();
      customerId = newCustomer.id;
      logStep("New ASAAS customer created", { customerId });
    }

    // Create ASAAS payment with customer ID
    logStep("Creating ASAAS payment", { customerId, price });
    const asaasResponse = await fetch('https://sandbox.asaas.com/api/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify({
        customer: customerId, // Use customer ID instead of email
        billingType: 'CREDIT_CARD',
        value: price,
        dueDate: new Date().toISOString().split('T')[0],
        description: `Assinatura ${plan.display_name} - ${billing_cycle === 'yearly' ? 'Anual' : 'Mensal'}`,
        externalReference: `subscription_${plan_id}_${user.id}`,
        callback: {
          successUrl: `${req.headers.get("origin")}/dashboard/empresa?payment=success`,
          autoRedirect: false
        }
      }),
    });

    if (!asaasResponse.ok) {
      const errorText = await asaasResponse.text();
      logStep("ASAAS payment creation failed", { error: errorText, status: asaasResponse.status });
      throw new Error('Erro ao processar pagamento');
    }

    const asaasData = await asaasResponse.json();
    logStep("ASAAS payment created", { paymentId: asaasData.id, invoiceUrl: asaasData.invoiceUrl });

    // Create pending subscription record using service client (bypasses RLS)
    const { error: subscriptionError } = await supabaseServiceClient
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        plan_id: plan_id,
        billing_cycle: billing_cycle,
        status: 'pending',
        external_subscription_id: asaasData.id,
        payment_provider: 'asaas',
        expires_at: billing_cycle === 'yearly' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (subscriptionError) {
      logStep("Subscription creation failed", { error: subscriptionError });
      throw new Error('Erro ao criar assinatura');
    }

    logStep("Subscription created successfully", { userId: user.id, planId: plan_id });

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: asaasData.invoiceUrl,
        payment_id: asaasData.id
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