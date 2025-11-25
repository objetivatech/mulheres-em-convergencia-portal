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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Iniciar fluxo OAuth
    if (pathname.endsWith('/authorize')) {
      if (!LINKEDIN_CLIENT_ID) {
        return new Response(
          JSON.stringify({ error: 'LinkedIn Client ID não configurado' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const state = crypto.randomUUID();
      // LinkedIn OIDC scopes - agora com Sign In with LinkedIn using OpenID Connect ativado
      const scope = 'openid profile email w_member_social';
      
      
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code&` +
        `client_id=${LINKEDIN_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `state=${state}&` +
        `scope=${encodeURIComponent(scope)}`;

      return new Response(
        JSON.stringify({ authUrl, state }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Callback OAuth - recebe redirect do LinkedIn e retorna HTML com postMessage
    if (pathname.endsWith('/callback')) {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        const htmlResponse = `
          <!DOCTYPE html>
          <html>
            <head><title>Erro de Autenticação</title></head>
            <body>
              <script>
                window.opener.postMessage({ 
                  type: 'LINKEDIN_AUTH_ERROR', 
                  error: '${error}' 
                }, '*');
                window.close();
              </script>
            </body>
          </html>
        `;
        return new Response(htmlResponse, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }

      if (!code) {
        const htmlResponse = `
          <!DOCTYPE html>
          <html>
            <head><title>Erro de Autenticação</title></head>
            <body>
              <script>
                window.opener.postMessage({ 
                  type: 'LINKEDIN_AUTH_ERROR', 
                  error: 'Código de autorização não fornecido' 
                }, '*');
                window.close();
              </script>
            </body>
          </html>
        `;
        return new Response(htmlResponse, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }

      // Retorna HTML que envia o código para a janela pai
      const htmlResponse = `
        <!DOCTYPE html>
        <html>
          <head><title>Conectando...</title></head>
          <body>
            <p>Conectando sua conta LinkedIn...</p>
            <script>
              window.opener.postMessage({ 
                type: 'LINKEDIN_AUTH_SUCCESS', 
                code: '${code}',
                state: '${state}'
              }, '*');
              setTimeout(() => window.close(), 1000);
            </script>
          </body>
        </html>
      `;
      
      return new Response(htmlResponse, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // Endpoint para conectar conta após receber o código
    if (pathname.endsWith('/connect')) {
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

      const { code } = await req.json();

      if (!code) {
        return new Response(
          JSON.stringify({ error: 'Código de autorização não fornecido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Trocar código por access token
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
        console.error('Erro ao obter token:', errorData);
        return new Response(
          JSON.stringify({ error: 'Falha ao obter token de acesso', details: errorData }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenData: LinkedInTokenResponse = await tokenResponse.json();

      // Obter informações do usuário
      const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        const errorData = await userInfoResponse.text();
        console.error('Erro ao obter informações do usuário:', errorData);
        return new Response(
          JSON.stringify({ error: 'Falha ao obter informações do usuário', details: errorData }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userInfo: LinkedInUserInfo = await userInfoResponse.json();

      // Calcular expiração do token
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      // Salvar conta social no banco de dados
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
          metadata: {
            scope: tokenData.scope,
            picture: userInfo.picture,
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
