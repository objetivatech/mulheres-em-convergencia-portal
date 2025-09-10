import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("Activating Raquel's subscription...");

    // Ativar assinatura da Raquel
    const { data: subscription, error: subError } = await supabaseClient
      .from("user_subscriptions")
      .update({ 
        status: "active",
        updated_at: new Date().toISOString()
      })
      .eq("external_subscription_id", "pay_uqqxj0nlc8ogc6tj")
      .select("*")
      .single();

    if (subError) {
      throw new Error(`Failed to update subscription: ${subError.message}`);
    }

    console.log("Subscription activated:", subscription);

    // Ativar negócios da Raquel
    const { data: businesses, error: bizError } = await supabaseClient
      .from("businesses")
      .update({
        subscription_active: true,
        subscription_expires_at: subscription.expires_at,
        updated_at: new Date().toISOString()
      })
      .eq("owner_id", subscription.user_id)
      .select("*");

    if (bizError) {
      throw new Error(`Failed to update businesses: ${bizError.message}`);
    }

    console.log("Businesses activated:", businesses);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Raquel's subscription and businesses activated successfully!",
      subscription: subscription,
      businesses: businesses
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error) 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});