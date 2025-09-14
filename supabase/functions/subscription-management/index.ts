import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBSCRIPTION-MANAGEMENT] ${step}${detailsStr}`);
};

// Função para fazer requisições à API do ASAAS
const asaasFetch = async (endpoint: string, options: any = {}) => {
  const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
  if (!asaasApiKey) {
    throw new Error("ASAAS API key not configured");
  }

  const baseUrl = asaasApiKey.includes("_test_") 
    ? "https://sandbox.asaas.com/api/v3" 
    : "https://api.asaas.com/v3";

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      "access_token": asaasApiKey,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    logStep("ASAAS API Error", { 
      endpoint, 
      status: response.status, 
      error: error.substring(0, 500) 
    });
    throw new Error(`ASAAS API error: ${response.status} - ${error}`);
  }

  return await response.json();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Request received", { method: req.method });

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Verificar autenticação
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verificar usuário
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      logStep("Authentication failed", { error: userError });
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const requestData = await req.json();
    const { action, subscriptionId, newPlanId } = requestData;

    logStep("Processing subscription action", { 
      action, 
      subscriptionId, 
      newPlanId,
      userId: user.id 
    });

    // Buscar assinatura do usuário
    const { data: subscription, error: subError } = await supabaseClient
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("id", subscriptionId)
      .single();

    if (subError || !subscription) {
      logStep("Subscription not found", { subscriptionId, error: subError });
      return new Response(JSON.stringify({ 
        error: "Subscription not found or access denied" 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "cancel") {
      // Cancelar assinatura no ASAAS
      if (subscription.external_subscription_id) {
        try {
          await asaasFetch(`/subscriptions/${subscription.external_subscription_id}`, {
            method: "DELETE"
          });
          logStep("ASAAS subscription cancelled", { 
            externalId: subscription.external_subscription_id 
          });
        } catch (error) {
          logStep("Error cancelling ASAAS subscription", { error });
          // Continue mesmo se falhar no ASAAS - atualize localmente
        }
      }

      // Atualizar status local e definir data de expiração para 31 dias
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 31);
      
      const { error: updateError } = await supabaseClient
        .from("user_subscriptions")
        .update({ 
          status: "cancelled",
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", subscription.id);

      if (updateError) {
        throw new Error(`Failed to update local subscription: ${updateError.message}`);
      }

      // IMPORTANTE: NÃO desativar negócios imediatamente no cancelamento
      // Os negócios devem permanecer ativos por 31 dias após o cancelamento
      // A desativação será feita pela função renew-business-subscriptions quando expirar o período
      logStep("Subscription cancelled but businesses remain active for 31-day period");

      logStep("Subscription cancelled successfully", { subscriptionId });

      // Log subscription cancellation activity
      await supabaseClient.rpc('log_user_activity', {
        p_user_id: user.id,
        p_activity_type: 'subscription_cancelled',
        p_description: 'Assinatura cancelada pelo usuário',
        p_metadata: {
          subscription_id: subscription.id,
          plan_id: subscription.plan_id,
          external_subscription_id: subscription.external_subscription_id,
          cancellation_reason: 'user_requested'
        }
      });

      return new Response(JSON.stringify({
        success: true,
        message: "Assinatura cancelada com sucesso"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } else if (action === "change_plan") {
      if (!newPlanId) {
        return new Response(JSON.stringify({ 
          error: "New plan ID is required for plan change" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Buscar novo plano
      const { data: newPlan, error: planError } = await supabaseClient
        .from("subscription_plans")
        .select("*")
        .eq("id", newPlanId)
        .eq("is_active", true)
        .single();

      if (planError || !newPlan) {
        logStep("New plan not found", { newPlanId, error: planError });
        return new Response(JSON.stringify({ 
          error: "Plan not found or inactive" 
        }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Atualizar assinatura no ASAAS (se existir)
      if (subscription.external_subscription_id) {
        try {
          const newValue = subscription.billing_cycle === "yearly" 
            ? newPlan.price_yearly 
            : newPlan.price_monthly;

          await asaasFetch(`/subscriptions/${subscription.external_subscription_id}`, {
            method: "PUT",
            body: JSON.stringify({
              value: newValue,
              description: `Assinatura ${newPlan.display_name} - ${subscription.billing_cycle === "yearly" ? "Anual" : "Mensal"}`
            })
          });

          logStep("ASAAS subscription updated", { 
            externalId: subscription.external_subscription_id,
            newValue 
          });
        } catch (error) {
          logStep("Error updating ASAAS subscription", { error });
          // Continue mesmo se falhar no ASAAS
        }
      }

      // Atualizar plano local
      const { error: updateError } = await supabaseClient
        .from("user_subscriptions")
        .update({ 
          plan_id: newPlanId,
          updated_at: new Date().toISOString()
        })
        .eq("id", subscription.id);

      if (updateError) {
        throw new Error(`Failed to update subscription plan: ${updateError.message}`);
      }

      logStep("Plan changed successfully", { 
        subscriptionId, 
        oldPlan: subscription.plan_id, 
        newPlan: newPlanId 
      });

      // Log subscription plan change activity
      await supabaseClient.rpc('log_user_activity', {
        p_user_id: user.id,
        p_activity_type: 'subscription_updated',
        p_description: `Plano de assinatura alterado para ${newPlan.display_name}`,
        p_metadata: {
          subscription_id: subscription.id,
          old_plan_id: subscription.plan_id,
          new_plan_id: newPlanId,
          new_plan_name: newPlan.display_name,
          billing_cycle: subscription.billing_cycle
        }
      });

      return new Response(JSON.stringify({
        success: true,
        message: "Plano alterado com sucesso"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } else {
      return new Response(JSON.stringify({ 
        error: "Invalid action. Supported actions: cancel, change_plan" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in subscription management", { 
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