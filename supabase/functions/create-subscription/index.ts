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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    const { plan_id, billing_cycle }: CreateSubscriptionRequest = await req.json();

    // Get plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      throw new Error("Plano não encontrado");
    }

    // Get user profile using email since profiles might use different IDs
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('email', user.email)
      .single();

    if (profileError) {
      console.error('Profile Error:', profileError);
      throw new Error("Perfil não encontrado. Certifique-se de completar seu cadastro com CPF.");
    }

    // Calculate price based on billing cycle
    const price = billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    
    // Create ASAAS payment
    const asaasResponse = await fetch('https://sandbox.asaas.com/api/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': Deno.env.get('ASAAS_API_KEY') || '',
      },
      body: JSON.stringify({
        customer: user.email,
        billingType: 'CREDIT_CARD',
        value: price,
        dueDate: new Date().toISOString().split('T')[0],
        description: `Assinatura ${plan.display_name} - ${billing_cycle === 'yearly' ? 'Anual' : 'Mensal'}`,
        externalReference: `subscription_${plan_id}_${user.id}`,
        installmentCount: billing_cycle === 'yearly' ? 12 : 1,
        callback: {
          successUrl: `${req.headers.get("origin")}/dashboard/empresa?payment=success`,
          autoRedirect: false
        }
      }),
    });

    if (!asaasResponse.ok) {
      const errorText = await asaasResponse.text();
      console.error('ASAAS Error:', errorText);
      throw new Error('Erro ao processar pagamento');
    }

    const asaasData = await asaasResponse.json();

    // Create pending subscription record (use auth user ID for consistency)
    const { error: subscriptionError } = await supabaseClient
      .from('user_subscriptions')
      .insert({
        user_id: user.id, // Keep using auth user ID for subscriptions
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
      console.error('Subscription Error:', subscriptionError);
      throw new Error('Erro ao criar assinatura');
    }

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