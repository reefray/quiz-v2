"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/** Initialises PostHog once at app root (EU host). No-op without a key. */
export default function PostHogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || (posthog as unknown as { __loaded?: boolean }).__loaded) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      ui_host: "https://eu.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: true,
    });
    // Snippet parity: expose for console debugging + flag overrides in testing.
    (window as unknown as { posthog?: typeof posthog }).posthog = posthog;
  }, []);
  return null;
}
