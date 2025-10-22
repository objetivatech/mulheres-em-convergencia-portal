import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-ASAAS-PAYMENT] ${step}${detailsStr}`);
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

    const requestData = await req.json();
    const { paymentId } = requestData;

    if (!paymentId) {
      return new Response(JSON.stringify({ error: "Payment ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    logStep("Cancelling payment in Asaas", { paymentId });

    // Obter chave da API do Asaas
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    if (!asaasApiKey) {
      throw new Error("ASAAS API key not configured");
    }

    const baseUrl = asaasApiKey.includes("_test_") 
      ? "https://sandbox.asaas.com/api/v3" 
      : "https://api.asaas.com/v3";

    // Cancelar cobrança no Asaas
    const response = await fetch(`${baseUrl}/payments/${paymentId}`, {
      method: "DELETE",
      headers: {
        "access_token": asaasApiKey,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      logStep("Payment cancelled successfully in Asaas", { paymentId });
      return new Response(JSON.stringify({
        success: true,
        message: "Cobrança cancelada com sucesso no Asaas"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else {
      const errorText = await response.text();
      logStep("Failed to cancel payment in Asaas", { 
        status: response.status,
        error: errorText.substring(0, 200)
      });
      
      // Não lançar erro - apenas logar
      return new Response(JSON.stringify({
        success: false,
        message: "Falha ao cancelar cobrança no Asaas",
        details: errorText.substring(0, 200)
      }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in cancel payment", { 
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

