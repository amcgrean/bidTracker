"use client";

import { useDeck } from "@/lib/deck-context";
import { useAutoAdvance } from "@/lib/use-auto-advance";
import { BoardPattern } from "@/types/deck";
import OptionCard from "@/components/ui/OptionCard";

const PATTERNS: { value: BoardPattern; label: string; description: string }[] = [
  { value: "standard", label: "Standard", description: "Parallel to house. Least waste." },
  { value: "diagonal", label: "Diagonal (45°)", description: "Visual interest. ~15% more material." },
  { value: "herringbone", label: "Herringbone", description: "V-pattern. Complex but striking." },
  { value: "picture-frame", label: "Picture Frame", description: "Border frames the perimeter." },
];

export default function PatternStep() {
  const { state } = useDeck();
  const selectAndAdvance = useAutoAdvance();

  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-3">Board Pattern</h2>
      <div className="grid grid-cols-2 gap-2">
        {PATTERNS.map((p) => (
          <OptionCard
            key={p.value}
            label={p.label}
            description={p.description}
            selected={state.config.boardPattern === p.value}
            onClick={() => selectAndAdvance({ boardPattern: p.value })}
          />
        ))}
      </div>
    </div>
  );
}
