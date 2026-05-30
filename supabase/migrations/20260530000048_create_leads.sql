-- Barbr quiz — progressively-captured leads.
-- One row per quiz session (session_id), upserted as the user advances. All
-- writes go through Next.js API routes using the service_role key (which
-- bypasses RLS); the browser never touches this table. RLS is enabled with NO
-- anon policies, so the publishable/anon key can neither read nor write.

create table public.leads (
  id               uuid primary key default gen_random_uuid(),
  session_id       text unique not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  booking_method   text,        -- dms | booksy | fresha | paper | other
  other_system     text,
  headache         text,
  handle           text,
  email            text,
  fbclid           text,
  reached_success  boolean not null default false,
  clicked_download boolean not null default false,
  download_store   text,        -- ios | android
  answers          jsonb,
  user_agent       text
);

-- Global handle uniqueness (drives the 23505 "handle_taken" path on the claim step).
create unique index leads_handle_lower_idx on public.leads (lower(handle)) where handle is not null;

alter table public.leads enable row level security;
-- no anon policies: all access is server-side via service_role (which bypasses RLS)

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
  begin new.updated_at = now(); return new; end; $$;

create trigger leads_set_updated_at before update on public.leads
  for each row execute function public.set_updated_at();
