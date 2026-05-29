"use client";

import { motion } from "framer-motion";
import { Sparkles, Image as ImageIcon } from "lucide-react";
import Eyebrow from "../Eyebrow";
import CtaButton from "../CtaButton";
import Confetti from "../Confetti";
import { PROMOS, type Promo } from "@/lib/quizContent";

const EASE = [0.2, 0.8, 0.2, 1] as const;

const CARD_W = 156;
const CARD_H = 270;

// Tidy stacked-deck resting transforms for the 5 cards (index 0..4).
const FAN_ROTATE = [-8, -4, 0, 4, 8];
const FAN_X = [-40, -20, 0, 20, 40];
const FAN_Y = [10, 4, 0, 4, 10];

function PromoCard({ promo, index, handle }: { promo: Promo; index: number; handle: string }) {
  const zIndex = 10 - Math.abs(index - 2);
  // left/top:50% + half-card offset centres each absolutely-positioned card.
  const cx = -CARD_W / 2;
  const cy = -CARD_H / 2;
  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{ zIndex }}
      initial={{ x: 300, y: cy + FAN_Y[index], rotate: 40, opacity: 0 }}
      animate={{ x: cx + FAN_X[index], y: cy + FAN_Y[index], rotate: FAN_ROTATE[index], opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.15 + index * 0.13, ease: EASE }}
    >
      <div
        className={`flex h-[270px] w-[156px] flex-col justify-between rounded-2xl border border-white/15 bg-gradient-to-br ${promo.gradient} p-3.5 text-white shadow-card`}
      >
        <span className="text-[9px] font-bold uppercase tracking-[1.5px] opacity-90">
          {promo.label}
        </span>
        <div className="grid flex-1 place-items-center">
          <ImageIcon size={36} className="opacity-40" strokeWidth={1.5} />
        </div>
        <span className="text-[10px] font-semibold opacity-90">barbr.me/{handle}</span>
      </div>
    </motion.div>
  );
}

/** Step 5 — free promo-pack reward. Confetti + a fanned, animated promo deck. */
export default function GiftScreen({
  cleanHandle,
  onContinue,
}: {
  cleanHandle: string;
  onContinue: () => void;
}) {
  return (
    <>
      <Confetti />

      <Eyebrow>Free gift</Eyebrow>
      <h1 className="text-heading font-bold text-ink">Free Instagram ads</h1>
      <p className="mt-2 text-subtitle text-muted">
        Five custom Instagram ads you can post now to drive people to your link.
      </p>

      {/* Fanned promo deck — cards slide in from the side and stack */}
      <div className="relative mb-1 mt-5 flex h-[300px] items-center justify-center overflow-hidden">
        {PROMOS.map((p, i) => (
          <PromoCard key={p.id} promo={p} index={i} handle={cleanHandle} />
        ))}
      </div>

      <div className="inline-flex items-center gap-1.5 text-[12px] text-muted">
        <Sparkles size={13} className="text-brand-greenDark" /> Generated from your profile
        inside the app
      </div>

      <div className="flex-1" />
      <CtaButton onClick={onContinue}>Continue</CtaButton>
    </>
  );
}
