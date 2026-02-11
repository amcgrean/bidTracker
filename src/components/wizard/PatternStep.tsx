"use client";

import { useDeck } from "@/lib/deck-context";
import { useAutoAdvance } from "@/lib/use-auto-advance";
import { BoardPattern } from "@/types/deck";
import OptionCard from "@/components/ui/OptionCard";

const PATTERNS: { value: BoardPattern; label: string; description: string }[] =
  [
    {
      value: "standard",
      label: "Standard (Parallel)",
      description:
        "Boards run parallel to the house. Simplest to install, least waste.",
    },
    {
      value: "diagonal",
      label: "Diagonal (45 degrees)",
      description:
        "Boards at 45 degrees for visual interest. ~15% more material.",
    },
    {
      value: "herringbone",
      label: "Herringbone",
      description:
        "V-pattern with boards at alternating angles. Complex but striking.",
    },
    {
      value: "picture-frame",
      label: "Picture Frame",
      description:
        "Border boards frame the perimeter with a different direction inside.",
    },
  ];

export default function PatternStep() {
  const { state } = useDeck();
  const selectAndAdvance = useAutoAdvance();

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Board Pattern</h2>
      <p className="text-sm text-gray-500 mb-6">
        Choose how the decking boards are laid out.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
