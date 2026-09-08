import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from 'https://esm.sh/zod@3.25.76'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ResetPasswordRequestSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  new_password: z.string().min(8).max(128),
});

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
    const parsed = ResetPasswordRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Link ou senha inválidos.', code: 'INVALID_REQUEST' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    const { token, new_password } = parsed.data;

    // Validate password strength
    console.log('[RESET-PASSWORD] Validating one-time token');

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

    // Update user's password
    const { error: updatePasswordError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password: new_password }
    );

    if (updatePasswordError) {
      console.error('[RESET-PASSWORD] Error updating password:', updatePasswordError);
      
      throw new Error('Failed to update password');
    }

    // Consome o token somente depois da senha ter sido alterada com sucesso.
    const { error: updateTokenError } = await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)
      .is('used_at', null);

    if (updateTokenError) {
      console.error('[RESET-PASSWORD] Error consuming token:', updateTokenError);
      throw new Error('Failed to consume reset token');
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

  } catch (error: unknown) {
    console.error('[RESET-PASSWORD] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to reset password';
    return new Response(
      JSON.stringify({ 
        error: message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

