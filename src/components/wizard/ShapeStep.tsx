"use client";

import { useDeck } from "@/lib/deck-context";
import { useAutoAdvance } from "@/lib/use-auto-advance";
import { DeckShape } from "@/types/deck";
import OptionCard from "@/components/ui/OptionCard";

const SHAPES: { value: DeckShape; label: string; description: string }[] = [
  {
    value: "rectangle",
    label: "Rectangle",
    description: "Simple rectangular — most common and economical.",
  },
  {
    value: "l-shape",
    label: "L-Shape",
    description: "Wraps a corner, creating two distinct areas.",
  },
  {
    value: "t-shape",
    label: "T-Shape",
    description: "Extended section for a dining or seating nook.",
  },
  {
    value: "wrap-around",
    label: "Wrap-Around",
    description: "Runs along two sides for maximum space.",
  },
];

export default function ShapeStep() {
  const { state } = useDeck();
  const selectAndAdvance = useAutoAdvance();

  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-3">Deck Shape</h2>
      <div className="grid grid-cols-2 gap-2">
        {SHAPES.map((s) => (
          <OptionCard
            key={s.value}
            label={s.label}
            description={s.description}
            selected={state.config.shape === s.value}
            onClick={() => selectAndAdvance({ shape: s.value })}
          />
        ))}
      </div>
    </div>
  );
}
