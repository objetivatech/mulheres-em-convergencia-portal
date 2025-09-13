import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'
import { corsHeaders } from '../_shared/cors.ts'

interface ReviewRequest {
  business_id: string;
  rating: number;
  title?: string;
  comment?: string;
  reviewer_name: string;
  reviewer_email?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role to bypass RLS for insertion
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ReviewRequest = await req.json();

    // Validate required fields
    if (!body.business_id || !body.rating || !body.reviewer_name) {
      return new Response(
        JSON.stringify({ 
          error: 'Campos obrigatórios: business_id, rating, reviewer_name' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate rating range
    if (body.rating < 1 || body.rating > 5) {
      return new Response(
        JSON.stringify({ 
          error: 'A avaliação deve ser entre 1 e 5 estrelas' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify business exists
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', body.business_id)
      .single();

    if (businessError || !business) {
      return new Response(
        JSON.stringify({ 
          error: 'Empresa não encontrada' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert the review
    const { data: review, error: reviewError } = await supabase
      .from('business_reviews')
      .insert({
        business_id: body.business_id,
        rating: body.rating,
        title: body.title?.trim() || null,
        comment: body.comment?.trim() || null,
        reviewer_name: body.reviewer_name.trim(),
        reviewer_email: body.reviewer_email?.trim() || null,
        verified: false
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error inserting review:', reviewError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro interno do servidor. Tente novamente em alguns instantes.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log activity if user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await supabase.rpc('log_user_activity', {
          p_user_id: user.id,
          p_activity_type: 'review_submitted',
          p_description: `Avaliação enviada para ${business.name}`,
          p_metadata: {
            business_id: body.business_id,
            business_name: business.name,
            rating: body.rating,
            review_id: review.id
          }
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Avaliação enviada com sucesso!',
        review_id: review.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in submit-business-review:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor. Tente novamente em alguns instantes.' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});