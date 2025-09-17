import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

interface TestPostRequest {
  content: string;
  platforms: string[];
  media_urls?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, platforms, media_urls } = await req.json() as TestPostRequest;

    if (!content || !platforms || platforms.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Conteúdo e plataformas são obrigatórios' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get AYRSHARE API key from secrets
    const ayrshareApiKey = Deno.env.get('AYRSHARE_API_KEY');
    if (!ayrshareApiKey) {
      console.error('AYRSHARE_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Chave da API AYRSHARE não configurada' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Prepare AYRSHARE API data
    const postData = {
      post: content,
      platforms: platforms,
      media_urls: media_urls
    };

    console.log('Sending test post to AYRSHARE:', { platforms, contentLength: content.length });

    // Send to AYRSHARE API
    const ayrshareResponse = await fetch('https://app.ayrshare.com/api/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ayrshareApiKey}`,
      },
      body: JSON.stringify(postData),
    });

    const ayrshareResult = await ayrshareResponse.json();

    if (!ayrshareResponse.ok) {
      console.error('AYRSHARE API error:', ayrshareResult);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Erro da API AYRSHARE: ${ayrshareResult.message || 'Erro desconhecido'}`,
          details: ayrshareResult
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('AYRSHARE test post successful:', ayrshareResult);

    // Log the test activity
    await supabase
      .from('user_activity_log')
      .insert({
        user_id: 'system',
        activity_type: 'ayrshare_test_post',
        activity_description: `Teste de post AYRSHARE enviado para ${platforms.join(', ')}`,
        metadata: {
          platforms: platforms,
          content_length: content.length,
          ayrshare_response: ayrshareResult,
          test_timestamp: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Post de teste enviado com sucesso!',
        platforms: platforms,
        ayrshare_result: ayrshareResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Test post error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erro interno do servidor',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});