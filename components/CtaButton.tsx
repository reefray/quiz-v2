"use client";

import { ReactNode, useContext } from "react";
import { createPortal } from "react-dom";
import { KeyboardInsetContext } from "./KeyboardContext";

/**
 * Primary CTA — rounded rectangle, brand-filled. When the on-screen keyboard is
 * open (inset > 0) it pins itself just above the keyboard via fixed positioning,
 * leaving a hidden in-flow placeholder so the surrounding layout (and any
 * sub-copy below it) doesn't jump. Disabled → grey.
 */
export default function CtaButton({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const inset = useContext(KeyboardInsetContext);

  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cta-fill py-4 text-cta font-bold text-[color:var(--cta-text)] shadow-cta ring-1 ring-inset ring-white/10 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-cta-disabled disabled:bg-none disabled:text-white disabled:shadow-none disabled:ring-0"
    >
      {children}
    </button>
  );

  if (inset > 0 && typeof document !== "undefined") {
    return (
      <>
        {/* preserves flow height so content/sub-copy below doesn't shift */}
        <div aria-hidden className="pointer-events-none invisible mt-6">
          {button}
        </div>
        {/* the real, interactive CTA — pinned above the keyboard. Portaled to
            <body> so a transformed ancestor (Framer Motion) can't break the
            fixed positioning. */}
        {createPortal(
          <div
            className="fixed inset-x-0 z-50 mx-auto max-w-[440px] px-[22px]"
            style={{ bottom: inset + 12 }}
          >
            {button}
          </div>,
          document.body,
        )}
      </>
    );
  }

  return <div className="mt-6">{button}</div>;
}
