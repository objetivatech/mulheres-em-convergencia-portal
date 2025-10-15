import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, data?: any) => {
  console.log(JSON.stringify({ step, timestamp: new Date().toISOString(), ...data }));
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      logStep('Unauthorized access attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check if user is admin using has_role function
    const { data: isAdmin } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      logStep('Non-admin access attempt', { userId: user.id });
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    logStep('Admin cleanup initiated', { adminId: user.id });

    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find all complimentary businesses
    const { data: complimentaryBusinesses, error: businessError } = await supabaseServiceClient
      .from('businesses')
      .select('id, name, owner_id')
      .eq('is_complimentary', true);

    if (businessError) {
      logStep('Error fetching complimentary businesses', { error: businessError });
      throw businessError;
    }

    if (!complimentaryBusinesses || complimentaryBusinesses.length === 0) {
      logStep('No complimentary businesses found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No complimentary businesses found',
          cancelled: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    logStep('Found complimentary businesses', { count: complimentaryBusinesses.length });

    const results = [];
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');

    for (const business of complimentaryBusinesses) {
      logStep('Processing business', { businessId: business.id, businessName: business.name });

      // Find active subscriptions for this business owner
      const { data: subscriptions, error: subError } = await supabaseServiceClient
        .from('user_subscriptions')
        .select('id, external_subscription_id, status')
        .eq('user_id', business.owner_id)
        .eq('status', 'active');

      if (subError) {
        logStep('Error fetching subscriptions', { businessId: business.id, error: subError });
        results.push({
          businessId: business.id,
          businessName: business.name,
          success: false,
          error: 'Failed to fetch subscriptions'
        });
        continue;
      }

      if (!subscriptions || subscriptions.length === 0) {
        logStep('No active subscriptions found', { businessId: business.id });
        results.push({
          businessId: business.id,
          businessName: business.name,
          success: true,
          message: 'No active subscriptions to cancel'
        });
        continue;
      }

      // Cancel each active subscription
      for (const subscription of subscriptions) {
        let cancelledInAsaas = false;

        if (subscription.external_subscription_id) {
          // Try to cancel in Asaas
          const asaasBases = [
            'https://www.asaas.com/api/v3',
            'https://sandbox.asaas.com/api/v3'
          ];

          for (const base of asaasBases) {
            try {
              const res = await fetch(
                `${base}/subscriptions/${subscription.external_subscription_id}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    'access_token': asaasApiKey,
                  },
                }
              );

              if (res.ok) {
                cancelledInAsaas = true;
                logStep('Asaas subscription cancelled', { 
                  subscriptionId: subscription.external_subscription_id,
                  environment: base 
                });
                break;
              }
            } catch (error) {
              logStep('Asaas cancellation attempt failed', { base, error: error.message });
            }
          }
        }

        // Update local subscription status
        const { error: updateError } = await supabaseServiceClient
          .from('user_subscriptions')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        if (updateError) {
          logStep('Error updating subscription status', { subscriptionId: subscription.id, error: updateError });
          results.push({
            businessId: business.id,
            businessName: business.name,
            subscriptionId: subscription.id,
            success: false,
            error: 'Failed to update local status'
          });
        } else {
          // Log activity
          await supabaseServiceClient.rpc('log_user_activity', {
            p_user_id: business.owner_id,
            p_activity_type: 'complimentary_cleanup',
            p_description: `Assinatura cancelada automaticamente por cleanup (negócio cortesia: ${business.name})`,
            p_metadata: {
              businessId: business.id,
              businessName: business.name,
              subscriptionId: subscription.id,
              externalSubscriptionId: subscription.external_subscription_id,
              cancelledInAsaas,
              adminId: user.id
            }
          });

          results.push({
            businessId: business.id,
            businessName: business.name,
            subscriptionId: subscription.id,
            externalSubscriptionId: subscription.external_subscription_id,
            success: true,
            cancelledInAsaas,
            message: cancelledInAsaas 
              ? 'Subscription cancelled in Asaas and locally' 
              : 'Subscription cancelled locally only (Asaas not reachable)'
          });

          logStep('Subscription cleanup successful', {
            businessId: business.id,
            subscriptionId: subscription.id,
            cancelledInAsaas
          });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalProcessed = results.length;

    logStep('Cleanup completed', { 
      totalProcessed, 
      successCount,
      failedCount: totalProcessed - successCount 
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Cleanup completed: ${successCount}/${totalProcessed} subscriptions cancelled`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    logStep('Cleanup function error', { error: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
