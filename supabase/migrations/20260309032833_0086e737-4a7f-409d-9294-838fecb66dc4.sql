
-- Enum for group types
CREATE TYPE public.conecta_group_type AS ENUM ('networking', 'encontro', 'mentoria', 'whatsapp');

-- Main groups table
CREATE TABLE public.conecta_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  group_type conecta_group_type NOT NULL DEFAULT 'networking',
  category TEXT, -- e.g. 'Marketing Digital', 'Finanças'
  image_url TEXT,
  external_link TEXT, -- WhatsApp/Telegram link
  max_members INT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Group members
CREATE TABLE public.conecta_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.conecta_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'moderator', 'member'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Group feed / posts
CREATE TABLE public.conecta_group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.conecta_groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Group meetings/events
CREATE TABLE public.conecta_group_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.conecta_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_date TIMESTAMPTZ NOT NULL,
  meeting_link TEXT,
  location TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conecta_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conecta_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conecta_group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conecta_group_meetings ENABLE ROW LEVEL SECURITY;

-- RLS: Groups - authenticated users can view all groups
CREATE POLICY "Authenticated users can view groups"
  ON public.conecta_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members and admins can create groups"
  ON public.conecta_groups FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creator or admin can update"
  ON public.conecta_groups FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Group creator or admin can delete"
  ON public.conecta_groups FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS: Group Members
CREATE POLICY "Authenticated can view group members"
  ON public.conecta_group_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can join groups"
  ON public.conecta_group_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave or admin can remove"
  ON public.conecta_group_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS: Group Posts
CREATE POLICY "Members can view posts"
  ON public.conecta_group_posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members can create posts"
  ON public.conecta_group_posts FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (SELECT 1 FROM public.conecta_group_members WHERE group_id = conecta_group_posts.group_id AND user_id = auth.uid())
  );

CREATE POLICY "Author or admin can update post"
  ON public.conecta_group_posts FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Author or admin can delete post"
  ON public.conecta_group_posts FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS: Group Meetings
CREATE POLICY "Authenticated can view meetings"
  ON public.conecta_group_meetings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Group members can create meetings"
  ON public.conecta_group_meetings FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM public.conecta_group_members WHERE group_id = conecta_group_meetings.group_id AND user_id = auth.uid())
  );

CREATE POLICY "Creator or admin can update meeting"
  ON public.conecta_group_meetings FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Creator or admin can delete meeting"
  ON public.conecta_group_meetings FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on groups
CREATE OR REPLACE FUNCTION public.update_conecta_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conecta_groups_timestamp
  BEFORE UPDATE ON public.conecta_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_conecta_groups_updated_at();

CREATE TRIGGER update_conecta_group_posts_timestamp
  BEFORE UPDATE ON public.conecta_group_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_conecta_groups_updated_at();
