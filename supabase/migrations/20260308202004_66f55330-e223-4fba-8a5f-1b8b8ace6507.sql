
-- Conecta Notifications table
CREATE TABLE IF NOT EXISTS public.conecta_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  reference_id uuid,
  reference_type text,
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conecta_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.conecta_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.conecta_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_conecta_notifications_user ON public.conecta_notifications(user_id, read, created_at DESC);

-- Conecta Helpdesk Posts table
CREATE TABLE IF NOT EXISTS public.conecta_helpdesk_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'geral',
  status text NOT NULL DEFAULT 'aberto',
  priority text NOT NULL DEFAULT 'media',
  reply_count integer NOT NULL DEFAULT 0,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conecta_helpdesk_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view helpdesk posts"
  ON public.conecta_helpdesk_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert helpdesk posts"
  ON public.conecta_helpdesk_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own helpdesk posts"
  ON public.conecta_helpdesk_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own helpdesk posts"
  ON public.conecta_helpdesk_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Conecta Helpdesk Replies table
CREATE TABLE IF NOT EXISTS public.conecta_helpdesk_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.conecta_helpdesk_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_solution boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conecta_helpdesk_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view helpdesk replies"
  ON public.conecta_helpdesk_replies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert helpdesk replies"
  ON public.conecta_helpdesk_replies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own helpdesk replies"
  ON public.conecta_helpdesk_replies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to update reply_count and status
CREATE OR REPLACE FUNCTION update_helpdesk_reply_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.conecta_helpdesk_posts 
    SET reply_count = reply_count + 1,
        status = CASE WHEN status = 'aberto' THEN 'em_discussao' ELSE status END,
        updated_at = now()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.conecta_helpdesk_posts 
    SET reply_count = GREATEST(reply_count - 1, 0),
        updated_at = now()
    WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_helpdesk_reply_count
  AFTER INSERT OR DELETE ON public.conecta_helpdesk_replies
  FOR EACH ROW EXECUTE FUNCTION update_helpdesk_reply_count();
