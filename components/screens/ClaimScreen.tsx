import { Loader2, Check, ArrowRight, Globe } from "lucide-react";
import Eyebrow from "../Eyebrow";
import CtaButton from "../CtaButton";

export type HandleStatus = "idle" | "short" | "checking" | "available" | "taken";

/** Step 3 — claim your barbr.me handle, with live availability check. */
export default function ClaimScreen({
  handle,
  setHandle,
  status,
  cleanHandle,
  onClaim,
}: {
  handle: string;
  setHandle: (v: string) => void;
  status: HandleStatus;
  cleanHandle: string;
  onClaim: () => void;
}) {
  const boxBorder =
    status === "available"
      ? "border-brand-green ring-2 ring-brand-green/20"
      : status === "taken"
        ? "border-bad"
        : "border-line focus-within:border-brand-green";

  return (
    <>
      <Eyebrow>Claim your link</Eyebrow>
      <h1 className="text-heading font-bold text-ink">Grab your booking link</h1>
      <p className="mt-2 text-subtitle text-muted">
        The one link clients tap to book you — yours, not a marketplace profile. Pick
        yours while it&apos;s still free.
      </p>

      <div
        className={`mt-2 flex items-center gap-2 rounded-input border-[1.5px] bg-surface px-4 transition ${boxBorder}`}
      >
        <Globe size={18} className="flex-none text-faint" />
        <span className="text-[16px] text-muted">barbr.me/</span>
        <input
          autoFocus
          value={handle}
          placeholder="yourname"
          onChange={(e) => setHandle(e.target.value)}
          className="min-w-0 flex-1 bg-transparent py-3.5 text-[18px] font-bold text-ink outline-none placeholder:font-bold placeholder:text-faint"
        />
      </div>

      <div className="mt-3 min-h-[22px] text-[13px]">
        {status === "idle" && <span className="text-muted">Letters, numbers, dots</span>}
        {status === "short" && <span className="text-muted">A little longer…</span>}
        {status === "checking" && (
          <span className="inline-flex items-center gap-1.5 text-muted">
            <Loader2 size={14} className="animate-spin" /> Checking availability…
          </span>
        )}
        {status === "available" && (
          <span className="inline-flex items-center gap-1.5 font-semibold text-brand-greenDark">
            <Check size={14} /> barbr.me/{cleanHandle} is available
          </span>
        )}
        {status === "taken" && (
          <span className="font-semibold text-bad">Taken — try another</span>
        )}
      </div>

      <div className="flex-1" />
      <CtaButton disabled={status !== "available"} onClick={onClaim}>
        Claim @{cleanHandle} <ArrowRight size={18} />
      </CtaButton>
    </>
  );
}
