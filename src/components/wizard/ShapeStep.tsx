"use client";

import { useDeck } from "@/lib/deck-context";
import { DeckShape } from "@/types/deck";
import OptionCard from "@/components/ui/OptionCard";

const SHAPES: { value: DeckShape; label: string; description: string }[] = [
  {
    value: "rectangle",
    label: "Rectangle",
    description: "Simple rectangular deck — the most common and economical shape.",
  },
  {
    value: "l-shape",
    label: "L-Shape",
    description: "Wraps around a corner of the house, creating two distinct areas.",
  },
  {
    value: "t-shape",
    label: "T-Shape",
    description: "Extended section off one side for a dining or seating nook.",
  },
  {
    value: "wrap-around",
    label: "Wrap-Around",
    description: "Runs along two sides of the house for maximum outdoor space.",
  },
];

export default function ShapeStep() {
  const { state, dispatch } = useDeck();

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Deck Shape</h2>
      <p className="text-sm text-gray-500 mb-6">
        Choose the overall footprint of your deck.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SHAPES.map((s) => (
          <OptionCard
            key={s.value}
            label={s.label}
            description={s.description}
            selected={state.config.shape === s.value}
            onClick={() =>
              dispatch({
                type: "UPDATE_CONFIG",
                payload: { shape: s.value },
              })
            }
          />
        ))}
      </div>
    </div>
  );
}
