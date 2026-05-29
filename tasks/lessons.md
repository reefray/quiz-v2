# Lessons

## Don't run `next build` while the dev server is live
Running `npm run build` against the same project while `next dev` is serving
overwrites/clears the shared `.next` directory. The dev server then 404s on its
own CSS + JS chunks (`/_next/static/css/app/layout.css`, `app/page.js`, …),
which renders as an **unstyled, blank-looking page** (Tailwind classes appear to
"not apply", text falls back to black, no gradient).

**Fix:** stop dev → `rm -rf .next` → restart dev.

**Prevent:** to type-check without touching `.next`, run `npx tsc --noEmit`
instead of `npm run build` while the dev server is running. Only `build` when dev
is stopped.

## Tailwind purges classes that live outside `content` globs
Gradient/utility classes stored as strings in `lib/quizContent.ts` (e.g. promo
card `from-[#...]` gradients) rendered blank until `./lib/**/*.{ts,tsx}` was added
to `content` in tailwind.config.ts. Any file that holds className strings must be
in `content`, or those classes get purged.

## Absolutely-positioned children ignore flex centering
`justify-center`/`items-center` on a parent do nothing for `position:absolute`
children — they pin to top-left. Centre them with `left-1/2 top-1/2` and a
`-50%` (half-width/height) offset baked into the transform (here via framer x/y).

## Preview pane navigation
The Claude_Preview browser sometimes parks on its "Awaiting server…" placeholder
(a `data:` URL) and won't auto-navigate even when the server is healthy. Force it
with `preview_eval` → `location.href = 'http://localhost:3000/'`, then screenshot.
