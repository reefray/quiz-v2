"use client";

import { useState, useEffect, useRef } from "react";
import QuizShell from "./QuizShell";
import BookingMethodScreen from "./screens/BookingMethodScreen";
import HeadacheScreen from "./screens/HeadacheScreen";
import RevealScreen from "./screens/RevealScreen";
import ClaimScreen, { type HandleStatus } from "./screens/ClaimScreen";
import ReserveScreen from "./screens/ReserveScreen";
import GiftScreen from "./screens/GiftScreen";
import SuccessScreen from "./screens/SuccessScreen";
import MigrationScreen from "./screens/MigrationScreen";
import { TAKEN, COMP_METHODS } from "@/lib/quizContent";
import { track, identify, setPerson, register, resolveFlag, metaInitiateCheckout, metaTrackCustom, storeFromUA } from "@/lib/analytics";
import { fireLead, postLead, checkHandle } from "@/lib/leads";

const HOLD_SECONDS = 24 * 3600 - 12;
const STEP_NAMES = [
  "booking_method",
  "headache",
  "reveal",
  "claim",
  "reserve",
  "gift",
  "success",
  "switcher_migration", // step 7 — appended so existing step numbers stay stable
] as const;

/** PostHog flags for the two independent switcher-only A/B tests (both resolve
 *  at the Q2 answer, switchers only — see chooseHeadache). */
const MIGRATION_FLAG = "switcher-migration-screen"; // step-7 interstitial — ?mig override
const OFFER_FLAG = "switcher-data-import-offer"; // success-page offer swap — ?imp override

// Dev-only QA override — force an experiment variant via a query param where
// PostHog isn't configured (local/preview). Compiled out of prod builds.
const qaVariant = (param: string): "test" | "control" | null => {
  if (process.env.NODE_ENV === "production") return null;
  try {
    const v = new URLSearchParams(window.location.search).get(param);
    return v === "test" || v === "control" ? v : null;
  } catch {
    return null;
  }
};

const cleanise = (h: string) =>
  h.trim().toLowerCase().replace(/[^a-z0-9._]/g, "");

const newSessionId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `s_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
};

// Ad attribution we read off the landing URL (Meta ad templates fill these:
// utm_source={{campaign.name}}&utm_medium={{placement}}&utm_campaign=
// {{adset.name}}&utm_content={{ad.name}}). utm_term included for completeness.
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

/** Owns all funnel state + branching + analytics, renders the active step. */
export default function QuizFlow() {
  // A/B toggle for the gift step. When false, the reserve step routes straight to
  // success and the gift screen is skipped (the progress denominator drops by one
  // so the bar still reaches 100%). Flip to true to restore reserve → gift →
  // success. All gift code below stays intact either way. Later: swap this literal
  // for a per-user assignment (feature flag / experiment hook) — everything
  // downstream derives from it.
  const SHOW_GIFT: boolean = false;

  const [step, setStep] = useState(0);
  const [method, setMethod] = useState<string | null>(null);
  const [otherSystem, setOtherSystem] = useState(""); // typed value when method === 'other'
  const [headache, setHeadache] = useState<string | null>(null);
  const [handle, setHandle] = useState("");
  const [status, setStatus] = useState<HandleStatus>("idle");
  const [email, setEmail] = useState("");
  const [secs, setSecs] = useState(HOLD_SECONDS);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Switcher migration-screen A/B test ──
  // Variant resolves once, at the Q2 answer, and only for Booksy/Fresha — so
  // PostHog's exposure population is switcher-only. 'test' shows step 7
  // between reveal and claim; 'control'/null is today's flow.
  const [migrationVariant, setMigrationVariant] = useState<"test" | "control" | null>(null);
  const variantRef = useRef<"test" | "control" | null>(null);
  const migrationShownRef = useRef(false);

  // ── Switcher "free data import" offer A/B test (independent flag) ──
  // Resolves alongside the migration flag at Q2, switchers only. 'test' swaps
  // the success-page "Free Instagram ads" row for a platform-specific
  // data-import promise; 'control'/null keeps today's offer.
  const [offerVariant, setOfferVariant] = useState<"test" | "control" | null>(null);
  const offerVariantRef = useRef<"test" | "control" | null>(null);

  // Strictly Booksy/Fresha — 'other' is competitor-track but excluded from the test.
  const isSwitcher = method === "booksy" || method === "fresha";
  const platform = method === "fresha" ? "Fresha" : "Booksy";
  // Control switchers (and unresolved-flag edge cases) skip the screen, so a
  // late flag can never flash it in — flicker-safe by construction.
  const showMigration = isSwitcher && migrationVariant === "test";
  // Success-page offer swap: switchers on the 'test' arm of the offer flag.
  const showDataImport = isSwitcher && offerVariant === "test";

  // Step indices actually shown; migration (7) slots between reveal and claim
  // on the test arm, gift (5) drops out when SHOW_GIFT is false. The progress
  // denominator follows automatically.
  const STEP_FLOW = [
    0,
    1,
    2,
    ...(showMigration ? [7] : []),
    3,
    4,
    ...(SHOW_GIFT ? [5] : []),
    6,
  ];

  // ── Analytics session + timing ──
  const [sessionId] = useState(newSessionId);
  // fbclid captured once from the URL (persisted for the AppsFlyer afSub1 too).
  const fbclidRef = useRef<string | null>(null);
  // UTM ad-attribution captured once from the URL (persisted across reloads).
  const utmRef = useRef<Record<string, string>>({});
  const stepEnteredAt = useRef(Date.now());
  const startedRef = useRef(false);
  const completedRef = useRef(false);
  // Meta funnel-step events fire at most once per session (back/forward safe).
  const metaFired = useRef<Set<string>>(new Set());
  const metaOnce = (event: string, params: Record<string, unknown> = {}) => {
    if (metaFired.current.has(event)) return;
    metaFired.current.add(event);
    metaTrackCustom(event, params);
  };

  const isComp = method ? COMP_METHODS.includes(method) : false;
  const cleanHandle = cleanise(handle) || "yourname";
  const stepIndex = Math.max(0, STEP_FLOW.indexOf(step)); // position in flow (progress bar)

  // Competitor-track "Coming from X?" source for the reveal's transfer card.
  const transferFrom = !isComp
    ? null
    : method === "booksy"
      ? "Booksy"
      : method === "fresha"
        ? "Fresha"
        : otherSystem.trim() || "your current app";

  // quiz_started — once, when the first screen mounts. Also capture fbclid from
  // the URL (fall back to a prior value); persist it for the AppsFlyer afSub1.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("fbclid");
      if (fromUrl) localStorage.setItem("fbclid", fromUrl);
      fbclidRef.current = fromUrl ?? localStorage.getItem("fbclid");
      // UTMs: take the URL value on first touch, else a previously stored one,
      // and persist so a reload mid-funnel doesn't drop attribution.
      const utm: Record<string, string> = {};
      for (const key of UTM_KEYS) {
        const value = params.get(key) ?? localStorage.getItem(key);
        if (value) {
          utm[key] = value;
          localStorage.setItem(key, value);
        }
      }
      utmRef.current = utm;
    } catch {
      /* ignore */
    }
    track("quiz_started", { session_id: sessionId });
    metaOnce("QuizStarted");
    // Creates the lead row and opens the Slack thread for this session (later
    // milestones reply under it). fbclid/user_agent/UTMs give the parent ping
    // its attribution context.
    fireLead(
      sessionId,
      { fbclid: fbclidRef.current, user_agent: ua(), ...utmRef.current },
      "quiz_started",
    );
  }, [sessionId]);

  // Reset the per-step timer whenever the step changes.
  useEffect(() => {
    stepEnteredAt.current = Date.now();
  }, [step]);

  // switcher_screen_shown — once, when the test-arm migration screen renders.
  useEffect(() => {
    if (step === 7 && !migrationShownRef.current) {
      migrationShownRef.current = true;
      track("switcher_screen_shown", {
        session_id: sessionId,
        platform,
        variant: migrationVariant,
        booking_method: method ?? undefined,
      });
    }
  }, [step, sessionId, platform, migrationVariant, method]);

  // quiz_completed — when the success screen mounts.
  useEffect(() => {
    if (step === 6 && !completedRef.current) {
      completedRef.current = true;
      track("quiz_completed", { session_id: sessionId, handle: cleanHandle });
      metaOnce("QuizCompleted");
      fireLead(sessionId, { reached_success: true });
    }
  }, [step, sessionId, cleanHandle]);

  // Live handle-availability check (debounced), mirrors the prototype. Hits
  // GET /api/handle; the local TAKEN list is an instant offline reject, and the
  // `cancelled` guard drops results from superseded keystrokes.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    let cancelled = false;
    const h = cleanise(handle);
    if (h.length === 0) {
      setStatus("idle");
      return;
    }
    if (h.length < 3) {
      setStatus("short");
      return;
    }
    setStatus("checking");
    timer.current = setTimeout(async () => {
      if (TAKEN.includes(h)) {
        if (!cancelled) setStatus("taken");
        return;
      }
      const available = await checkHandle(h);
      if (!cancelled) setStatus(available ? "available" : "taken");
    }, 650);
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [handle]);

  // Countdown on the success screen.
  useEffect(() => {
    if (step !== 6) return;
    const i = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(i);
  }, [step]);

  const hhmmss = (t: number) =>
    [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");

  // Fire step_completed for the step the user is leaving.
  const completeStep = (stepNumber: number, extra: Record<string, unknown> = {}) => {
    track("step_completed", {
      session_id: sessionId,
      step_number: stepNumber,
      step_name: STEP_NAMES[stepNumber],
      seconds_on_step: Math.round((Date.now() - stepEnteredAt.current) / 1000),
      booking_method: method ?? undefined,
      headache: headache ?? undefined,
      ...extra,
    });
  };

  // Back from Q1 returns to the landing page (set NEXT_PUBLIC_LANDING_URL once the
  // quiz is linked from getbarbr.com). Until then it falls back to browser history,
  // and is a no-op on a direct/first load.
  const back = () => {
    const pos = STEP_FLOW.indexOf(step);
    if (pos <= 0) {
      const landing = process.env.NEXT_PUBLIC_LANDING_URL;
      if (landing) window.location.href = landing;
      else if (typeof window !== "undefined" && window.history.length > 1) window.history.back();
      return;
    }
    setStep(STEP_FLOW[pos - 1]); // previous step in the active flow (skips gift when hidden)
  };

  // ── Forward transitions (each fires step_completed for the step left) ──
  // user_agent helper for the lead row.
  const ua = () => (typeof navigator !== "undefined" ? navigator.userAgent : null);

  const chooseMethod = (id: string) => {
    completeStep(0, { booking_method: id });
    metaOnce("QuizQ1Answered", { booking_method: id });
    fireLead(
      sessionId,
      { booking_method: id, fbclid: fbclidRef.current, user_agent: ua() },
      "q1_answered",
    );
    setMethod(id);
    setHeadache(null); // re-branch headache list on a changed method
    setStep(1);
  };
  const chooseOther = () => {
    const other_system = otherSystem.trim() || undefined;
    completeStep(0, { booking_method: "other", other_system });
    metaOnce("QuizQ1Answered", { booking_method: "other" });
    fireLead(
      sessionId,
      {
        booking_method: "other",
        other_system: other_system ?? null,
        fbclid: fbclidRef.current,
        user_agent: ua(),
      },
      "q1_answered",
    );
    setMethod("other");
    setHeadache(null);
    setStep(1);
  };
  const chooseHeadache = (h: string) => {
    completeStep(1, { headache: h });
    metaOnce("QuizQ2Answered", { headache: h });
    fireLead(sessionId, { headache: h });
    // A/B: read the migration-screen flag here — switchers only, once. The
    // read logs PostHog's exposure, and flags are loaded well before Q2, so
    // the variant is settled during the reveal dwell (no flicker at step 7).
    if ((method === "booksy" || method === "fresha") && !variantRef.current) {
      const assign = (variant: "test" | "control") => {
        if (variantRef.current) return;
        variantRef.current = variant;
        setMigrationVariant(variant);
        register({ switcher_screen_variant: variant }); // event property on everything after
        setPerson({ switcher_screen_variant: variant });
        fireLead(sessionId, { switcher_screen_variant: variant });
      };
      const forced = qaVariant("mig");
      if (forced) assign(forced);
      else resolveFlag(MIGRATION_FLAG, (enabled) => assign(enabled ? "test" : "control"));
    }
    // A/B: read the data-import offer flag here too — switchers only, once.
    // Independent of the migration flag above (separate PostHog experiment), so
    // a session can land on different arms of each.
    if ((method === "booksy" || method === "fresha") && !offerVariantRef.current) {
      const assign = (variant: "test" | "control") => {
        if (offerVariantRef.current) return;
        offerVariantRef.current = variant;
        setOfferVariant(variant);
        register({ data_import_offer_variant: variant }); // event property on everything after
        setPerson({ data_import_offer_variant: variant });
        fireLead(sessionId, { data_import_offer_variant: variant });
      };
      const forced = qaVariant("imp");
      if (forced) assign(forced);
      else resolveFlag(OFFER_FLAG, (enabled) => assign(enabled ? "test" : "control"));
    }
    setHeadache(h);
    setStep(2);
  };
  const revealContinue = () => {
    completeStep(2);
    setStep(showMigration ? 7 : 3);
  };
  const migrationContinue = () => {
    completeStep(7);
    track("switcher_screen_cta_clicked", {
      session_id: sessionId,
      platform,
      variant: migrationVariant,
      booking_method: method ?? undefined,
    });
    setStep(3);
  };
  const claimHandle = async () => {
    completeStep(3);
    track("handle_claimed", { session_id: sessionId, handle: cleanHandle });
    metaOnce("HandleClaimed");
    // Authoritative handle write — the one place we await, since a 23505 means
    // the handle was taken since the live check and we must stay put.
    const res = await postLead(sessionId, { handle: cleanHandle });
    if (res.error === "handle_taken") {
      setStatus("taken"); // "just got taken" — re-pick on the claim step
      return;
    }
    setStep(4);
  };
  const reserveEmail = () => {
    completeStep(4);
    // email_captured: keep raw email OFF the event; set it as a person property.
    track("email_captured", {
      session_id: sessionId,
      handle: cleanHandle,
      booking_method: method ?? undefined,
      headache: headache ?? undefined,
    });
    identify(sessionId);
    setPerson({ email });
    if (!metaFired.current.has("InitiateCheckout")) {
      metaFired.current.add("InitiateCheckout");
      metaInitiateCheckout(email); // InitiateCheckout + enables advanced matching for later events
    }
    // Handle uniqueness is already gated at the claim step; just record the email.
    fireLead(sessionId, { email }, "email_given");
    setStep(SHOW_GIFT ? 5 : 6); // skip gift → straight to success when the gift step is off
  };
  const giftContinue = () => {
    completeStep(5);
    setStep(6);
  };
  const downloadApp = () => {
    const store = storeFromUA();
    track("store_cta_clicked", { session_id: sessionId, store });
    metaOnce("AppDownloadClicked", { store });
    // keepalive (in postLead) lets this write survive the navigation below.
    fireLead(sessionId, { clicked_download: true, download_store: store }, "download_clicked");

    const af = (window as any).AF_SMART_SCRIPT;
    const result = af?.generateOneLinkURL({
      oneLinkURL: "https://barbr.onelink.me/uB0r",
      afParameters: {
        mediaSource: { keys: ["utm_source"], defaultValue: "any_source" },
        campaign: { keys: ["utm_campaign"], defaultValue: "any_campaign" },
        adSet: { keys: ["utm_adset"], defaultValue: "any_adset" },
        ad: { keys: ["utm_ad"], defaultValue: "any_ad" },
        channel: { keys: ["utm_medium"], defaultValue: "any_medium" },
        afSub1: { keys: ["fbclid"] },
        afCustom: [{ paramKey: "af_ss_ui", defaultValue: "true" }],
      },
    });

    window.location.href = result?.clickURL ?? "https://barbr.onelink.me/uB0r";
  };

  // Back shown on every screen (Q1 → landing). Progress hidden on success.
  const showBack = true;
  const showProgress = step !== 6; // step is an id, not an order — 7 sits mid-flow

  return (
    <QuizShell
      screenKey={step}
      step={stepIndex}
      totalSteps={STEP_FLOW.length}
      showBack={showBack}
      showProgress={showProgress}
      onBack={back}
    >
      {step === 0 && (
        <BookingMethodScreen
          selected={method}
          onSelect={chooseMethod}
          otherSystem={otherSystem}
          setOtherSystem={setOtherSystem}
          onSelectOther={chooseOther}
        />
      )}

      {step === 1 && (
        <HeadacheScreen isComp={isComp} selected={headache} onSelect={chooseHeadache} />
      )}

      {step === 2 && headache && (
        <RevealScreen headache={headache} transferFrom={transferFrom} onContinue={revealContinue} />
      )}

      {step === 7 && (
        <MigrationScreen platform={platform} onContinue={migrationContinue} />
      )}

      {step === 3 && (
        <ClaimScreen
          handle={handle}
          setHandle={setHandle}
          status={status}
          cleanHandle={cleanHandle}
          onClaim={claimHandle}
        />
      )}

      {step === 4 && (
        <ReserveScreen
          cleanHandle={cleanHandle}
          email={email}
          setEmail={setEmail}
          onReserve={reserveEmail}
        />
      )}

      {step === 5 && <GiftScreen cleanHandle={cleanHandle} onContinue={giftContinue} />}

      {step === 6 && (
        <SuccessScreen
          cleanHandle={cleanHandle}
          email={email}
          secs={secs}
          hhmmss={hhmmss}
          onDownload={downloadApp}
          dataImport={showDataImport}
          platform={platform}
        />
      )}
    </QuizShell>
  );
}
