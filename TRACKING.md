# Quiz tracking — setup notes

Three independent pieces (see `lib/analytics.ts`, `lib/leads.ts`, `components/PostHogInit.tsx`, `components/MetaPixel.tsx`). All keys live in `.env.local` (gitignored).

## Live now (verified)
- **PostHog** (EU host) — funnel events fire: `quiz_started`, `step_completed`
  (with `step_number`, `step_name`, `seconds_on_step`, `booking_method`,
  `headache`), `handle_claimed`, `email_captured`, `quiz_completed`,
  `store_cta_clicked`. `session_id` stitches the journey; email is set as a
  person property (kept off the event stream).
- **Meta Pixel** — `PageView` on load, `Lead` on email submit with advanced
  matching (plain email passed, Meta SHA-256 hashes it client-side).

## To finish (user, not code)
1. **Supabase** (lead storage) — currently a graceful no-op:
   - Run `supabase/migrations/0001_leads.sql` in the Supabase SQL editor.
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL=...
     NEXT_PUBLIC_SUPABASE_ANON_KEY=...
     ```
   - Restart `npm run dev`. Lead rows then write on email submit, and a taken
     handle (23505) routes the user back to re-pick.
2. **Meta Ads Manager** — set the campaign optimisation event to **`Lead`**.
3. **Verify** — PostHog → Funnels (add events in order; Breakdown by `headache`
   / `booking_method`); Meta Events Manager → Test Events (EMQ 8+ on `Lead`).

## Notes
- `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_META_PIXEL_ID` are public by design
  (client-exposed). Safe to ship.
- Restart the dev server after any `.env.local` change — Next reads it at startup.
- Phase 2 (Ritik): server-side CAPI `Lead` (hashed email + IP + `fbc` from the
  stored `fbclid` + `fbp`), deduped with the browser pixel via a shared
  `event_id`. The stored `fbclid` (localStorage) is ready for that.
