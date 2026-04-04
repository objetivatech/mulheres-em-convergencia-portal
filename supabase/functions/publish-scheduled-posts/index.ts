import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting scheduled posts publication check...')

    // Get posts that are about to be published (before updating)
    const { data: postsToPublish } = await supabase
      .from('blog_posts')
      .select('id, title')
      .or('status.eq.scheduled,and(status.eq.draft,scheduled_for.not.is.null)')
      .not('scheduled_for', 'is', null)
      .lte('scheduled_for', new Date().toISOString())

    // Call the database function to publish scheduled posts
    const { data, error } = await supabase.rpc('publish_scheduled_posts')

    if (error) {
      console.error('Error publishing scheduled posts:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to publish scheduled posts', details: error.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    const publishedCount = data || 0
    console.log(`Published ${publishedCount} scheduled posts`)

    // Log activity
    if (publishedCount > 0) {
      await supabase.from('user_activity_log').insert({
        user_id: 'system',
        activity_type: 'blog_scheduled_publish',
        activity_description: `${publishedCount} post(s) agendado(s) publicado(s) automaticamente`,
        metadata: {
          published_count: publishedCount,
          post_ids: postsToPublish?.map(p => p.id) || [],
        }
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        publishedCount,
        message: `Successfully published ${publishedCount} scheduled posts`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in publish-scheduled-posts function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})