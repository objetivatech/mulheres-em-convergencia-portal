import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

interface LinkedInPostRequest {
  content: string;
  media_urls?: string[];
  account_id?: string; // ID da conta social_accounts para usar
}

interface LinkedInPostResponse {
  id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { content, media_urls, account_id }: LinkedInPostRequest = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Conteúdo do post é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar conta LinkedIn ativa
    let accountQuery = supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'linkedin')
      .eq('is_active', true);

    if (account_id) {
      accountQuery = accountQuery.eq('id', account_id);
    }

    const { data: accounts, error: accountError } = await accountQuery;

    if (accountError || !accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma conta LinkedIn conectada encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const account = accounts[0];

    // Verificar se o token expirou
    const now = new Date();
    const expiresAt = new Date(account.token_expires_at);
    
    if (now >= expiresAt) {
      return new Response(
        JSON.stringify({ error: 'Token de acesso expirado. Reconecte sua conta LinkedIn.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar payload do post
    const postData: any = {
      author: account.platform_page_id 
        ? `urn:li:organization:${account.platform_page_id}`
        : `urn:li:person:${account.platform_user_id}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: media_urls && media_urls.length > 0 ? 'IMAGE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    // Adicionar mídia se fornecida
    if (media_urls && media_urls.length > 0) {
      postData.specificContent['com.linkedin.ugc.ShareContent'].media = media_urls.map(url => ({
        status: 'READY',
        originalUrl: url,
      }));
    }

    console.log('Enviando post para LinkedIn:', { account_id: account.id, content_length: content.length });

    // Publicar no LinkedIn usando API v2
    const linkedInResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postData),
    });

    const responseText = await linkedInResponse.text();
    console.log('Resposta do LinkedIn:', responseText);

    if (!linkedInResponse.ok) {
      console.error('Erro ao publicar no LinkedIn:', responseText);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Falha ao publicar no LinkedIn',
          details: responseText,
        }),
        { status: linkedInResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const linkedInResult: LinkedInPostResponse = JSON.parse(responseText);

    console.log('Post publicado com sucesso no LinkedIn:', linkedInResult.id);

    return new Response(
      JSON.stringify({
        success: true,
        platform: 'linkedin',
        post_id: linkedInResult.id,
        account_name: account.account_name,
        message: 'Post publicado com sucesso no LinkedIn',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao publicar no LinkedIn:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro interno do servidor',
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
