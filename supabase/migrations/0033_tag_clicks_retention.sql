-- C-2 from audit 2026-05-13.
--
-- tag_clicks stores visitor country + user-agent + referrer for fraud-
-- detection on affiliate-style links. Under GDPR these are PII (combined
-- they fingerprint a visitor). Retain for 90 days, then drop.
--
-- Implementation: pg_cron job runs every day at 01:15 UTC and deletes any
-- row with clicked_at < now() - 90 days.
--
-- pg_cron is a Supabase-provided extension. Enable it once at Supabase
-- Dashboard → Database → Extensions (or via Dashboard SQL if the role
-- has permission). This migration assumes it's already enabled; if not
-- the schedule statement throws and the migration aborts — re-run after
-- enabling.

create extension if not exists pg_cron;

-- Idempotent unschedule first so re-applying replaces an old job.
do $$
declare
  jid bigint;
begin
  for jid in select jobid from cron.job where jobname = 'tag_clicks_retention' loop
    perform cron.unschedule(jid);
  end loop;
end;
$$;

-- Daily at 01:15 UTC (≈ 03:15 CET / 02:15 CEST) — quiet hours either way.
select cron.schedule(
  'tag_clicks_retention',
  '15 1 * * *',
  'delete from public.tag_clicks where clicked_at < now() - interval ''90 days'''
);

-- Document the retention contract on the table itself so anyone querying
-- the schema sees it immediately.
comment on table public.tag_clicks is 'Affiliate click log. PII fields (visitor_country, user_agent, referrer) are retained for 90 days then purged by the tag_clicks_retention cron job.';
