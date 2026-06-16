-- A/B variant for the switcher "free data import" success-page offer test
-- (PostHog flag `switcher-data-import-offer`). Written once per switcher session
-- when the flag is resolved at the Q2 answer: 'test' (success page shows the
-- data-import promise instead of "Free Instagram ads") | 'control' (current
-- offer). Independent of switcher_screen_variant. Null for non-switchers and
-- sessions that pre-date the test.
alter table public.leads
  add column data_import_offer_variant text;
