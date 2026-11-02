create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('lembretes-eventos-diario', '0 11 * * *', $$
  select net.http_post(
    'https://tysvpeprhokdijquprkd.supabase.co/functions/v1/lembretes-eventos',
    '{}'::jsonb,
    '{}'::jsonb,
    '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3ZwZXByaG9rZGlqcXVwcmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNTE0MTEsImV4cCI6MjEwMzkyNzQxMX0.GrdVZ7Xtw3dk4zy9Y29sGGAdOcx4Lq9-I--osYirHIc","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3ZwZXByaG9rZGlqcXVwcmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNTE0MTEsImV4cCI6MjEwMzkyNzQxMX0.GrdVZ7Xtw3dk4zy9Y29sGGAdOcx4Lq9-I--osYirHIc"}'::jsonb
  );
$$);