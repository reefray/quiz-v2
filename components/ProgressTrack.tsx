"use client";

import { motion } from "framer-motion";

/**
 * Progress track.
 *
 * Structure follows the prototype (a thin horizontal bar under the top bar),
 * but the styling is on-brand: a brand-green gradient fill on a light hairline
 * track. (The RN app uses dots — `ProgressDots` — for the same purpose; a dots
 * variant is trivial to swap in if preferred.)
 */
export default function ProgressTrack({
  step,
  totalSteps,
}: {
  step: number;
  totalSteps: number;
}) {
  // step is 0-indexed; show a sliver of progress even on the first screen.
  const ratio = totalSteps > 1 ? step / (totalSteps - 1) : 1;
  const pct = Math.max(0.06, ratio) * 100;

  return (
    <div className="mx-[22px] mt-1 h-[3px] overflow-hidden rounded-full bg-line">
      <motion.div
        className="h-full rounded-full bg-progress-fill"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      />
    </div>
  );
}
