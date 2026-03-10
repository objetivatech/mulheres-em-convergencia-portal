
-- =====================================================
-- CONECTA+ Parcerias entre membros
-- =====================================================

CREATE TABLE public.conecta_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_a_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_b_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'servico',
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT different_partners CHECK (partner_a_id != partner_b_id)
);

ALTER TABLE public.conecta_partnerships ENABLE ROW LEVEL SECURITY;

-- Members can see all partnerships
CREATE POLICY "Authenticated users can view partnerships"
  ON public.conecta_partnerships FOR SELECT
  TO authenticated USING (true);

-- Users can create partnerships where they are partner_a
CREATE POLICY "Users can create partnerships"
  ON public.conecta_partnerships FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = partner_a_id);

-- Partner A can delete their partnership
CREATE POLICY "Partner A can delete"
  ON public.conecta_partnerships FOR DELETE
  TO authenticated USING (auth.uid() = partner_a_id);

-- =====================================================
-- Trigger: +15 pts for both partners on new partnership
-- =====================================================

CREATE OR REPLACE FUNCTION conecta_handle_partnership_insert()
RETURNS TRIGGER AS $$
DECLARE
  user_a_name TEXT;
  user_b_name TEXT;
  _year_month TEXT;
BEGIN
  SELECT full_name INTO user_a_name FROM profiles WHERE id = NEW.partner_a_id;
  SELECT full_name INTO user_b_name FROM profiles WHERE id = NEW.partner_b_id;
  
  _year_month := conecta_get_year_month_from_date(NEW.created_at::date);
  
  -- Add to activity feed
  PERFORM conecta_add_activity_feed(
    NEW.partner_a_id,
    'partnership',
    COALESCE(user_a_name, 'Membro') || ' e ' || COALESCE(user_b_name, 'Membro') || ' formaram uma nova parceria: ' || NEW.title,
    COALESCE(NEW.description, ''),
    NEW.id
  );
  
  -- Recalculate points for both
  PERFORM conecta_update_all_user_points(NEW.partner_a_id, _year_month);
  PERFORM conecta_update_all_user_points(NEW.partner_b_id, _year_month);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_conecta_partnership_insert
  AFTER INSERT ON conecta_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION conecta_handle_partnership_insert();

-- =====================================================
-- Update points calculation to include partnerships (+15 pts each)
-- =====================================================

CREATE OR REPLACE FUNCTION conecta_calculate_monthly_points(
  _user_id UUID,
  _team_id UUID,
  _year_month TEXT
) RETURNS INTEGER AS $$
DECLARE
  total_points INTEGER := 0;
  cnt INTEGER;
  deals_value NUMERIC;
BEGIN
  -- 1-a-1: 25 pts
  SELECT COUNT(*) INTO cnt FROM conecta_one_on_ones
  WHERE user_id = _user_id AND conecta_get_year_month_from_date(meeting_date) = _year_month;
  total_points := total_points + (cnt * 25);
  
  -- Depoimentos enviados: 15 pts
  SELECT COUNT(*) INTO cnt FROM conecta_testimonials
  WHERE from_user_id = _user_id AND conecta_get_year_month_from_date(created_at::date) = _year_month;
  total_points := total_points + (cnt * 15);
  
  -- Negócios: 5 pts por R$100
  SELECT COALESCE(SUM(value), 0) INTO deals_value FROM conecta_business_deals
  WHERE closed_by_user_id = _user_id AND conecta_get_year_month_from_date(deal_date) = _year_month;
  total_points := total_points + (FLOOR(deals_value / 100)::INTEGER * 5);
  
  -- Indicações enviadas: 20 pts
  SELECT COUNT(*) INTO cnt FROM conecta_referrals
  WHERE from_user_id = _user_id AND conecta_get_year_month_from_date(created_at::date) = _year_month;
  total_points := total_points + (cnt * 20);
  
  -- Presenças: 20 pts
  SELECT COUNT(*) INTO cnt FROM conecta_attendances a
  JOIN conecta_meetings m ON m.id = a.meeting_id
  WHERE a.user_id = _user_id
    AND conecta_get_year_month_from_date(m.meeting_date) = _year_month
    AND (m.team_id = _team_id OR m.team_id IS NULL);
  total_points := total_points + (cnt * 20);
  
  -- Convites aceitos presentes: 15 pts
  SELECT COUNT(DISTINCT a.user_id) INTO cnt FROM conecta_attendances a
  JOIN conecta_invitations i ON i.accepted_by = a.user_id
  JOIN conecta_meetings m ON m.id = a.meeting_id
  WHERE i.invited_by = _user_id
    AND i.status = 'accepted'
    AND conecta_get_year_month_from_date(m.meeting_date) = _year_month;
  total_points := total_points + (cnt * 15);
  
  -- Respostas no Conselho 24/7: 5 pts
  SELECT COUNT(*) INTO cnt FROM conecta_helpdesk_replies r
  JOIN conecta_helpdesk_posts p ON p.id = r.post_id
  WHERE r.user_id = _user_id
    AND r.user_id != p.user_id
    AND conecta_get_year_month_from_date(r.created_at::date) = _year_month;
  total_points := total_points + (cnt * 5);
  
  -- Parcerias: 15 pts (como partner_a ou partner_b)
  SELECT COUNT(*) INTO cnt FROM conecta_partnerships
  WHERE (partner_a_id = _user_id OR partner_b_id = _user_id)
    AND conecta_get_year_month_from_date(created_at::date) = _year_month;
  total_points := total_points + (cnt * 15);
  
  RETURN total_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
