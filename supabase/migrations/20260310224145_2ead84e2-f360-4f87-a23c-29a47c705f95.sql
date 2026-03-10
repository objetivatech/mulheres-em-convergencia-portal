
-- =====================================================
-- CONECTA+ GAMIFICAÇÃO: Criar triggers para as funções existentes
-- As funções já existem mas os triggers nunca foram criados
-- =====================================================

-- Trigger: Reuniões 1-a-1
CREATE TRIGGER trg_conecta_one_on_one_insert
  AFTER INSERT ON conecta_one_on_ones
  FOR EACH ROW
  EXECUTE FUNCTION conecta_handle_one_on_one_insert();

-- Trigger: Depoimentos
CREATE TRIGGER trg_conecta_testimonial_insert
  AFTER INSERT ON conecta_testimonials
  FOR EACH ROW
  EXECUTE FUNCTION conecta_handle_testimonial_insert();

-- Trigger: Negócios
CREATE TRIGGER trg_conecta_business_deal_insert
  AFTER INSERT ON conecta_business_deals
  FOR EACH ROW
  EXECUTE FUNCTION conecta_handle_business_deal_insert();

-- Trigger: Indicações
CREATE TRIGGER trg_conecta_referral_insert
  AFTER INSERT ON conecta_referrals
  FOR EACH ROW
  EXECUTE FUNCTION conecta_handle_referral_insert();

-- Trigger: Presenças
CREATE TRIGGER trg_conecta_attendance_insert
  AFTER INSERT ON conecta_attendances
  FOR EACH ROW
  EXECUTE FUNCTION conecta_handle_attendance_insert();

-- =====================================================
-- Novo trigger: Respostas no Conselho 24/7 → +5 pts
-- Apenas quem responde (não o autor do post)
-- =====================================================

CREATE OR REPLACE FUNCTION conecta_handle_helpdesk_reply_insert()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  user_name TEXT;
  _year_month TEXT;
BEGIN
  -- Get the post author to exclude them from scoring
  SELECT user_id INTO post_author_id
  FROM conecta_helpdesk_posts
  WHERE id = NEW.post_id;

  -- Only score if the replier is NOT the post author
  IF NEW.user_id != post_author_id THEN
    SELECT full_name INTO user_name FROM profiles WHERE id = NEW.user_id;
    
    _year_month := conecta_get_year_month_from_date(NEW.created_at::date);
    
    -- Add to activity feed
    PERFORM conecta_add_activity_feed(
      NEW.user_id,
      'helpdesk_reply',
      COALESCE(user_name, 'Membro') || ' respondeu no Conselho 24/7',
      '',
      NEW.id
    );
    
    -- Recalculate points
    PERFORM conecta_update_all_user_points(NEW.user_id, _year_month);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_conecta_helpdesk_reply_insert
  AFTER INSERT ON conecta_helpdesk_replies
  FOR EACH ROW
  EXECUTE FUNCTION conecta_handle_helpdesk_reply_insert();

-- =====================================================
-- Atualizar conecta_calculate_monthly_points para incluir
-- respostas no Conselho 24/7 (+5 pts cada)
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
  
  -- Respostas no Conselho 24/7: 5 pts (excluindo respostas em posts próprios)
  SELECT COUNT(*) INTO cnt FROM conecta_helpdesk_replies r
  JOIN conecta_helpdesk_posts p ON p.id = r.post_id
  WHERE r.user_id = _user_id
    AND r.user_id != p.user_id
    AND conecta_get_year_month_from_date(r.created_at::date) = _year_month;
  total_points := total_points + (cnt * 5);
  
  RETURN total_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
