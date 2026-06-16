-- A/B variant for the switcher migration-screen test (PostHog flag
-- `switcher-migration-screen`). Written once per switcher session when the
-- flag is resolved at the Q2 answer: 'test' (screen shown) | 'control'
-- (current flow). Null for non-switchers and sessions that pre-date the test.
alter table public.leads
  add column switcher_screen_variant text;
