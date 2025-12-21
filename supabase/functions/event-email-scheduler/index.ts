import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EVENT-EMAIL-SCHEDULER] ${step}${detailsStr}`);
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

    logStep("Starting email scheduler");

    // Get tomorrow's date range (events happening in 24 hours)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    logStep("Checking events for tomorrow", { 
      start: tomorrowStart.toISOString(), 
      end: tomorrowEnd.toISOString() 
    });

    // Find events happening tomorrow
    const { data: events, error: eventsError } = await supabaseClient
      .from('events')
      .select('id, title, date_start')
      .gte('date_start', tomorrowStart.toISOString())
      .lte('date_start', tomorrowEnd.toISOString())
      .eq('status', 'published');

    if (eventsError) {
      throw new Error(`Error fetching events: ${eventsError.message}`);
    }

    logStep("Found events for tomorrow", { count: events?.length || 0 });

    let totalEmailsSent = 0;
    const results: any[] = [];

    // Send reminder emails for each event
    for (const event of events || []) {
      logStep("Processing event", { id: event.id, title: event.title });

      try {
        // Call send-event-email function with reminder action
        const { data, error } = await supabaseClient.functions.invoke('send-event-email', {
          body: {
            action: 'reminder',
            event_id: event.id
          }
        });

        if (error) {
          logStep("Error sending reminders for event", { eventId: event.id, error: error.message });
          results.push({ eventId: event.id, success: false, error: error.message });
        } else {
          const emailsSent = data?.emails_sent || 0;
          totalEmailsSent += emailsSent;
          results.push({ eventId: event.id, success: true, emailsSent });
          logStep("Reminders sent for event", { eventId: event.id, emailsSent });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logStep("Exception sending reminders", { eventId: event.id, error: errorMessage });
        results.push({ eventId: event.id, success: false, error: errorMessage });
      }
    }

    logStep("Scheduler completed", { totalEmailsSent, eventsProcessed: events?.length || 0 });

    return new Response(
      JSON.stringify({ 
        success: true, 
        total_emails_sent: totalEmailsSent,
        events_processed: events?.length || 0,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
