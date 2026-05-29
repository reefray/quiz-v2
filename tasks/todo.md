# Barbr Web Quiz — Build Log

## Phase 1: Brand tokens + shell (current)

- [x] Read CLAUDE.md folder rules + brand-vs-prototype split
- [x] Read prototype `reference/BarbrWebOnboardingV2.jsx` (flow/feel only)
- [x] Find + read RN onboarding shell: `Barbr-app/.../src/components/OnboardingLayout/index.tsx`
- [x] Read `ProgressDots`, `FloatingParticles`, fonts list
- [x] Scaffold Next.js (App Router, TS, Tailwind v3, Framer Motion)
- [x] Tailwind theme tokens from RN brand (colours, fonts, radii, shadows, easing, gradient)
- [x] `FloatingParticles` web port (drifting green motes)
- [x] `ProgressTrack` (prototype's bar, brand-green fill)
- [x] `QuizShell` (gradient bg + top bar [brand + back] + track + screen transition)
- [x] Demo page wiring shell with placeholder steps
- [x] Run dev server + screenshot for review  ← STOPPED for review

## Review (Phase 1)
- Brand source of truth: `Barbr-app/.../src/components/OnboardingLayout/index.tsx`
  (+ `ProgressDots`, `FloatingParticles`). Prototype dark/amber palette ignored.
- Build passes (`next build`), shell renders on-brand on mobile + desktop viewports.
- Open decisions flagged to user: progress *bar* vs RN *dots*; back button on
  right (prototype layout) vs RN's left.

## Phase 2: Real flow + shell refinements (done)
- [x] Transition → fast enter-only fade-up (~0.2s), no exit wait (snappy/conversion)
- [x] Eyebrow → super-bold (Montserrat 900 / `font-black`), accent green, no pill
- [x] Removed BARBR wordmark from top bar; back button → top-left
- [x] `lib/quizContent.ts` — prototype data verbatim (methods+icons, DM/comp
      headache branching, per-headache REVEAL, stories, taken handles)
- [x] Screens split out: BookingMethod, Headache, Reveal, Claim, Reserve, Gift,
      Success (+ shared Eyebrow, CtaButton, OptionButton)
- [x] `QuizFlow` orchestrator: state + DM-vs-competitor branching, debounced
      handle availability, 24h countdown, replay
- [x] Verified end-to-end in preview: branching, per-headache reveal copy, claim
      availability, handle/email carry-through, gift cards, success countdown

## Phase 3: Polish + dark mode (done)
- [x] Removed FloatingParticles (deleted component + import)
- [x] Dark/light toggle top-right (ThemeToggle), persists to localStorage,
      no-FOUC inline script in layout. Dark mode = prototype-style dark vibe
      (green-tinted bg, green CTA + glow) on brand greens
- [x] Theme via CSS vars (globals.css) switched by `.dark`; Tailwind tokens
      (ink/muted/faint/line/card/surface/cta-fill) read the vars
- [x] Closer to prototype: heading weight 700 (was 800) + line-height 1.12 +
      27px; 22px gutters; icon chips 38px/15px/13px; CTA 16px; type scale
- [x] Verified light + dark in preview (booking, reveal, CTA)
- Open: prototype display font is Bricolage Grotesque (we use brand Montserrat
  per CLAUDE.md) — flagged to user as an optional swap.

## Phase 4: Emojis, animations, screen polish (done)
- [x] Booking + headache options use relevant emojis (data in quizContent.ts)
- [x] Reveal: staggered fade-in (eyebrow→title→bullets→proof→CTA) + per-bullet emoji
- [x] CTA → rounded rectangle (rounded-2xl), black in BOTH modes (+ inset ring on dark)
- [x] Claim field: globe icon + bold "yourname" placeholder
- [x] Reserve: removed redundant "Email" label (mail icon in field instead)
- [x] Gift: confetti burst, "Free gift" eyebrow, "You've unlocked a free promo
      pack" title, 5 bigger promo cards sliding in from the side into a fanned
      stack (placeholder gradients — real images later), CTA "Unlock"
- [x] Success: "Username secured" + "You're in" eyebrow, link in a URL-bar
      component, green hold-timer pill (was flat), bold bullet titles, single
      "Download the app" button (smart-link — better mobile conversion than
      dual store badges)
- [x] Bug fixed: added `lib/**` to Tailwind `content` so promo gradient classes
      aren't purged; centred the absolutely-positioned promo cards
- [x] Verified light + dark across all screens

## Phase 5: VOC copy + routing (barbr-quiz-copy-UPDATED.md)
- [x] Q1: title reworded, subtitles → file, added 5th "Other" option (inline
      text field + Continue, captures `otherSystem`, does NOT auto-advance)
- [x] Track logic: COMP_METHODS = booksy/fresha/other; DMs + paper = DM track
- [x] Q2 + REVEAL: replaced all headaches + reveal map with file strings/bullets
      (every headache label has a matching REVEAL key)
- [x] Reveal: free-transfer card on competitor track only — "Coming from {X}?"
      (Booksy / Fresha / typed otherSystem / "your current app"), distinct
      accent-bordered card (not a check-row)
- [x] Claim body → file VOC copy
- [x] Verified: Other→competitor (Squire) reveal + transfer card; DM track reveal
      with no card; competitor headache list + body
- [x] tsc --noEmit clean

### ⚠️ Conflicts where the file reverted last round's choices (flagged to user)
- Gift title "Your free promo pack" (was "You've unlocked…"), CTA "Continue"
  (was "Unlock") — applied file. Kept "Free gift" eyebrow + confetti + deck.
- Success title "It's yours." (was "Username secured") — applied file. Kept URL
  bar / timer pill / single "Download the app" button.
- File says "3 graphics" but the gift deck shows 5 cards (kept per "keep gift
  step exactly") — NEEDS RECONCILING (trim deck to 3, or copy → 5).
- File lists 2 store badges; kept the single smart-link button per earlier call.

## Phase 6: Compactness + success redesign
- [x] Q1/Q2 compact: heading 27→24px (tighter LH), option cards p-3 + gap-2,
      chip 34px, label 15px; reduced top padding
- [x] Emoji chips: removed green circle → subtle neutral chip
      (bg-black/5 · dark bg-white/6)
- [x] Reserve title → "Reserve @{handle}" (was barbr.me/{handle})
- [x] Success redesign: confetti, lock ring pops in + snaps open→shut (locking),
      "Held for {countdown}" pill moved to top (replaced "You're in" eyebrow),
      removed the URL box → clean inline link hero w/ pulsing live dot,
      title "Locked in.", progress bar hidden on success, back button now shown
- [x] QuizShell: added showProgress prop; showBack now step>0 (incl. success)
- [x] Verified light + dark; tsc clean

### To confirm
- Success title is "Locked in." (your "Reserve your link or something" didn't fit
  a done-state; picked one matching the lock animation). Easy to change.

## Phase 7: Third theme variant ("neon" — landing-page-v2 style)
- [x] Source values pulled from /Users/reefray/landing-page-v2 (mint→cyan gradient
      #00FF9D→#00FFC8 / #19fba6→#53f1ef, pure black, white-glass cards white/10,
      muted #a3a3a3, inputs #1e1e1e)
- [x] Brand green converted to RGB-channel CSS vars (--brand-green) so the accent
      itself shifts per theme AND opacity modifiers (/10,/40) still work
- [x] progress-fill → var; added `.neon` block in globals.css (after .dark)
- [x] Neon applies BOTH classes (dark + neon): dark: utilities fire, neon vars win
- [x] ThemeToggle now cycles light→dark→neon (Sun/Moon/Zap icons); no-FOUC script
      + localStorage updated for 3 states
- [x] Verified all 3 themes (Q1 + neon success/CTA); light & dark unregressed
- Experiment: user to pick favourite. Neon CTA = mint→cyan gradient + green glow,
  black text; dark CTA stays near-black pill.

## Phase 8: Tracking + lead capture (quiz-tracking-spec.md)
- [x] PostHog (posthog-js) — init at root (EU host), session_id per visit, events:
      quiz_started, step_completed (step_number/name, seconds_on_step,
      booking_method, headache), handle_claimed, email_captured (+identify +
      setPersonProperties email, kept off event), quiz_completed, store_cta_clicked
- [x] Meta Pixel — base init + PageView + fbclid capture; Lead on email submit
      with advanced matching (plain email → Meta hashes). VERIFIED: ev=Lead with
      ud[em]=<sha256> → 200 in network.
- [x] Supabase — client + insertLead (graceful no-op until creds), 23505 dup →
      route back to claim; SQL migration in supabase/migrations/0001_leads.sql
- [x] Secrets in gitignored .env.local; .env.example committed
- [x] Verified in preview: posthog config.js + /e/ POSTs 200; Meta PageView +
      Lead 200; full funnel walked

### Still needs the user (not code)
- Add NEXT_PUBLIC_SUPABASE_URL + ANON_KEY to .env.local, run the migration →
  enables lead rows + real dup handling (currently no-op)
- Meta Ads Manager: set campaign optimisation event = Lead
- Confirm funnel/breakdowns in PostHog + EMQ in Meta Test Events

## Lessons captured
- See `lessons.md`: never `next build` while dev server runs (wipes `.next`,
  blanks the page) — use `npx tsc --noEmit` to type-check instead.
