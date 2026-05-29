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

// ── Meta Pixel ──
type Fbq = (...args: unknown[]) => void;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Fire the Meta `Lead` event with advanced matching. Pass the PLAIN email —
 * Meta SHA-256 hashes it client-side; do NOT pre-hash for the browser pixel.
 */
export function metaLead(email: string) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (!fbq || !META_PIXEL_ID) return;
  fbq("init", META_PIXEL_ID, { em: email });
  fbq("track", "Lead");
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
