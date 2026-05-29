import Eyebrow from "../Eyebrow";
import OptionButton from "../OptionButton";
import { HEADACHES_DM, HEADACHES_COMP } from "@/lib/quizContent";

/**
 * Step 1 — biggest headache. The option list branches on whether the barber is
 * already on a competitor app (Booksy/Fresha/Other) vs DMs/paper. No subtitle.
 */
export default function HeadacheScreen({
  isComp,
  selected,
  onSelect,
}: {
  isComp: boolean;
  selected: string | null;
  onSelect: (headache: string) => void;
}) {
  const headaches = isComp ? HEADACHES_COMP : HEADACHES_DM;

  return (
    <>
      <Eyebrow>Question 2 of 2</Eyebrow>
      <h1 className="text-heading font-bold text-ink">
        What&apos;s your biggest headache?
      </h1>
      <div className="mt-5 flex flex-col gap-2">
        {headaches.map(({ label, emoji }) => (
          <OptionButton
            key={label}
            label={label}
            emoji={emoji}
            selected={selected === label}
            onClick={() => onSelect(label)}
          />
        ))}
      </div>
    </>
  );
}
