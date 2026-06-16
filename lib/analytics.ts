import posthog from "posthog-js";

/**
 * Thin analytics layer over PostHog + the Meta Pixel. Every helper is a safe
 * no-op when the underlying tool isn't loaded/configured, so the funnel never
 * breaks if a key is missing.
 */

type Props = Record<string, unknown>;

// posthog sets __loaded after init; guard so we never capture pre-init.
const ph = () =>
  typeof window !== "undefined" && (posthog as unknown as { __loaded?: boolean }).__loaded
    ? posthog
    : null;

export function track(event: string, props: Props = {}) {
  ph()?.capture(event, props);
}

export function identify(distinctId: string) {
  ph()?.identify(distinctId);
}

export function setPerson(props: Props) {
  ph()?.setPersonProperties(props);
}

/** Super property attached to every subsequent event this session. */
export function register(props: Props) {
  ph()?.register(props);
}

/**
 * Resolve a feature flag once flags are loaded, exactly once. Treats both a
 * boolean flag (`true`) and an experiment variant (`'test'`) as enabled.
 * `onFeatureFlags` fires immediately when flags are already in memory (they
 * are by mid-funnel), so this normally resolves synchronously. Reading the
 * flag logs PostHog's $feature_flag_called exposure — only call once the user
 * qualifies for the experiment population. No-op when PostHog isn't loaded
 * (caller keeps control behaviour).
 */
export function resolveFlag(flag: string, cb: (enabled: boolean) => void) {
  const p = ph();
  if (!p) return;
  let done = false; // onFeatureFlags re-fires on every flags reload
  p.onFeatureFlags(() => {
    if (done) return;
    done = true;
    const value = p.getFeatureFlag(flag);
    cb(value === true || value === "test");
  });
}

// ── Meta Pixel ──
type Fbq = (...args: unknown[]) => void;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Fire the Meta `InitiateCheckout` event with advanced matching. We use
 * InitiateCheckout (not Lead) so the conversion can optimise sales/purchase
 * campaigns — `Lead` is restricted to lead-gen objectives. Pass the PLAIN
 * email — Meta SHA-256 hashes it client-side; do NOT pre-hash for the browser
 * pixel. Setting `em` on init also enables advanced matching for events fired
 * *after* this one in the session (e.g. QuizCompleted, AppDownloadClicked).
 */
export function metaInitiateCheckout(email: string) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (!fbq || !META_PIXEL_ID) return;
  fbq("init", META_PIXEL_ID, { em: email });
  fbq("track", "InitiateCheckout");
}

/** Fire a custom Meta event (funnel-step rung). Use `fbq('trackCustom', …)`. */
export function metaTrackCustom(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (!fbq || !META_PIXEL_ID) return;
  fbq("trackCustom", event, params);
}

export type StoreTarget = "ios" | "android" | "other";

/** Best-effort store target for `store_cta_clicked`. */
export function storeFromUA(): StoreTarget {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}
