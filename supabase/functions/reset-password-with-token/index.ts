import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResetPasswordRequest {
  token: string;
  new_password: string;
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
    const body: ResetPasswordRequest = await req.json();
    const { token, new_password } = body;

    if (!token || !new_password) {
      return new Response(
        JSON.stringify({ error: 'Token and new password are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate password strength
    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[RESET-PASSWORD] Validating token: ${token.substring(0, 10)}...`);

    // Find token in database
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null) // Only unused tokens
      .single();

    if (tokenError || !tokenData) {
      console.error('[RESET-PASSWORD] Token not found or already used');
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
      console.error('[RESET-PASSWORD] Token expired');
      return new Response(
        JSON.stringify({ 
          error: 'Token expirado. Solicite um novo link de redefinição de senha.',
          code: 'TOKEN_EXPIRED'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Mark token as used
    const { error: updateTokenError } = await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    if (updateTokenError) {
      console.error('[RESET-PASSWORD] Error updating token:', updateTokenError);
      throw new Error('Failed to mark token as used');
    }

    // Update user's password
    const { error: updatePasswordError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password: new_password }
    );

    if (updatePasswordError) {
      console.error('[RESET-PASSWORD] Error updating password:', updatePasswordError);
      
      // Rollback token usage
      await supabase
        .from('password_reset_tokens')
        .update({ used_at: null })
        .eq('token', token);
      
      throw new Error('Failed to update password');
    }

    console.log(`[RESET-PASSWORD] Password reset successfully for user: ${tokenData.user_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Senha redefinida com sucesso! Você já pode fazer login com sua nova senha.',
        user_id: tokenData.user_id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[RESET-PASSWORD] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to reset password',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

