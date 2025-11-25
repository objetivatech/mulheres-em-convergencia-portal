-- Tabela para armazenar contas sociais conectadas
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'pinterest', 'google_business')),
  account_name TEXT,
  account_email TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  platform_user_id TEXT,
  platform_page_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform, platform_user_id)
);

-- Tabela para posts publicados/agendados
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  platforms TEXT[] NOT NULL,
  media_urls TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  platform_post_ids JSONB DEFAULT '{}'::jsonb,
  platform_responses JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  is_republish BOOLEAN DEFAULT false,
  republish_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_platform ON social_accounts(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_accounts_active ON social_accounts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_for) WHERE status = 'scheduled';

-- RLS Policies para social_accounts
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own social accounts"
  ON social_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own social accounts"
  ON social_accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own social accounts"
  ON social_accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own social accounts"
  ON social_accounts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all social accounts"
  ON social_accounts FOR SELECT
  TO authenticated
  USING (get_current_user_admin_status());

-- RLS Policies para social_posts
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own social posts"
  ON social_posts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own social posts"
  ON social_posts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own social posts"
  ON social_posts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own social posts"
  ON social_posts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all social posts"
  ON social_posts FOR ALL
  TO authenticated
  USING (get_current_user_admin_status());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_social_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();

CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();