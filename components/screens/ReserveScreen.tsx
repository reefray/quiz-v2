import { Lock, Mail } from "lucide-react";
import Eyebrow from "../Eyebrow";
import CtaButton from "../CtaButton";

/** Step 4 — reserve the link with an email (the account key). */
export default function ReserveScreen({
  cleanHandle,
  email,
  setEmail,
  onReserve,
}: {
  cleanHandle: string;
  email: string;
  setEmail: (v: string) => void;
  onReserve: () => void;
}) {
  const canReserve = email.includes("@") && email.length >= 5;

  return (
    <>
      <Eyebrow>Almost yours</Eyebrow>
      <h1 className="text-heading font-bold text-ink">
        Reserve <span className="text-brand-greenDark">@{cleanHandle}</span>
      </h1>
      <p className="mt-2 text-subtitle text-muted">
        Drop your email and we&apos;ll hold it for 24 hours and send your setup link.
      </p>

      <div className="mt-3 flex items-center gap-2 rounded-input border-[1.5px] border-line bg-surface px-4 transition focus-within:border-brand-green">
        <Mail size={18} className="flex-none text-faint" />
        <input
          autoFocus
          type="email"
          inputMode="email"
          value={email}
          placeholder="you@email.com"
          onChange={(e) => setEmail(e.target.value)}
          className="min-w-0 flex-1 bg-transparent py-3.5 text-[16px] text-ink outline-none placeholder:text-faint"
        />
      </div>

      <div className="flex-1" />
      <CtaButton disabled={!canReserve} onClick={onReserve}>
        Reserve my link <Lock size={16} />
      </CtaButton>
      <p className="mt-3 text-[11.5px] leading-snug text-muted">
        No spam — just your setup link and a heads-up before your hold expires.
      </p>
    </>
  );
}
