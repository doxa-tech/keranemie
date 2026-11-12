-- Extensions for the scheduled flash challenge notifications: pg_cron runs
-- a job every minute, pg_net lets it call the app over HTTP.
-- The job itself is scheduled per environment, because it needs the app URL
-- and its secret (see supabase/seed.sql for local development).
CREATE EXTENSION IF NOT EXISTS pg_cron;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
