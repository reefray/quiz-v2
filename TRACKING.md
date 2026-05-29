# Quiz tracking — setup notes

Three independent pieces (see `lib/analytics.ts`, `lib/leads.ts`, `components/PostHogInit.tsx`, `components/MetaPixel.tsx`). All keys live in `.env.local` (gitignored).

## Live now (verified)
- **PostHog** (EU host) — funnel events fire: `quiz_started`, `step_completed`
  (with `step_number`, `step_name`, `seconds_on_step`, `booking_method`,
  `headache`), `handle_claimed`, `email_captured`, `quiz_completed`,
  `store_cta_clicked`. `session_id` stitches the journey; email is set as a
  person property (kept off the event stream).
- **Meta Pixel** — `PageView` on load + a funnel-step **event ladder** (each
  fires once per session). `Lead` is the standard event (advanced matching:
  plain email → Meta SHA-256 hashes it client-side); the rest are custom events:

  | Event | Fires when |
  |---|---|
  | `QuizStarted` | landed on Q1 |
  | `QuizQ1Answered` | picked booking method (→ Q2) — "took first action" |
  | `QuizQ2Answered` | picked a headache (→ reveal) |
  | `HandleClaimed` | claim link tapped |
  | `Lead` *(standard)* | email submitted — **primary** optimisation target |
  | `QuizCompleted` | success / locked-in screen |
  | `AppDownloadClicked` | download button tapped |

  Advanced matching set at `Lead` carries to the later events (`QuizCompleted`,
  `AppDownloadClicked`), so those are email-matched too.

  **Optimisation laddering:** launch on `Lead`. If lead volume per ad set is well
  below ~50/week, move the ad set's optimisation event *earlier*
  (`HandleClaimed` → `QuizQ2Answered`). If leads are over-supplied, move *deeper*
  (`AppDownloadClicked`). To optimise on a **custom** event you must first create
  a one-click **Custom Conversion** in Events Manager (standard `Lead` skips this).
  Meta caps **8 prioritised events per domain** (AEM/iOS) — this ladder is 7, so
  rank `Lead` highest and you have one slot spare.

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
