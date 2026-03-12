
-- Fix: conecta_profiles PK is 'id', not 'user_id'
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
  
  FOR user_record IN SELECT id FROM conecta_profiles
  LOOP
    PERFORM conecta_update_monthly_points(user_record.id, target_month);
    processed := processed + 1;
  END LOOP;
  
  RETURN processed;
END;
$$;

-- Fix: conecta_update_monthly_points profile sync uses 'id' not 'user_id'
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
  
  INSERT INTO conecta_monthly_points (user_id, team_id, year_month, points, rank, updated_at)
  VALUES (_user_id, NULL, current_month, new_points, new_rank, now())
  ON CONFLICT (user_id, COALESCE(team_id, '00000000-0000-0000-0000-000000000000'::uuid), year_month) 
  DO UPDATE SET points = EXCLUDED.points, rank = EXCLUDED.rank, updated_at = now();
  
  -- Sync conecta_profiles (PK is 'id')
  UPDATE conecta_profiles 
  SET points = new_points, rank = new_rank, updated_at = now()
  WHERE id = _user_id;
END;
$$;
