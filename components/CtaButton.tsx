import { ReactNode } from "react";

/**
 * Primary CTA — rounded rectangle (matches the rectangular cards), black in both
 * modes with a subtle inset ring for definition on dark. Disabled → grey.
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
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-cta-fill py-4 text-cta font-bold text-[color:var(--cta-text)] shadow-cta ring-1 ring-inset ring-white/10 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-cta-disabled disabled:bg-none disabled:text-white disabled:shadow-none disabled:ring-0"
    >
      {children}
    </button>
  );
}
