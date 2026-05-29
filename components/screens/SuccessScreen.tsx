"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, LockOpen, Clock, Check, Globe, Smartphone, RotateCcw } from "lucide-react";
import CtaButton from "../CtaButton";
import Confetti from "../Confetti";

function WaitingRow({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-brand-green/15 text-brand-greenDark">
        <Check size={13} />
      </span>
      <span className="text-[14px] text-ink">
        <span className="font-bold">{title}</span>
        <span className="font-normal text-muted"> {note}</span>
      </span>
    </div>
  );
}

/** Step 6 — success. Confetti + a lock that snaps shut, then the held link. */
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
    <div className="flex flex-1 flex-col items-center text-center">
      <Confetti />

      {/* lock ring — pops in, then locks shut */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
        className="mt-3 grid h-[72px] w-[72px] place-items-center rounded-full border-[1.5px] border-brand-green/40 text-brand-greenDark"
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
              <Lock size={30} strokeWidth={2.2} />
            </motion.span>
          ) : (
            <motion.span key="open" exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.12 }}>
              <LockOpen size={30} strokeWidth={2.2} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* link card — globe + booking link (username in the green gradient),
          wrapped in a sweeping glowing border beam */}
      <div
        className="relative mt-5 w-full overflow-hidden rounded-2xl p-[1.5px] shadow-[0_0_28px_-8px_rgb(var(--brand-green)_/_0.5)]"
      >
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[170%] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, transparent 255deg, rgb(var(--brand-green)) 315deg, rgb(var(--brand-green)) 340deg, transparent 360deg)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative z-10 flex items-center justify-center gap-2 rounded-[15px] bg-surface px-4 py-3.5">
          <Globe size={18} className="flex-none text-muted" />
          <span className="text-[18px] font-semibold text-muted">barbr.me/</span>
          <span className="bg-green-gradient bg-clip-text text-[18px] font-extrabold text-transparent">
            {cleanHandle}
          </span>
        </div>
      </div>

      <h1 className="mt-5 text-heading font-bold text-ink">You&apos;re in</h1>

      {/* held-for countdown */}
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brand-green/25 bg-brand-green/10 px-3.5 py-1.5 text-[12.5px] font-medium text-brand-greenDark">
        <Clock size={13} /> Held for <span className="font-bold tabular-nums">{hhmmss(secs)}</span>
      </div>

      {/* what's waiting */}
      <div className="mt-6 w-full rounded-card border border-line bg-surface p-4 text-left">
        <div className="text-eyebrow font-semibold uppercase text-muted">Waiting in the app</div>
        <div className="mt-3 flex flex-col gap-3">
          <WaitingRow title="Your live booking page" note="— go live in under 5 min" />
          <WaitingRow
            title="Free Instagram ads"
            note="— 5 ready to post graphics promoting your new booking link"
          />
        </div>
      </div>

      <div className="flex-1" />

      <p className="mb-3 text-[12.5px] leading-snug text-muted">
        <span className="font-semibold text-ink">Download the app to go live.</span> Most
        barbers finish setup in under 5 minutes.
      </p>
      <CtaButton onClick={onDownload}>
        <Smartphone size={18} /> Download the app
      </CtaButton>
      <p className="mt-3 text-[11.5px] font-normal text-muted">
        Link sent to {email || "your email"} · open it on your phone to log straight in
      </p>
      <button
        type="button"
        onClick={onReplay}
        className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-muted"
      >
        <RotateCcw size={13} /> Replay flow
      </button>
    </div>
  );
}
