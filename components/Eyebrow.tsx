import { ReactNode } from "react";

/** Step label above each heading — small, super-bold (900), uppercase, accent green. */
export default function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-eyebrow font-black uppercase text-brand-greenDark">
      {children}
    </p>
  );
}
