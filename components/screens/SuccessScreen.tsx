"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, LockOpen, Clock, Check, Globe, Smartphone, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import CtaButton from "../CtaButton";
import Confetti from "../Confetti";

function WaitingRow({
  title,
  note,
  icon: Icon = Check,
}: {
  title: string;
  note: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-brand-green/15 text-brand-greenDark">
        <Icon size={13} />
      </span>
      <span className="text-[14px] text-ink">
        <span className="font-bold">{title}</span>
        <span className="font-normal text-muted"> {note}</span>
      </span>
    </div>
  );
}

/** Step 6 — success. Left-aligned header + the reserved link inside the waiting card. */
export default function SuccessScreen({
  cleanHandle,
  email,
  secs,
  hhmmss,
  onReplay,
  onDownload,
}: {
  cleanHandle: string;
  email: string;
  secs: number;
  hhmmss: (t: number) => string;
  onReplay: () => void;
  onDownload: () => void;
}) {
  // Lock starts open and snaps shut shortly after mount.
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLocked(true), 480);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-start text-left">
      <Confetti />

      {/* lock ring — pops in, then locks shut */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
        className="mt-2 grid h-[64px] w-[64px] place-items-center rounded-full border-[1.5px] border-brand-green/40 text-brand-greenDark"
        style={{
          background: "radial-gradient(circle at 50% 40%, rgba(34,197,94,.22), transparent 70%)",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {locked ? (
            <motion.span
              key="locked"
              initial={{ scale: 0.5, rotate: -14, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 11 }}
            >
              <Lock size={26} strokeWidth={2.2} />
            </motion.span>
          ) : (
            <motion.span key="open" exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.12 }}>
              <LockOpen size={26} strokeWidth={2.2} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      <h1 className="mt-4 text-heading font-bold text-ink">You&apos;re In 🎉</h1>

      <p className="mt-2 text-subtitle text-muted">
        <span className="font-semibold text-ink">Download the app to go live.</span> Most
        barbers finish setup in under 5 minutes.
      </p>

      {/* held-for countdown (small) */}
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brand-green/25 bg-brand-green/10 px-3 py-1 text-[11.5px] font-medium text-brand-greenDark">
        <Clock size={12} /> Held for <span className="font-bold tabular-nums">{hhmmss(secs)}</span>
      </div>

      {/* what's waiting */}
      <div className="mt-6 w-full rounded-card border border-line bg-surface p-4 text-left">
        <div className="text-eyebrow font-semibold uppercase text-muted">Waiting in the app</div>
        <div className="mt-3 flex flex-col gap-3">
          <WaitingRow
            icon={Globe}
            title="Your reserved booking link"
            note={
              <>
                — barbr.me/
                <span className="bg-green-gradient bg-clip-text font-bold text-transparent">
                  {cleanHandle}
                </span>
              </>
            }
          />
          <WaitingRow title="Personalized website" note="— go live in under 5 min" />
          <WaitingRow
            title="Free Instagram ads"
            note="— 5 ready to post graphics promoting your new booking link"
          />
        </div>
      </div>

      <div className="flex-1" />

      <CtaButton onClick={onDownload}>
        <Smartphone size={18} /> Download the app
      </CtaButton>
      <p className="mt-3 text-[11.5px] font-normal text-muted">
        Link sent to {email || "your email"} · open it on your phone to log straight in
      </p>
      <button
        type="button"
        onClick={onReplay}
        className="mt-4 inline-flex items-center gap-1.5 self-center text-[12px] text-muted"
      >
        <RotateCcw size={13} /> Replay flow
      </button>
    </div>
  );
}
