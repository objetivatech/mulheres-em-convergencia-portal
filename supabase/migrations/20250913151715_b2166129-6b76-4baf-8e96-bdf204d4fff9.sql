-- Create a function to clean up old activity logs (12+ months)
CREATE OR REPLACE FUNCTION public.cleanup_old_activity_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete activity logs older than 12 months
  DELETE FROM user_activity_log 
  WHERE created_at < NOW() - INTERVAL '12 months';
END;
$function$;

-- Create a trigger function to automatically clean up when new activities are logged
CREATE OR REPLACE FUNCTION public.trigger_cleanup_old_activities()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Run cleanup occasionally (every 100 inserts approximately)
  IF random() < 0.01 THEN
    PERFORM cleanup_old_activity_logs();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to run cleanup occasionally on new activity inserts
DROP TRIGGER IF EXISTS cleanup_old_activities_trigger ON user_activity_log;
CREATE TRIGGER cleanup_old_activities_trigger
  AFTER INSERT ON user_activity_log
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_old_activities();