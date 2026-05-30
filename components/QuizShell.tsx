"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import ProgressTrack from "./ProgressTrack";

/**
 * When the on-screen keyboard opens, the visual viewport shrinks but the layout
 * viewport (100dvh) does not — on iOS the CTA would sit hidden behind the
 * keyboard. This returns the visual-viewport height while a keyboard is up
 * (else null), so we can clamp the column to it and let the flex CTA lift above
 * the keyboard. Null fallback ⇒ desktop / no-keyboard behaviour is unchanged.
 */
function useKeyboardViewportHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const inset = window.innerHeight - vv.height;
      // >120px ⇒ a real keyboard, not address-bar chrome jiggle.
      setHeight(inset > 120 ? Math.round(vv.height) : null);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return height;
}

interface QuizShellProps {
  /** Stable key for the current screen — changing it remounts + replays the enter animation. */
  screenKey: string | number;
  /** 0-indexed step, for the progress track. */
  step: number;
  totalSteps: number;
  onBack?: () => void;
  /** Hide the back control (e.g. first screen). */
  showBack?: boolean;
  /** Hide the progress track (e.g. terminal success screen). */
  showProgress?: boolean;
  children: ReactNode;
}

/**
 * Reusable screen wrapper every quiz step sits in.
 *
 * Top bar: glass back button (left) · theme toggle (right). Gutters and the
 * progress track match the prototype's 22px rhythm. Background + surfaces flip
 * with the dark/light toggle via CSS variables.
 *
 * Transition: prototype `screenin` (opacity + small translateY, enter only),
 * snappier (~0.2s) — optimised for conversion. Keying the motion element remounts
 * it each step, replaying the enter animation like the prototype's `key={step}`.
 */
export default function QuizShell({
  screenKey,
  step,
  totalSteps,
  onBack,
  showBack = true,
  showProgress = true,
  children,
}: QuizShellProps) {
  const kbViewportH = useKeyboardViewportHeight();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative flex min-h-[100dvh] w-full justify-center overflow-hidden bg-brand-surface"
    >
      {/* Mobile-first content column, centered on wider viewports. When the
          keyboard is up we clamp its height to the visual viewport so the CTA
          lifts above the keyboard instead of hiding behind it. */}
      <div
        className={`relative z-10 flex w-full max-w-[440px] flex-col ${
          kbViewportH ? "" : "min-h-[100dvh]"
        }`}
        style={kbViewportH ? { height: `${kbViewportH}px` } : undefined}
      >
        {/* ── Top bar: back (left) ── */}
        <header className="flex items-center px-[22px] pb-1 pt-10 sm:pt-12">
          {showBack && onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="grid h-10 w-10 place-items-center rounded-back border border-[color:var(--glass-border)] bg-[var(--glass-bg)] text-ink shadow-glass backdrop-blur-sm transition active:scale-95"
            >
              <ArrowLeft size={20} strokeWidth={2.25} />
            </button>
          ) : (
            <span className="h-10 w-10" />
          )}
        </header>

        {/* ── Progress track ── */}
        {showProgress && <ProgressTrack step={step} totalSteps={totalSteps} />}

        {/* ── Animated screen (enter-only fade-up, fast) ── */}
        <div className="relative flex-1 overflow-y-auto overscroll-none">
          <motion.div
            key={screenKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex min-h-full flex-col px-[22px] pb-7 pt-4"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
