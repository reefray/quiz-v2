"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Eyebrow from "../Eyebrow";
import OptionButton from "../OptionButton";
import CtaButton from "../CtaButton";
import { BOOKING_METHODS } from "@/lib/quizContent";

/**
 * Step 0 — how are you taking bookings now? Most options auto-advance; "Other"
 * instead reveals an inline text field + Continue (captures the typed system).
 */
export default function BookingMethodScreen({
  selected,
  onSelect,
  otherSystem,
  setOtherSystem,
  onSelectOther,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
  otherSystem: string;
  setOtherSystem: (v: string) => void;
  onSelectOther: () => void;
}) {
  const [otherOpen, setOtherOpen] = useState(selected === "other");

  return (
    <>
      <Eyebrow>Question 1 of 2</Eyebrow>
      <h1 className="text-heading font-bold text-ink">
        How are you taking bookings right now?
      </h1>
      <div className="mt-5 flex flex-col gap-2">
        {BOOKING_METHODS.map(({ id, label, sub, emoji }) =>
          id === "other" ? (
            <div key={id}>
              <OptionButton
                label={label}
                sub={sub}
                emoji={emoji}
                selected={otherOpen}
                onClick={() => setOtherOpen(true)}
              />
              {otherOpen && (
                <>
                  <div className="mt-2 flex items-center rounded-input border-[1.5px] border-line bg-surface px-4 transition focus-within:border-brand-green">
                    <input
                      autoFocus
                      value={otherSystem}
                      placeholder="Which app or system?"
                      onChange={(e) => setOtherSystem(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent py-3.5 text-[15.5px] text-ink outline-none placeholder:text-faint"
                    />
                  </div>
                  <CtaButton onClick={onSelectOther}>
                    Continue <ArrowRight size={18} />
                  </CtaButton>
                </>
              )}
            </div>
          ) : (
            <OptionButton
              key={id}
              label={label}
              sub={sub}
              emoji={emoji}
              selected={selected === id}
              onClick={() => onSelect(id)}
            />
          )
        )}
      </div>
    </>
  );
}
