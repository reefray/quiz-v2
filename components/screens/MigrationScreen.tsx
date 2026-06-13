"use client";

import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import Eyebrow from "../Eyebrow";
import CtaButton from "../CtaButton";
import { MIGRATION } from "@/lib/quizContent";

/**
 * Step 7 — switcher reassurance interstitial (A/B test variant, Booksy/Fresha
 * only). Pure interstitial: captures nothing, both CTAs advance to the claim
 * step. Mirrors RevealScreen's staggered fade-up + emoji-chip bullets; the
 * review card lands last, after the rows have made the point.
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

export default function MigrationScreen({
  platform,
  onContinue,
}: {
  /** 'Booksy' | 'Fresha' — drives every {platform} token on the screen. */
  platform: string;
  onContinue: () => void;
}) {
  return (
    <>
      <Item delay={0}>
        <Eyebrow>{MIGRATION.eyebrow}</Eyebrow>
      </Item>
      <Item delay={0.08}>
        <h1 className="text-heading font-bold text-ink">{MIGRATION.headline(platform)}</h1>
      </Item>

      {/* outcome rows — emoji chips, same rhythm as the reveal bullets */}
      <div className="mt-5 flex flex-col gap-3.5">
        {MIGRATION.rows(platform).map((b, i) => (
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

      {/* review card — eases in after the rows have landed */}
      <Item delay={0.9} className="mt-5">
        <div className="rounded-card border border-line bg-surface p-4">
          <div className="flex items-center gap-0.5 text-brand-greenDark">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
            ))}
          </div>
          <p className="mt-2 text-[13px] leading-snug text-ink">
            &ldquo;{MIGRATION.review.quote(platform)}&rdquo;
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-brand-green/15 text-[11px] font-bold text-brand-greenDark">
              JK
            </span>
            <span className="text-[12px] text-muted">
              <span className="font-bold text-ink">{MIGRATION.review.name}</span>,{" "}
              {MIGRATION.review.meta}
            </span>
          </div>
        </div>
      </Item>

      <div className="flex-1" />
      <Item delay={1.2}>
        <CtaButton onClick={onContinue}>
          {MIGRATION.cta} <ArrowRight size={18} />
        </CtaButton>
      </Item>
    </>
  );
}
