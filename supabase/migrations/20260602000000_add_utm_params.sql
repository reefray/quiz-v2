-- Capture ad attribution on the lead. UTM params are read from the landing URL
-- on quiz start (utm_source={{campaign.name}}&utm_medium={{placement}}&
-- utm_campaign={{adset.name}}&utm_content={{ad.name}}) and written with the
-- first (quiz_started) lead upsert, alongside fbclid. All nullable — organic /
-- direct visits simply leave them blank.
alter table public.leads
  add column utm_source   text,
  add column utm_medium   text,
  add column utm_campaign text,
  add column utm_content  text,
  add column utm_term     text;
