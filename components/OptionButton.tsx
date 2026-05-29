import { ArrowRight } from "lucide-react";

/**
 * Selectable option row — compact. Shows a relevant emoji on a subtle neutral
 * chip (no coloured ring). Selecting auto-advances, so question screens have no
 * separate CTA.
 */
export default function OptionButton({
  label,
  sub,
  emoji,
  selected = false,
  onClick,
}: {
  label: string;
  sub?: string;
  emoji?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-card border bg-card p-3 text-left shadow-glass backdrop-blur-sm transition active:scale-[0.99] ${
        selected
          ? "border-brand-green ring-[3px] ring-brand-green/15"
          : "border-line hover:border-brand-green/60"
      }`}
    >
      {emoji && (
        <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-chip bg-black/[0.05] text-[17px] leading-none dark:bg-white/[0.06]">
          {emoji}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] font-semibold text-ink">{label}</span>
        {sub && <span className="mt-px text-[12px] text-muted">{sub}</span>}
      </span>
      <ArrowRight size={16} className="flex-none text-faint" />
    </button>
  );
}
