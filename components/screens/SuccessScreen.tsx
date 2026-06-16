"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, LockOpen, Clock, Check, Globe, Smartphone } from "lucide-react";
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

/** Step 6 — success. Centered header; reserved link card lives in the waiting card. */
export default function SuccessScreen({
  cleanHandle,
  email,
  secs,
  hhmmss,
  onDownload,
  dataImport = false,
  platform = "Booksy",
}: {
  cleanHandle: string;
  email: string;
  secs: number;
  hhmmss: (t: number) => string;
  onDownload: () => void;
  /** A/B test arm: swap the "Free Instagram ads" row for a data-import promise. */
  dataImport?: boolean;
  /** 'Booksy' | 'Fresha' — names the source the data is imported from. */
  platform?: string;
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
        className="mt-3 grid h-[64px] w-[64px] place-items-center rounded-full border-[1.5px] border-brand-green/40 text-brand-greenDark"
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
      <p className="mt-2 text-subtitle text-muted">Download the app to go live.</p>

      {/* what's waiting */}
      <div className="mt-6 w-full rounded-card border border-line bg-surface p-4 text-left">
        <div className="text-eyebrow font-semibold uppercase text-muted">Waiting in the app</div>

        {/* reserved link card (globe + link + live countdown pill) */}
        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-line bg-card px-3 py-2.5">
          <Globe size={17} className="flex-none text-brand-greenDark" />
          <span className="min-w-0 flex-1 truncate text-[14px]">
            <span className="font-semibold text-muted">barbr.me/</span>
            <span className="bg-green-gradient bg-clip-text font-extrabold text-transparent">
              {cleanHandle}
            </span>
          </span>
          <span className="inline-flex flex-none items-center gap-1 rounded-full border border-brand-green/25 bg-brand-green/10 px-2 py-0.5 text-[10.5px] font-semibold tabular-nums text-brand-greenDark">
            <Clock size={11} /> {hhmmss(secs)}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          <WaitingRow title="Your booking link" note="— go live in under 5 min" />
          {dataImport ? (
            <WaitingRow
              title="Free data import"
              note={`— we'll personally import all your data from ${platform}`}
            />
          ) : (
            <WaitingRow
              title="Free Instagram ads"
              note="— 5 ready to post graphics promoting your new booking link"
            />
          )}
          <WaitingRow
            title="One-to-one support"
            note="— live chat with us any time for help and support"
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
    </div>
  );
}
