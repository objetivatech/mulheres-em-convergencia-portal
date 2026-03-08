-- ============================================================================
-- CONECTA+ - Ambiente de Networking Integrado ao Portal MeC
-- Etapa 1: Infraestrutura de Banco de Dados
-- ============================================================================

-- 1. Enums
CREATE TYPE public.conecta_role AS ENUM ('admin', 'facilitadora', 'membro', 'convidado');
CREATE TYPE public.conecta_rank AS ENUM ('iniciante', 'bronze', 'prata', 'ouro', 'diamante');

-- 2. Perfis CONECTA+ (extensão do profile existente, não substitui)
CREATE TABLE public.conecta_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  conecta_role conecta_role NOT NULL DEFAULT 'convidado',
  rank conecta_rank NOT NULL DEFAULT 'iniciante',
  points INTEGER NOT NULL DEFAULT 0,
  company TEXT,
  position TEXT,
  bio TEXT,
  phone TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  website_url TEXT,
  birthday DATE,
  slug TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  banner_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Grupos/Equipes
CREATE TABLE public.conecta_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#C75A92',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Membros de grupo
CREATE TABLE public.conecta_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.conecta_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_facilitator BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

-- 5. Encontros
CREATE TABLE public.conecta_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.conecta_teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_date DATE NOT NULL,
  meeting_time TIME,
  location TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Presenças
CREATE TABLE public.conecta_attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.conecta_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, user_id)
);

-- 7. Reuniões 1-a-1
CREATE TABLE public.conecta_one_on_ones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('membro', 'convidado')),
  guest_name TEXT,
  guest_company TEXT,
  notes TEXT,
  photo_url TEXT,
  meeting_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Depoimentos
CREATE TABLE public.conecta_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Negócios Realizados
CREATE TABLE public.conecta_business_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closed_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_name TEXT,
  description TEXT,
  value DECIMAL(12,2) NOT NULL DEFAULT 0,
  deal_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Indicações
CREATE TABLE public.conecta_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Convites
CREATE TABLE public.conecta_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  email VARCHAR(255),
  name VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  accepted_by UUID REFERENCES public.profiles(id),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- 12. Conteúdos
CREATE TABLE public.conecta_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'documento', 'artigo', 'link')),
  url TEXT,
  thumbnail_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Feed de Atividades
CREATE TABLE public.conecta_activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  reference_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Pontuação Mensal
CREATE TABLE public.conecta_monthly_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.conecta_teams(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  rank conecta_rank NOT NULL DEFAULT 'iniciante',
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, team_id, year_month)
);

-- 15. Histórico de Pontos
CREATE TABLE public.conecta_points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.conecta_teams(id) ON DELETE SET NULL,
  year_month TEXT,
  points_change INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================
CREATE INDEX idx_conecta_profiles_slug ON public.conecta_profiles(slug);
CREATE INDEX idx_conecta_profiles_role ON public.conecta_profiles(conecta_role);
CREATE INDEX idx_conecta_team_members_user ON public.conecta_team_members(user_id);
CREATE INDEX idx_conecta_team_members_team ON public.conecta_team_members(team_id);
CREATE INDEX idx_conecta_meetings_date ON public.conecta_meetings(meeting_date);
CREATE INDEX idx_conecta_meetings_team ON public.conecta_meetings(team_id);
CREATE INDEX idx_conecta_attendances_meeting ON public.conecta_attendances(meeting_id);
CREATE INDEX idx_conecta_attendances_user ON public.conecta_attendances(user_id);
CREATE INDEX idx_conecta_one_on_ones_user ON public.conecta_one_on_ones(user_id);
CREATE INDEX idx_conecta_one_on_ones_date ON public.conecta_one_on_ones(meeting_date);
CREATE INDEX idx_conecta_activity_feed_user ON public.conecta_activity_feed(user_id);
CREATE INDEX idx_conecta_activity_feed_created ON public.conecta_activity_feed(created_at DESC);
CREATE INDEX idx_conecta_monthly_points_team_month ON public.conecta_monthly_points(team_id, year_month);
CREATE INDEX idx_conecta_monthly_points_user ON public.conecta_monthly_points(user_id);
CREATE INDEX idx_conecta_invitations_code ON public.conecta_invitations(code);
CREATE INDEX idx_conecta_invitations_invited_by ON public.conecta_invitations(invited_by);

-- ============================================================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================================
ALTER TABLE public.conecta_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conecta_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conecta_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conecta_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conecta_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conecta_one_on_ones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conecta_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conecta_business_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conecta_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conecta_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conecta_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conecta_activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conecta_monthly_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conecta_points_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FUNÇÕES AUXILIARES CONECTA+
-- ============================================================================

CREATE OR REPLACE FUNCTION public.conecta_is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND is_admin = true
  )
$$;

CREATE OR REPLACE FUNCTION public.conecta_is_team_facilitator(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conecta_team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND is_facilitator = true
  )
$$;

CREATE OR REPLACE FUNCTION public.conecta_are_same_team(_user_id1 UUID, _user_id2 UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conecta_team_members tm1
    INNER JOIN public.conecta_team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = _user_id1
    AND tm2.user_id = _user_id2
  )
$$;

CREATE OR REPLACE FUNCTION public.conecta_get_current_year_month()
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT to_char(now(), 'YYYY-MM');
$$;

CREATE OR REPLACE FUNCTION public.conecta_get_year_month_from_date(d DATE)
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT to_char(d, 'YYYY-MM');
$$;

CREATE OR REPLACE FUNCTION public.conecta_get_rank_from_points(_points INTEGER)
RETURNS conecta_rank
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF _points >= 1000 THEN RETURN 'diamante';
  ELSIF _points >= 500 THEN RETURN 'ouro';
  ELSIF _points >= 200 THEN RETURN 'prata';
  ELSIF _points >= 50 THEN RETURN 'bronze';
  ELSE RETURN 'iniciante';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.conecta_calculate_monthly_points(
  _user_id UUID, _team_id UUID, _year_month TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_points INTEGER := 0;
  cnt INTEGER;
  deals_value NUMERIC;
BEGIN
  SELECT COUNT(*) INTO cnt FROM conecta_one_on_ones WHERE user_id = _user_id AND conecta_get_year_month_from_date(meeting_date) = _year_month;
  total_points := total_points + (cnt * 25);
  
  SELECT COUNT(*) INTO cnt FROM conecta_testimonials WHERE from_user_id = _user_id AND conecta_get_year_month_from_date(created_at::date) = _year_month;
  total_points := total_points + (cnt * 15);
  
  SELECT COALESCE(SUM(value), 0) INTO deals_value FROM conecta_business_deals WHERE closed_by_user_id = _user_id AND conecta_get_year_month_from_date(deal_date) = _year_month;
  total_points := total_points + (FLOOR(deals_value / 100)::INTEGER * 5);
  
  SELECT COUNT(*) INTO cnt FROM conecta_referrals WHERE from_user_id = _user_id AND conecta_get_year_month_from_date(created_at::date) = _year_month;
  total_points := total_points + (cnt * 20);
  
  SELECT COUNT(*) INTO cnt FROM conecta_attendances a JOIN conecta_meetings m ON m.id = a.meeting_id WHERE a.user_id = _user_id AND conecta_get_year_month_from_date(m.meeting_date) = _year_month AND (m.team_id = _team_id OR m.team_id IS NULL);
  total_points := total_points + (cnt * 20);
  
  SELECT COUNT(DISTINCT a.user_id) INTO cnt FROM conecta_attendances a JOIN conecta_invitations i ON i.accepted_by = a.user_id JOIN conecta_meetings m ON m.id = a.meeting_id WHERE i.invited_by = _user_id AND i.status = 'accepted' AND conecta_get_year_month_from_date(m.meeting_date) = _year_month;
  total_points := total_points + (cnt * 15);
  
  RETURN total_points;
END;
$$;

CREATE OR REPLACE FUNCTION public.conecta_update_monthly_points(
  _user_id UUID, _team_id UUID, _year_month TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month TEXT;
  new_points INTEGER;
  new_rank conecta_rank;
BEGIN
  current_month := COALESCE(_year_month, conecta_get_current_year_month());
  new_points := conecta_calculate_monthly_points(_user_id, _team_id, current_month);
  new_rank := conecta_get_rank_from_points(new_points);
  
  INSERT INTO conecta_monthly_points (user_id, team_id, year_month, points, rank, updated_at)
  VALUES (_user_id, _team_id, current_month, new_points, new_rank, now())
  ON CONFLICT (user_id, team_id, year_month) 
  DO UPDATE SET points = EXCLUDED.points, rank = EXCLUDED.rank, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.conecta_update_all_user_points(
  _user_id UUID, _year_month TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  team_record RECORD;
BEGIN
  FOR team_record IN SELECT team_id FROM conecta_team_members WHERE user_id = _user_id
  LOOP
    PERFORM conecta_update_monthly_points(_user_id, team_record.team_id, _year_month);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.conecta_get_monthly_ranking(
  _team_id UUID DEFAULT NULL, _year_month TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID, full_name TEXT, avatar_url TEXT, company TEXT, member_position TEXT,
  team_id UUID, team_name TEXT, points INTEGER, rank conecta_rank, position_rank BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE current_month TEXT;
BEGIN
  current_month := COALESCE(_year_month, conecta_get_current_year_month());
  RETURN QUERY
  SELECT mp.user_id, p.full_name, p.avatar_url, cp.company, cp.position as member_position,
    mp.team_id, t.name as team_name, mp.points, mp.rank,
    ROW_NUMBER() OVER (ORDER BY mp.points DESC) as position_rank
  FROM conecta_monthly_points mp
  JOIN profiles p ON p.id = mp.user_id
  LEFT JOIN conecta_profiles cp ON cp.id = mp.user_id
  JOIN conecta_teams t ON t.id = mp.team_id
  WHERE mp.year_month = current_month AND (_team_id IS NULL OR mp.team_id = _team_id)
  ORDER BY mp.points DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.conecta_add_activity_feed(
  _user_id UUID, _activity_type TEXT, _title TEXT,
  _description TEXT DEFAULT NULL, _reference_id UUID DEFAULT NULL, _metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id UUID;
BEGIN
  INSERT INTO conecta_activity_feed (user_id, activity_type, title, description, reference_id, metadata)
  VALUES (_user_id, _activity_type, _title, _description, _reference_id, _metadata)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.conecta_accept_invitation(_code VARCHAR, _user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE invitation_record RECORD;
BEGIN
  SELECT * INTO invitation_record FROM conecta_invitations WHERE code = _code AND status = 'pending' AND expires_at > now();
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Convite inválido ou expirado'); END IF;
  UPDATE conecta_invitations SET status = 'accepted', accepted_by = _user_id, accepted_at = now() WHERE id = invitation_record.id;
  PERFORM conecta_add_activity_feed(invitation_record.invited_by, 'invitation', 'Novo membro através de convite', 'Convite aceito', invitation_record.id);
  RETURN jsonb_build_object('success', true, 'invited_by', invitation_record.invited_by);
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.conecta_handle_one_on_one_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_name TEXT;
BEGIN
  SELECT full_name INTO user_name FROM profiles WHERE id = NEW.user_id;
  PERFORM conecta_add_activity_feed(NEW.user_id, 'one_on_one', COALESCE(user_name, 'Membro') || ' registrou uma reunião 1-a-1', CASE WHEN NEW.partner_id IS NOT NULL THEN 'Reunião com membro' ELSE 'Reunião com convidado: ' || COALESCE(NEW.guest_name, 'Não informado') END, NEW.id);
  PERFORM conecta_update_all_user_points(NEW.user_id, conecta_get_year_month_from_date(NEW.meeting_date));
  RETURN NEW;
END;
$$;
CREATE TRIGGER conecta_on_one_on_one_insert AFTER INSERT ON conecta_one_on_ones FOR EACH ROW EXECUTE FUNCTION conecta_handle_one_on_one_insert();

CREATE OR REPLACE FUNCTION public.conecta_handle_testimonial_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE from_name TEXT; to_name TEXT;
BEGIN
  SELECT full_name INTO from_name FROM profiles WHERE id = NEW.from_user_id;
  SELECT full_name INTO to_name FROM profiles WHERE id = NEW.to_user_id;
  PERFORM conecta_add_activity_feed(NEW.from_user_id, 'testimonial', COALESCE(from_name, 'Membro') || ' enviou um depoimento para ' || COALESCE(to_name, 'Membro'), LEFT(NEW.content, 100), NEW.id);
  PERFORM conecta_update_all_user_points(NEW.from_user_id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER conecta_on_testimonial_insert AFTER INSERT ON conecta_testimonials FOR EACH ROW EXECUTE FUNCTION conecta_handle_testimonial_insert();

CREATE OR REPLACE FUNCTION public.conecta_handle_business_deal_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE closer_name TEXT;
BEGIN
  SELECT full_name INTO closer_name FROM profiles WHERE id = NEW.closed_by_user_id;
  PERFORM conecta_add_activity_feed(NEW.closed_by_user_id, 'business_deal', COALESCE(closer_name, 'Membro') || ' fechou um negócio de R$ ' || TO_CHAR(NEW.value, 'FM999G999G999D00'), NULL, NEW.id, jsonb_build_object('value', NEW.value));
  PERFORM conecta_update_all_user_points(NEW.closed_by_user_id, conecta_get_year_month_from_date(NEW.deal_date));
  RETURN NEW;
END;
$$;
CREATE TRIGGER conecta_on_business_deal_insert AFTER INSERT ON conecta_business_deals FOR EACH ROW EXECUTE FUNCTION conecta_handle_business_deal_insert();

CREATE OR REPLACE FUNCTION public.conecta_handle_referral_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE from_name TEXT; to_name TEXT;
BEGIN
  SELECT full_name INTO from_name FROM profiles WHERE id = NEW.from_user_id;
  SELECT full_name INTO to_name FROM profiles WHERE id = NEW.to_user_id;
  PERFORM conecta_add_activity_feed(NEW.from_user_id, 'referral', COALESCE(from_name, 'Membro') || ' indicou um contato para ' || COALESCE(to_name, 'Membro'), 'Contato: ' || NEW.contact_name, NEW.id);
  PERFORM conecta_update_all_user_points(NEW.from_user_id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER conecta_on_referral_insert AFTER INSERT ON conecta_referrals FOR EACH ROW EXECUTE FUNCTION conecta_handle_referral_insert();

CREATE OR REPLACE FUNCTION public.conecta_handle_attendance_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_name TEXT; meeting_title TEXT; mtg_date DATE;
BEGIN
  SELECT full_name INTO user_name FROM profiles WHERE id = NEW.user_id;
  SELECT title, meeting_date INTO meeting_title, mtg_date FROM conecta_meetings WHERE id = NEW.meeting_id;
  PERFORM conecta_add_activity_feed(NEW.user_id, 'attendance', COALESCE(user_name, 'Membro') || ' confirmou presença', 'Encontro: ' || COALESCE(meeting_title, ''), NEW.id);
  PERFORM conecta_update_all_user_points(NEW.user_id, conecta_get_year_month_from_date(mtg_date));
  RETURN NEW;
END;
$$;
CREATE TRIGGER conecta_on_attendance_insert AFTER INSERT ON conecta_attendances FOR EACH ROW EXECUTE FUNCTION conecta_handle_attendance_insert();

CREATE OR REPLACE FUNCTION public.conecta_update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER conecta_profiles_updated_at BEFORE UPDATE ON conecta_profiles FOR EACH ROW EXECUTE FUNCTION conecta_update_updated_at();
CREATE TRIGGER conecta_teams_updated_at BEFORE UPDATE ON conecta_teams FOR EACH ROW EXECUTE FUNCTION conecta_update_updated_at();
CREATE TRIGGER conecta_contents_updated_at BEFORE UPDATE ON conecta_contents FOR EACH ROW EXECUTE FUNCTION conecta_update_updated_at();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

CREATE POLICY "conecta_profiles_select" ON conecta_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "conecta_profiles_update_own" ON conecta_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "conecta_profiles_insert_own" ON conecta_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "conecta_profiles_admin" ON conecta_profiles FOR ALL TO authenticated USING (conecta_is_admin(auth.uid()));

CREATE POLICY "conecta_teams_select" ON conecta_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "conecta_teams_admin" ON conecta_teams FOR ALL TO authenticated USING (conecta_is_admin(auth.uid()));

CREATE POLICY "conecta_team_members_select" ON conecta_team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "conecta_team_members_admin" ON conecta_team_members FOR ALL TO authenticated USING (conecta_is_admin(auth.uid()));
CREATE POLICY "conecta_team_members_facilitator_insert" ON conecta_team_members FOR INSERT TO authenticated WITH CHECK (conecta_is_team_facilitator(auth.uid(), team_id));

CREATE POLICY "conecta_meetings_select" ON conecta_meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "conecta_meetings_admin" ON conecta_meetings FOR ALL TO authenticated USING (conecta_is_admin(auth.uid()));

CREATE POLICY "conecta_attendances_select" ON conecta_attendances FOR SELECT TO authenticated USING (true);
CREATE POLICY "conecta_attendances_insert_own" ON conecta_attendances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "conecta_attendances_delete_own" ON conecta_attendances FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "conecta_attendances_admin" ON conecta_attendances FOR ALL TO authenticated USING (conecta_is_admin(auth.uid()));

CREATE POLICY "conecta_one_on_ones_select" ON conecta_one_on_ones FOR SELECT TO authenticated USING (true);
CREATE POLICY "conecta_one_on_ones_insert_own" ON conecta_one_on_ones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "conecta_one_on_ones_update_own" ON conecta_one_on_ones FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "conecta_one_on_ones_delete_own" ON conecta_one_on_ones FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "conecta_testimonials_select" ON conecta_testimonials FOR SELECT TO authenticated USING (true);
CREATE POLICY "conecta_testimonials_insert_own" ON conecta_testimonials FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "conecta_testimonials_update_own" ON conecta_testimonials FOR UPDATE TO authenticated USING (auth.uid() = from_user_id);
CREATE POLICY "conecta_testimonials_delete_own" ON conecta_testimonials FOR DELETE TO authenticated USING (auth.uid() = from_user_id);

CREATE POLICY "conecta_business_deals_select" ON conecta_business_deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "conecta_business_deals_insert_own" ON conecta_business_deals FOR INSERT TO authenticated WITH CHECK (auth.uid() = closed_by_user_id);
CREATE POLICY "conecta_business_deals_update_own" ON conecta_business_deals FOR UPDATE TO authenticated USING (auth.uid() = closed_by_user_id);
CREATE POLICY "conecta_business_deals_delete_own" ON conecta_business_deals FOR DELETE TO authenticated USING (auth.uid() = closed_by_user_id);

CREATE POLICY "conecta_referrals_select" ON conecta_referrals FOR SELECT TO authenticated USING (true);
CREATE POLICY "conecta_referrals_insert_own" ON conecta_referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "conecta_referrals_update_own" ON conecta_referrals FOR UPDATE TO authenticated USING (auth.uid() = from_user_id);
CREATE POLICY "conecta_referrals_delete_own" ON conecta_referrals FOR DELETE TO authenticated USING (auth.uid() = from_user_id);

CREATE POLICY "conecta_invitations_select" ON conecta_invitations FOR SELECT TO authenticated USING (true);
CREATE POLICY "conecta_invitations_insert_own" ON conecta_invitations FOR INSERT TO authenticated WITH CHECK (auth.uid() = invited_by);
CREATE POLICY "conecta_invitations_update_own" ON conecta_invitations FOR UPDATE TO authenticated USING (auth.uid() = invited_by);
CREATE POLICY "conecta_invitations_admin" ON conecta_invitations FOR ALL TO authenticated USING (conecta_is_admin(auth.uid()));

CREATE POLICY "conecta_contents_select" ON conecta_contents FOR SELECT TO authenticated USING (true);
CREATE POLICY "conecta_contents_admin" ON conecta_contents FOR ALL TO authenticated USING (conecta_is_admin(auth.uid()));

CREATE POLICY "conecta_activity_feed_select" ON conecta_activity_feed FOR SELECT TO authenticated USING (true);
CREATE POLICY "conecta_activity_feed_insert" ON conecta_activity_feed FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conecta_monthly_points_select" ON conecta_monthly_points FOR SELECT TO authenticated USING (true);

CREATE POLICY "conecta_points_history_select" ON conecta_points_history FOR SELECT TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE conecta_activity_feed;
ALTER TABLE conecta_activity_feed REPLICA IDENTITY FULL