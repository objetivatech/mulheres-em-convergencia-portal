
-- Private secret storage for server-side jobs (cron etc.). Not exposed to any client role.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.app_secrets (
  name  text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON private.app_secrets FROM PUBLIC, anon, authenticated;
ALTER TABLE private.app_secrets ENABLE ROW LEVEL SECURITY;
-- No policies = no client access; only superuser/postgres/pg_cron can read.

-- Reschedule cron jobs to include the x-cron-secret header sourced from private.app_secrets.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-subscriptions-daily') THEN
    PERFORM cron.unschedule('sync-subscriptions-daily');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'deactivate-expired-daily') THEN
    PERFORM cron.unschedule('deactivate-expired-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'sync-subscriptions-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url:='https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/sync-subscription-status',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', COALESCE((SELECT value FROM private.app_secrets WHERE name = 'cron_secret'), '')
    ),
    body:='{"force": true}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'deactivate-expired-daily',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url:='https://ngqymbjatenxztrjjdxa.supabase.co/functions/v1/renew-business-subscriptions',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', COALESCE((SELECT value FROM private.app_secrets WHERE name = 'cron_secret'), '')
    ),
    body:='{}'::jsonb
  );
  $$
);
