
-- ============================================================
-- CONECTA+ Gamification Fix: Remove team dependency, fix triggers
-- ============================================================

-- 1. DROP DUPLICATE TRIGGERS (keep only trg_conecta_* versions)
DROP TRIGGER IF EXISTS conecta_on_one_on_one_insert ON conecta_one_on_ones;
DROP TRIGGER IF EXISTS conecta_on_testimonial_insert ON conecta_testimonials;
DROP TRIGGER IF EXISTS conecta_on_business_deal_insert ON conecta_business_deals;
DROP TRIGGER IF EXISTS conecta_on_referral_insert ON conecta_referrals;
DROP TRIGGER IF EXISTS conecta_on_attendance_insert ON conecta_attendances;

-- 2. Make team_id NULLABLE in conecta_monthly_points
ALTER TABLE conecta_monthly_points ALTER COLUMN team_id DROP NOT NULL;

-- 3. Drop old UNIQUE constraint and create one that handles NULL team_id
ALTER TABLE conecta_monthly_points DROP CONSTRAINT IF EXISTS conecta_monthly_points_user_id_team_id_year_month_key;
-- Use a unique index with COALESCE to handle NULL team_id
CREATE UNIQUE INDEX conecta_monthly_points_user_team_month_idx 
  ON conecta_monthly_points (user_id, COALESCE(team_id, '00000000-0000-0000-0000-000000000000'::uuid), year_month);

-- Drop FK on team_id (allow NULL without FK violation)
ALTER TABLE conecta_monthly_points DROP CONSTRAINT IF EXISTS conecta_monthly_points_team_id_fkey;

-- 4. Rewrite conecta_calculate_monthly_points WITHOUT team_id parameter
CREATE OR REPLACE FUNCTION conecta_calculate_monthly_points(_user_id UUID, _year_month TEXT)
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
  
  -- Presenças: 20 pts (ALL meetings, no team filter)
  SELECT COUNT(*) INTO cnt FROM conecta_attendances a
  JOIN conecta_meetings m ON m.id = a.meeting_id
  WHERE a.user_id = _user_id
    AND conecta_get_year_month_from_date(m.meeting_date) = _year_month;
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
  
  -- Parcerias: 15 pts
  SELECT COUNT(*) INTO cnt FROM conecta_partnerships
  WHERE (partner_a_id = _user_id OR partner_b_id = _user_id)
    AND conecta_get_year_month_from_date(created_at::date) = _year_month;
  total_points := total_points + (cnt * 15);
  
  RETURN total_points;
END;
$$;

-- 5. Rewrite conecta_update_monthly_points: global scoring + sync profile
CREATE OR REPLACE FUNCTION conecta_update_monthly_points(_user_id UUID, _year_month TEXT DEFAULT NULL)
RETURNS VOID
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
  new_points := conecta_calculate_monthly_points(_user_id, current_month);
  new_rank := conecta_get_rank_from_points(new_points);
  
  -- Upsert global monthly points (team_id = NULL)
  INSERT INTO conecta_monthly_points (user_id, team_id, year_month, points, rank, updated_at)
  VALUES (_user_id, NULL, current_month, new_points, new_rank, now())
  ON CONFLICT (user_id, COALESCE(team_id, '00000000-0000-0000-0000-000000000000'::uuid), year_month) 
  DO UPDATE SET points = EXCLUDED.points, rank = EXCLUDED.rank, updated_at = now();
  
  -- Sync conecta_profiles with current month total
  UPDATE conecta_profiles 
  SET points = new_points, rank = new_rank, updated_at = now()
  WHERE user_id = _user_id;
END;
$$;

-- 6. Simplify conecta_update_all_user_points: direct call, no team loop
CREATE OR REPLACE FUNCTION conecta_update_all_user_points(_user_id UUID, _year_month TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM conecta_update_monthly_points(_user_id, _year_month);
END;
$$;

-- 7. Create mass recalculation function
CREATE OR REPLACE FUNCTION conecta_recalculate_all_points(_year_month TEXT DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_month TEXT;
  user_record RECORD;
  processed INTEGER := 0;
BEGIN
  target_month := COALESCE(_year_month, conecta_get_current_year_month());
  
  FOR user_record IN SELECT user_id FROM conecta_profiles
  LOOP
    PERFORM conecta_update_monthly_points(user_record.user_id, target_month);
    processed := processed + 1;
  END LOOP;
  
  RETURN processed;
END;
$$;

-- 8. Fix trigger handlers that don't pass _year_month
-- conecta_handle_testimonial_insert
CREATE OR REPLACE FUNCTION conecta_handle_testimonial_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE from_name TEXT; to_name TEXT;
BEGIN
  SELECT full_name INTO from_name FROM profiles WHERE id = NEW.from_user_id;
  SELECT full_name INTO to_name FROM profiles WHERE id = NEW.to_user_id;
  PERFORM conecta_add_activity_feed(NEW.from_user_id, 'testimonial', COALESCE(from_name, 'Membro') || ' enviou um depoimento para ' || COALESCE(to_name, 'Membro'), LEFT(NEW.content, 100), NEW.id);
  PERFORM conecta_update_all_user_points(NEW.from_user_id, conecta_get_year_month_from_date(NEW.created_at::date));
  RETURN NEW;
END;
$$;

-- conecta_handle_referral_insert
CREATE OR REPLACE FUNCTION conecta_handle_referral_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE from_name TEXT; to_name TEXT;
BEGIN
  SELECT full_name INTO from_name FROM profiles WHERE id = NEW.from_user_id;
  SELECT full_name INTO to_name FROM profiles WHERE id = NEW.to_user_id;
  PERFORM conecta_add_activity_feed(NEW.from_user_id, 'referral', COALESCE(from_name, 'Membro') || ' indicou um contato para ' || COALESCE(to_name, 'Membro'), 'Contato: ' || NEW.contact_name, NEW.id);
  PERFORM conecta_update_all_user_points(NEW.from_user_id, conecta_get_year_month_from_date(NEW.created_at::date));
  RETURN NEW;
END;
$$;
