-- Slack lead notifications. Stores the parent Slack message `ts` for each quiz
-- session so every funnel milestone (quiz start → Q1 → email → download) is
-- posted as a reply in ONE thread instead of four loose messages. Written
-- server-side only (service_role, via /api/lead); never client-exposed and not
-- in the funnel's ALLOWED write set.
alter table public.leads add column if not exists slack_thread_ts text;
