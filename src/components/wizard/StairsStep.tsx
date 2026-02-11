"use client";

import { useDeck } from "@/lib/deck-context";
import { StairLocation } from "@/types/deck";
import OptionCard from "@/components/ui/OptionCard";
import NumberInput from "@/components/ui/NumberInput";

const LOCATIONS: { value: StairLocation; label: string }[] = [
  { value: "none", label: "No Stairs" },
  { value: "front", label: "Front" },
  { value: "back", label: "Back" },
  { value: "left", label: "Left Side" },
  { value: "right", label: "Right Side" },
];

export default function StairsStep() {
  const { state, dispatch } = useDeck();
  const { stairs } = state.config;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Stairs</h2>
      <p className="text-sm text-gray-500 mb-6">
        Add stairs to access the deck from the yard.
      </p>

      <div className="flex flex-wrap gap-3">
        {LOCATIONS.map((loc) => (
          <OptionCard
            key={loc.value}
            label={loc.label}
            selected={stairs.location === loc.value}
            onClick={() =>
              dispatch({
                type: "UPDATE_CONFIG",
                payload: { stairs: { ...stairs, location: loc.value } },
              })
            }
          />
        ))}
      </div>

      {stairs.location !== "none" && (
        <div className="mt-6 max-w-xs">
          <NumberInput
            label="Stair width"
            value={stairs.width}
            onChange={(v) =>
              dispatch({
                type: "UPDATE_CONFIG",
                payload: { stairs: { ...stairs, width: v } },
              })
            }
            min={3}
            max={8}
          />
        </div>
      )}
    </div>
  );
}
