-- Local development only: applied by `supabase start` and `supabase db reset`.

-- Every minute, ask the local app to announce flash challenges that just
-- started. The secret must match CRON_SECRET in .env.local.
select cron.schedule(
  'flash-notifications',
  '* * * * *',
  $$
  select net.http_post(
    url := 'http://host.docker.internal:3000/api/jobs/flash-notifications',
    headers := '{"Authorization": "Bearer local-dev-cron-secret", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
