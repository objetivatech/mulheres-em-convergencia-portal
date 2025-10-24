-- Migration: Create email tokens tables for MailRelay integration
-- Created: 2025-10-24
-- Purpose: Support email confirmation and password reset flows via MailRelay

-- ============================================================================
-- Table: email_confirmation_tokens
-- Purpose: Store tokens for email confirmation during user registration
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_confirmation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT token_not_empty CHECK (length(token) > 0),
  CONSTRAINT expires_after_creation CHECK (expires_at > created_at)
);

-- Indexes for performance
CREATE INDEX idx_email_confirmation_token ON public.email_confirmation_tokens(token);
CREATE INDEX idx_email_confirmation_user ON public.email_confirmation_tokens(user_id);
CREATE INDEX idx_email_confirmation_email ON public.email_confirmation_tokens(email);
CREATE INDEX idx_email_confirmation_expires ON public.email_confirmation_tokens(expires_at) WHERE confirmed_at IS NULL;

-- RLS Policies
ALTER TABLE public.email_confirmation_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only view their own confirmation tokens
CREATE POLICY "Users can view own confirmation tokens"
  ON public.email_confirmation_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update/delete
CREATE POLICY "Service role can manage confirmation tokens"
  ON public.email_confirmation_tokens
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- Table: password_reset_tokens
-- Purpose: Store tokens for password reset requests
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_reset_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT reset_token_not_empty CHECK (length(token) > 0),
  CONSTRAINT reset_expires_after_creation CHECK (expires_at > created_at)
);

-- Indexes for performance
CREATE INDEX idx_password_reset_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_user ON public.password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_email ON public.password_reset_tokens(email);
CREATE INDEX idx_password_reset_expires ON public.password_reset_tokens(expires_at) WHERE used_at IS NULL;

-- RLS Policies
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only view their own reset tokens
CREATE POLICY "Users can view own reset tokens"
  ON public.password_reset_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update/delete
CREATE POLICY "Service role can manage reset tokens"
  ON public.password_reset_tokens
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- Function: Clean up expired tokens
-- Purpose: Remove expired tokens to keep tables clean
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_email_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete expired confirmation tokens (older than 7 days)
  DELETE FROM public.email_confirmation_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days';
  
  -- Delete expired reset tokens (older than 7 days)
  DELETE FROM public.password_reset_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days';
  
  -- Delete used reset tokens (older than 30 days)
  DELETE FROM public.password_reset_tokens
  WHERE used_at IS NOT NULL AND used_at < NOW() - INTERVAL '30 days';
  
  -- Delete confirmed tokens (older than 30 days)
  DELETE FROM public.email_confirmation_tokens
  WHERE confirmed_at IS NOT NULL AND confirmed_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.cleanup_expired_email_tokens() TO service_role;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE public.email_confirmation_tokens IS 'Stores tokens for email confirmation during user registration. Tokens expire after 24 hours.';
COMMENT ON TABLE public.password_reset_tokens IS 'Stores tokens for password reset requests. Tokens expire after 1 hour.';
COMMENT ON FUNCTION public.cleanup_expired_email_tokens() IS 'Cleans up expired and used tokens. Should be run periodically via cron job.';

COMMENT ON COLUMN public.email_confirmation_tokens.token IS 'Unique token sent via email for confirmation. Generated using crypto.randomBytes.';
COMMENT ON COLUMN public.email_confirmation_tokens.expires_at IS 'Token expiration time. Default: 24 hours from creation.';
COMMENT ON COLUMN public.email_confirmation_tokens.confirmed_at IS 'Timestamp when user confirmed their email. NULL if not confirmed yet.';

COMMENT ON COLUMN public.password_reset_tokens.token IS 'Unique token sent via email for password reset. Generated using crypto.randomBytes.';
COMMENT ON COLUMN public.password_reset_tokens.expires_at IS 'Token expiration time. Default: 1 hour from creation.';
COMMENT ON COLUMN public.password_reset_tokens.used_at IS 'Timestamp when token was used to reset password. NULL if not used yet.';

