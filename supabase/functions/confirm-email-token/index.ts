import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConfirmTokenRequest {
  token: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: ConfirmTokenRequest = await req.json();
    const { token } = body;

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[CONFIRM-EMAIL-TOKEN] Validating token: ${token.substring(0, 10)}...`);

    // Find token in database
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_confirmation_tokens')
      .select('*')
      .eq('token', token)
      .is('confirmed_at', null) // Only unconfirmed tokens
      .single();

    if (tokenError || !tokenData) {
      console.error('[CONFIRM-EMAIL-TOKEN] Token not found or already used');
      return new Response(
        JSON.stringify({ 
          error: 'Token inválido ou já utilizado',
          code: 'INVALID_TOKEN'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      console.error('[CONFIRM-EMAIL-TOKEN] Token expired');
      return new Response(
        JSON.stringify({ 
          error: 'Token expirado. Solicite um novo email de confirmação.',
          code: 'TOKEN_EXPIRED'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Mark token as confirmed
    const { error: updateTokenError } = await supabase
      .from('email_confirmation_tokens')
      .update({ confirmed_at: new Date().toISOString() })
      .eq('token', token);

    if (updateTokenError) {
      console.error('[CONFIRM-EMAIL-TOKEN] Error updating token:', updateTokenError);
      throw new Error('Failed to confirm token');
    }

    // Update user's email_confirmed_at in auth.users
    const { error: updateUserError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { email_confirm: true }
    );

    if (updateUserError) {
      console.error('[CONFIRM-EMAIL-TOKEN] Error confirming user email:', updateUserError);
      throw new Error('Failed to confirm user email');
    }

    // Update profile to mark as confirmed
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ 
        email_confirmed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenData.user_id);

    if (updateProfileError) {
      console.warn('[CONFIRM-EMAIL-TOKEN] Error updating profile:', updateProfileError);
      // Don't fail if profile update fails, email is already confirmed
    }

    console.log(`[CONFIRM-EMAIL-TOKEN] Email confirmed successfully for user: ${tokenData.user_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email confirmado com sucesso! Você já pode fazer login.',
        user_id: tokenData.user_id,
        email: tokenData.email
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[CONFIRM-EMAIL-TOKEN] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to confirm email',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

