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
      JSON.stringify({ 
        success: false,
        error: 'Method not allowed' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role to bypass RLS for insertion - explicitly set schema
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: 'public' }
    });

    console.log('[SUBMIT-REVIEW] Request received');
    const body: ReviewRequest = await req.json();
    console.log('[SUBMIT-REVIEW] Request body:', { 
      business_id: body.business_id, 
      rating: body.rating, 
      reviewer_name: body.reviewer_name 
    });

    // Validate required fields
    if (!body.business_id || !body.rating || !body.reviewer_name) {
      console.log('[SUBMIT-REVIEW] Validation failed - missing required fields');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Campos obrigatórios: business_id, rating, reviewer_name' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate rating range
    if (body.rating < 1 || body.rating > 5) {
      console.log('[SUBMIT-REVIEW] Validation failed - invalid rating range');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'A avaliação deve ser entre 1 e 5 estrelas' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify business exists using maybeSingle() to avoid errors when not found
    console.log('[SUBMIT-REVIEW] Checking if business exists:', body.business_id);
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', body.business_id)
      .maybeSingle();

    console.log('[SUBMIT-REVIEW] Business lookup result:', { business, businessError });

    if (businessError) {
      console.error('[SUBMIT-REVIEW] Business lookup error:', businessError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Erro ao verificar empresa' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!business) {
      console.log('[SUBMIT-REVIEW] Business not found');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Empresa não encontrada' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get authenticated user if possible
    const authHeader = req.headers.get('Authorization');
    let reviewerId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        reviewerId = user.id;
      }
    }

    // Use the new safe RPC function
    console.log('[SUBMIT-REVIEW] Calling submit_business_review_safe RPC');
    const { data: result, error: rpcError } = await supabase.rpc('submit_business_review_safe', {
      p_business_id: body.business_id,
      p_rating: body.rating,
      p_reviewer_name: body.reviewer_name,
      p_title: body.title || null,
      p_comment: body.comment || null,
      p_reviewer_email: body.reviewer_email || null,
      p_reviewer_id: reviewerId
    });

    if (rpcError) {
      console.error('[SUBMIT-REVIEW] RPC error:', rpcError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Erro interno do servidor. Tente novamente em alguns instantes.',
          details: rpcError.message
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!result?.success) {
      console.log('[SUBMIT-REVIEW] Review submission failed:', result?.error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: result?.error || 'Erro ao enviar avaliação'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[SUBMIT-REVIEW] Review submitted successfully:', result.review_id);

    // Log activity if user is authenticated
    if (reviewerId) {
      await supabase.rpc('log_user_activity', {
        p_user_id: reviewerId,
        p_activity_type: 'review_submitted',
        p_description: `Avaliação enviada para ${result.business_name}`,
        p_metadata: {
          business_id: body.business_id,
          business_name: result.business_name,
          rating: body.rating,
          review_id: result.review_id
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: result.message,
        review_id: result.review_id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in submit-business-review:', error);
    
    // Return more detailed error information for debugging
    let userFriendlyError = "Erro interno do servidor. Tente novamente.";
    if (errorMessage.includes("business not found") || errorMessage.includes("inativo")) {
      userFriendlyError = "Negócio não encontrado ou inativo.";
    } else if (errorMessage.includes("rating")) {
      userFriendlyError = "Avaliação deve ser entre 1 e 5 estrelas.";
    } else if (errorMessage.includes("reviewer_name")) {
      userFriendlyError = "Nome do avaliador é obrigatório.";
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: userFriendlyError,
      details: errorMessage
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});