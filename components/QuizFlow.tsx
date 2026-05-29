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
import { track, identify, setPerson, metaLead, storeFromUA } from "@/lib/analytics";
import { insertLead } from "@/lib/leads";

const TOTAL_STEPS = 7; // 0..6
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
  const stepEnteredAt = useRef(Date.now());
  const startedRef = useRef(false);
  const completedRef = useRef(false);

  const isComp = method ? COMP_METHODS.includes(method) : false;
  const cleanHandle = cleanise(handle) || "yourname";

  // Competitor-track "Coming from X?" source for the reveal's transfer card.
  const transferFrom = !isComp
    ? null
    : method === "booksy"
      ? "Booksy"
      : method === "fresha"
        ? "Fresha"
        : otherSystem.trim() || "your current app";

  // quiz_started — once, when the first screen mounts.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    track("quiz_started", { session_id: sessionId });
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
    }
  }, [step, sessionId, cleanHandle]);

  // Live handle-availability check (debounced), mirrors the prototype.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
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
    timer.current = setTimeout(
      () => setStatus(TAKEN.includes(h) ? "taken" : "available"),
      650,
    );
    return () => {
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

  const reset = () => {
    completedRef.current = false;
    setStep(0);
    setMethod(null);
    setOtherSystem("");
    setHeadache(null);
    setHandle("");
    setStatus("idle");
    setEmail("");
    setSecs(HOLD_SECONDS);
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  // ── Forward transitions (each fires step_completed for the step left) ──
  const chooseMethod = (id: string) => {
    completeStep(0, { booking_method: id });
    setMethod(id);
    setHeadache(null); // re-branch headache list on a changed method
    setStep(1);
  };
  const chooseOther = () => {
    completeStep(0, { booking_method: "other", other_system: otherSystem.trim() || undefined });
    setMethod("other");
    setHeadache(null);
    setStep(1);
  };
  const chooseHeadache = (h: string) => {
    completeStep(1, { headache: h });
    setHeadache(h);
    setStep(2);
  };
  const revealContinue = () => {
    completeStep(2);
    setStep(3);
  };
  const claimHandle = () => {
    completeStep(3);
    track("handle_claimed", { session_id: sessionId, handle: cleanHandle });
    setStep(4);
  };
  const reserveEmail = async () => {
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
    metaLead(email);

    const res = await insertLead({
      session_id: sessionId,
      booking_method: method,
      headache,
      handle: cleanHandle,
      email,
      other_system: otherSystem.trim() || undefined,
    });
    if (res.duplicate) {
      // Handle was taken between check and submit — send back to re-pick.
      setStatus("taken");
      setStep(3);
      return;
    }
    setStep(5);
  };
  const giftContinue = () => {
    completeStep(5);
    setStep(6);
  };
  const downloadApp = () => {
    track("store_cta_clicked", { session_id: sessionId, store: storeFromUA() });
  };

  // Back available on every screen except the first. Progress hidden on success.
  const showBack = step > 0;
  const showProgress = step < 6;

  return (
    <QuizShell
      screenKey={step}
      step={step}
      totalSteps={TOTAL_STEPS}
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
          onReplay={reset}
          onDownload={downloadApp}
        />
      )}
    </QuizShell>
  );
}
