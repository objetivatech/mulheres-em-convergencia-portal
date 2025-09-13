import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RENEW-BUSINESS-SUBSCRIPTIONS] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client with service role key
    const supabaseServiceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check and deactivate expired businesses
    const { data: expiredCount, error: expireError } = await supabaseServiceClient
      .rpc('deactivate_expired_businesses');

    if (expireError) {
      logStep("Error deactivating expired businesses", { error: expireError });
    } else {
      logStep("Expired businesses deactivated", { count: expiredCount });
    }

    // Get all active subscriptions that need renewal processing
    const { data: activeSubscriptions, error: subsError } = await supabaseServiceClient
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        status,
        billing_cycle,
        expires_at,
        created_at
      `)
      .eq('status', 'active');

    if (subsError) {
      logStep("Error fetching active subscriptions", { error: subsError });
      throw subsError;
    }

    logStep("Active subscriptions found", { count: activeSubscriptions?.length || 0 });

    let processedCount = 0;
    let errorCount = 0;

    // Process each subscription to ensure businesses are properly activated
    for (const subscription of activeSubscriptions || []) {
      try {
        // Check if user has businesses that need activation
        const { data: businesses, error: businessError } = await supabaseServiceClient
          .from('businesses')
          .select('id, name, subscription_active, subscription_renewal_date')
          .eq('owner_id', subscription.user_id);

        if (businessError) {
          logStep("Error fetching user businesses", { 
            userId: subscription.user_id, 
            error: businessError 
          });
          errorCount++;
          continue;
        }

        // Process businesses that need renewal or activation
        for (const business of businesses || []) {
          const needsRenewal = !business.subscription_active || 
                             !business.subscription_renewal_date ||
                             new Date(business.subscription_renewal_date) < new Date();

          if (needsRenewal) {
            const { data: renewResult, error: renewError } = await supabaseServiceClient
              .rpc('renew_business_subscription', {
                business_uuid: business.id
              });

            if (renewError) {
              logStep("Error renewing business", { 
                businessId: business.id, 
                error: renewError 
              });
              errorCount++;
            } else if (renewResult) {
              logStep("Business renewed", { 
                businessId: business.id,
                businessName: business.name 
              });
              processedCount++;
            }
          }
        }
      } catch (error) {
        logStep("Error processing subscription", { 
          subscriptionId: subscription.id, 
          error: error.message 
        });
        errorCount++;
      }
    }

    logStep("Renewal process completed", { 
      processedCount, 
      errorCount,
      totalSubscriptions: activeSubscriptions?.length || 0
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Business subscription renewal process completed",
        stats: {
          processedBusinesses: processedCount,
          errors: errorCount,
          expiredBusinessesDeactivated: expiredCount,
          totalActiveSubscriptions: activeSubscriptions?.length || 0
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    logStep("Function error", { error: error.message });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});