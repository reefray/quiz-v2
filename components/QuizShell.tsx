"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import ProgressTrack from "./ProgressTrack";
import { KeyboardInsetContext } from "./KeyboardContext";

/**
 * Tracks the on-screen keyboard via the visual viewport. Returns:
 *  - `height`: the visual-viewport height while a keyboard is up (else null) —
 *    we clamp the WHOLE app to it so the document can't scroll (keeps the back
 *    button in place; no iOS rubber-band/offset gap).
 *  - `inset`: how many px the keyboard covers at the bottom — CtaButton pins
 *    itself just above this.
 * Null/0 fallback ⇒ desktop / no-keyboard behaviour is unchanged.
 */
function useKeyboard(): { height: number | null; inset: number } {
  const [state, setState] = useState<{ height: number | null; inset: number }>({
    height: null,
    inset: 0,
  });
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      // >120px ⇒ a real keyboard, not address-bar chrome jiggle.
      if (inset > 120) setState({ height: Math.round(vv.height), inset: Math.round(inset) });
      else setState({ height: null, inset: 0 });
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return state;
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
  const kb = useKeyboard();
  const clampStyle = kb.height ? { height: `${kb.height}px` } : undefined;
  const clampClass = kb.height ? "" : "min-h-[100dvh]";
  return (
    <KeyboardInsetContext.Provider value={kb.inset}>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`relative flex w-full justify-center overflow-hidden bg-brand-surface ${clampClass}`}
      style={clampStyle}
    >
      {/* Mobile-first content column, centered on wider viewports. When the
          keyboard is up we clamp the whole app to the visual viewport so the
          page can't scroll (back button stays put), and CtaButton pins itself
          above the keyboard via KeyboardInsetContext. */}
      <div
        className={`relative z-10 flex w-full max-w-[440px] flex-col ${clampClass}`}
        style={clampStyle}
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
    </KeyboardInsetContext.Provider>
  );
}
