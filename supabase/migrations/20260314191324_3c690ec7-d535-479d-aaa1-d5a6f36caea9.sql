-- Create cron job: sync subscriptions daily at 03:00 UTC
SELECT cron.schedule(
  'sync-subscriptions-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url:='https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/sync-subscription-status',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncXltYmphdGVueHp0cmpqZHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDg5MDcsImV4cCI6MjA3MDY4NDkwN30.8CVsfliWGJiXjrCxkF28L9af_VPwnBZHipxfo76kgOQ"}'::jsonb,
    body:='{"force": true}'::jsonb
  );
  $$
);

-- Create cron job: deactivate expired businesses daily at 04:00 UTC
SELECT cron.schedule(
  'deactivate-expired-daily',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url:='https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/renew-business-subscriptions',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncXltYmphdGVueHp0cmpqZHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDg5MDcsImV4cCI6MjA3MDY4NDkwN30.8CVsfliWGJiXjrCxkF28L9af_VPwnBZHipxfo76kgOQ"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);