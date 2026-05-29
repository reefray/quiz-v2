-- Barbr quiz — leads table (insert-only from the browser via anon key).
-- Drop-off analytics live in PostHog; this stores completed leads only.
-- Run in the Supabase SQL editor (or `supabase db push`).

create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  session_id      text,
  booking_method  text,
  headache        text,
  handle          text,
  email           text,
  fbclid          text,
  answers         jsonb,          -- full answer object, room to grow
  user_agent      text
);

-- Best-effort web-side handle uniqueness (drives the 23505 "pick another" path).
create unique index if not exists leads_handle_lower_idx on public.leads (lower(handle));

-- RLS: anonymous INSERT only. No SELECT policy => emails are not readable via the anon key.
alter table public.leads enable row level security;

drop policy if exists "anon insert leads" on public.leads;
create policy "anon insert leads"
  on public.leads for insert
  to anon
  with check (true);

-- Optional: real-ish availability check without exposing the table.
create or replace function public.is_handle_available(p_handle text)
returns boolean language sql security definer set search_path = public as $$
  select not exists (select 1 from public.leads where lower(handle) = lower(p_handle));
$$;
grant execute on public.is_handle_available(text) to anon;
