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
import { TAKEN, COMP_METHODS } from "@/lib/quizContent";
import { track, identify, setPerson, metaInitiateCheckout, metaTrackCustom, storeFromUA } from "@/lib/analytics";
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
] as const;

const cleanise = (h: string) =>
  h.trim().toLowerCase().replace(/[^a-z0-9._]/g, "");

const newSessionId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `s_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
};

/** Owns all funnel state + branching + analytics, renders the active step. */
export default function QuizFlow() {
  // A/B toggle for the gift step. When false, the reserve step routes straight to
  // success and the gift screen is skipped (the progress denominator drops by one
  // so the bar still reaches 100%). Flip to true to restore reserve → gift →
  // success. All gift code below stays intact either way. Later: swap this literal
  // for a per-user assignment (feature flag / experiment hook) — everything
  // downstream derives from it.
  const SHOW_GIFT: boolean = false;
  // Step indices actually shown; gift (5) drops out when SHOW_GIFT is false.
  const STEP_FLOW = SHOW_GIFT ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 6];

  const [step, setStep] = useState(0);
  const [method, setMethod] = useState<string | null>(null);
  const [otherSystem, setOtherSystem] = useState(""); // typed value when method === 'other'
  const [headache, setHeadache] = useState<string | null>(null);
  const [handle, setHandle] = useState("");
  const [status, setStatus] = useState<HandleStatus>("idle");
  const [email, setEmail] = useState("");
  const [secs, setSecs] = useState(HOLD_SECONDS);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Analytics session + timing ──
  const [sessionId] = useState(newSessionId);
  // fbclid captured once from the URL (persisted for the AppsFlyer afSub1 too).
  const fbclidRef = useRef<string | null>(null);
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
      const fromUrl = new URLSearchParams(window.location.search).get("fbclid");
      if (fromUrl) localStorage.setItem("fbclid", fromUrl);
      fbclidRef.current = fromUrl ?? localStorage.getItem("fbclid");
    } catch {
      /* ignore */
    }
    track("quiz_started", { session_id: sessionId });
    metaOnce("QuizStarted");
    // Creates the lead row and opens the Slack thread for this session (later
    // milestones reply under it). fbclid/user_agent give the parent ping context.
    fireLead(
      sessionId,
      { fbclid: fbclidRef.current, user_agent: ua() },
      "quiz_started",
    );
  }, [sessionId]);

  // Reset the per-step timer whenever the step changes.
  useEffect(() => {
    stepEnteredAt.current = Date.now();
  }, [step]);

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
    setHeadache(h);
    setStep(2);
  };
  const revealContinue = () => {
    completeStep(2);
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
  const showProgress = step < 6;

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
        />
      )}
    </QuizShell>
  );
}
