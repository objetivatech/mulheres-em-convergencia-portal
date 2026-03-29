SELECT cron.schedule(
  'publish-scheduled-blog-posts',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/publish-scheduled-posts',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncXltYmphdGVueHp0cmpqZHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDg5MDcsImV4cCI6MjA3MDY4NDkwN30.8CVsfliWGJiXjrCxkF28L9af_VPwnBZHipxfo76kgOQ"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);