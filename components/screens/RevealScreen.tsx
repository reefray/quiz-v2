"use client";

import { motion } from "framer-motion";
import { ArrowRight, Scissors, ArrowRightLeft } from "lucide-react";
import Eyebrow from "../Eyebrow";
import CtaButton from "../CtaButton";
import { REVEAL, TRANSFER_BODY } from "@/lib/quizContent";

/**
 * Step 2 — "here's the fix". Staggered fade-up (eyebrow → title → bullets →
 * transfer card → proof → CTA). Bullets carry a relevant emoji. The free-transfer
 * card only shows on the competitor track (transferFrom set).
 */
const EASE = [0.2, 0.8, 0.2, 1] as const;

function Item({ delay, children, className }: { delay: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function RevealScreen({
  headache,
  transferFrom,
  onContinue,
}: {
  headache: string;
  /** Competitor-track source ("Booksy" / "Fresha" / typed / "your current app"); null on DM track. */
  transferFrom: string | null;
  onContinue: () => void;
}) {
  const reveal = REVEAL[headache] ?? REVEAL["Want more new clients"];

  return (
    <>
      <Item delay={0}>
        <Eyebrow>Here&apos;s the fix</Eyebrow>
      </Item>
      <Item delay={0.08}>
        <h1 className="text-heading font-bold text-ink">{reveal.title}</h1>
      </Item>

      <div className="mt-5 flex flex-col gap-3.5">
        {reveal.bullets.map((b, i) => (
          <Item
            key={i}
            delay={0.26 + i * 0.16}
            className="flex items-start gap-3 text-[14.5px] leading-snug text-ink"
          >
            <span className="grid h-7 w-7 flex-none place-items-center rounded-chip bg-brand-green/10 text-[15px] leading-none">
              {b.emoji}
            </span>
            <span className="pt-0.5">{b.text}</span>
          </Item>
        ))}
      </div>

      {transferFrom && (
        <Item delay={0.74} className="mt-5">
          <div className="rounded-card border border-brand-green/40 bg-brand-green/[0.06] p-4">
            <div className="flex items-center gap-2 text-[14px] font-bold text-ink">
              <ArrowRightLeft size={15} className="flex-none text-brand-greenDark" />
              Coming from {transferFrom}?
            </div>
            <p className="mt-1.5 text-[13px] leading-snug text-muted">{TRANSFER_BODY}</p>
          </div>
        </Item>
      )}

      <Item
        delay={0.86}
        className="mt-6 inline-flex items-center gap-1.5 text-[12.5px] text-muted"
      >
        <Scissors size={14} className="text-brand-greenDark" /> Trusted by 3,000+ barbers
      </Item>

      <div className="flex-1" />
      <Item delay={1}>
        <CtaButton onClick={onContinue}>
          Continue <ArrowRight size={18} />
        </CtaButton>
      </Item>
    </>
  );
}
