import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

const LINKEDIN_CLIENT_ID = Deno.env.get('LINKEDIN_CLIENT_ID');
const LINKEDIN_CLIENT_SECRET = Deno.env.get('LINKEDIN_CLIENT_SECRET');
const REDIRECT_URI = `${Deno.env.get('SUPABASE_URL')}/functions/v1/social-oauth-linkedin/callback`;

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
}

interface LinkedInUserInfo {
  sub: string;
  name: string;
  email?: string;
  picture?: string;
}

Deno.serve(async (req) => {
  console.log('🚀 Edge function called, method:', req.method, 'url:', req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    console.log('📍 Pathname:', pathname);

    // Iniciar fluxo OAuth
    if (pathname.endsWith('/authorize')) {
      if (!LINKEDIN_CLIENT_ID) {
        return new Response(
          JSON.stringify({ error: 'LinkedIn Client ID não configurado' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Capturar o origin da request para saber para onde redirecionar depois
      const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/')[0] + '//' + req.headers.get('referer')?.split('/')[2];
      console.log('📍 Origin captured:', origin);

      const state = crypto.randomUUID();
      // LinkedIn OIDC scopes - incluindo acesso a páginas de organização
      const scope = 'openid profile email w_member_social r_organization_admin w_organization_social';
      
      // Armazenar o origin no state para recuperar depois (vamos usar um formato state:origin)
      const stateWithOrigin = `${state}:${origin || ''}`;
      
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code&` +
        `client_id=${LINKEDIN_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `state=${stateWithOrigin}&` +
        `scope=${encodeURIComponent(scope)}`;

      return new Response(
        JSON.stringify({ authUrl, state }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Callback OAuth - recebe redirect do LinkedIn e redireciona de volta para o app
    if (pathname.endsWith('/callback')) {
      console.log('📍 LinkedIn callback received');
      const code = url.searchParams.get('code');
      const stateParam = url.searchParams.get('state');
      const error = url.searchParams.get('error');
      
      console.log('📝 Callback params - code:', code ? 'present' : 'missing', 'state:', stateParam, 'error:', error);

      // Extrair o origin do state (formato: state:origin)
      let appUrl = 'https://mulheresemconvergencia.com.br'; // Default para o domínio customizado
      let state = stateParam;
      
      if (stateParam && stateParam.includes(':')) {
        const parts = stateParam.split(':');
        state = parts[0];
        const origin = parts.slice(1).join(':'); // Reconstrói o origin caso tenha mais de um ":"
        if (origin) {
          appUrl = origin;
        }
      }
      
      console.log('📍 App URL determined:', appUrl);
      
      if (error) {
        console.log('❌ LinkedIn returned error:', error);
        const redirectUrl = `${appUrl}/admin/redes-sociais?linkedin_error=${encodeURIComponent(error)}`;
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': redirectUrl,
          },
        });
      }

      if (!code) {
        console.log('❌ No authorization code provided');
        const redirectUrl = `${appUrl}/admin/redes-sociais?linkedin_error=${encodeURIComponent('Código de autorização não fornecido')}`;
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': redirectUrl,
          },
        });
      }

      // Redirecionar de volta para o app com o código e state
      console.log('✅ Redirecting back to app with code and state');
      const redirectUrl = `${appUrl}/admin/redes-sociais?linkedin_code=${encodeURIComponent(code)}&linkedin_state=${encodeURIComponent(state || '')}`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': redirectUrl,
        },
      });
    }

    // Endpoint para conectar conta após receber o código
    if (pathname.endsWith('/connect')) {
      console.log('📥 Received /connect request');
      
      const authHeader = req.headers.get('Authorization');
      console.log('🔑 Auth header present:', !!authHeader);
      
      if (!authHeader) {
        console.error('❌ No auth header provided');
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
      console.log('👤 User retrieved:', !!user, 'Error:', userError);
      
      if (userError || !user) {
        console.error('❌ User authentication failed:', userError);
        return new Response(
          JSON.stringify({ error: 'Usuário não autenticado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { code } = await req.json();
      console.log('📝 Authorization code received:', code ? 'Yes' : 'No');

      if (!code) {
        console.error('❌ No authorization code provided');
        return new Response(
          JSON.stringify({ error: 'Código de autorização não fornecido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Trocar código por access token
      console.log('🔄 Exchanging code for access token...');
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          client_id: LINKEDIN_CLIENT_ID!,
          client_secret: LINKEDIN_CLIENT_SECRET!,
          redirect_uri: REDIRECT_URI,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('❌ Failed to get access token:', tokenResponse.status, errorData);
        return new Response(
          JSON.stringify({ error: 'Falha ao obter token de acesso', details: errorData }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenData: LinkedInTokenResponse = await tokenResponse.json();
      console.log('✅ Access token received, expires in:', tokenData.expires_in, 'seconds');

      // Obter informações do usuário
      console.log('👤 Fetching user info from LinkedIn...');
      const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        const errorData = await userInfoResponse.text();
        console.error('❌ Failed to get user info:', userInfoResponse.status, errorData);
        return new Response(
          JSON.stringify({ error: 'Falha ao obter informações do usuário', details: errorData }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userInfo: LinkedInUserInfo = await userInfoResponse.json();
      console.log('✅ User info received:', userInfo.name, userInfo.email);

      // Buscar páginas de organização que o usuário administra
      console.log('🏢 Fetching organization pages...');
      let organizationPages = [];
      try {
        const orgsResponse = await fetch('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName,vanityName)))', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        if (orgsResponse.ok) {
          const orgsData = await orgsResponse.json();
          organizationPages = orgsData.elements?.map((element: any) => ({
            id: element['organization~']?.id,
            name: element['organization~']?.localizedName,
            vanityName: element['organization~']?.vanityName,
          })) || [];
          console.log('✅ Found', organizationPages.length, 'organization pages');
        }
      } catch (orgError) {
        console.warn('⚠️ Could not fetch organization pages:', orgError);
      }

      // Calcular expiração do token
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      // Salvar conta social no banco de dados
      console.log('💾 Saving account to database...');
      const { data: account, error: accountError } = await supabase
        .from('social_accounts')
        .upsert({
          user_id: user.id,
          platform: 'linkedin',
          account_name: userInfo.name,
          account_email: userInfo.email,
          access_token: tokenData.access_token,
          token_expires_at: expiresAt.toISOString(),
          platform_user_id: userInfo.sub,
          platform_page_id: null, // Será preenchido se o usuário selecionar uma página
          metadata: {
            scope: tokenData.scope,
            picture: userInfo.picture,
            organization_pages: organizationPages,
          },
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,platform,platform_user_id',
        })
        .select()
        .single();

      if (accountError) {
        console.error('Erro ao salvar conta:', accountError);
        return new Response(
          JSON.stringify({ error: 'Falha ao salvar conta social', details: accountError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Conta LinkedIn conectada com sucesso:', account.id);

      return new Response(
        JSON.stringify({
          success: true,
          account: {
            id: account.id,
            platform: 'linkedin',
            account_name: userInfo.name,
            account_email: userInfo.email,
            organization_pages: organizationPages,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Rota não encontrada' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no OAuth LinkedIn:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor',
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
