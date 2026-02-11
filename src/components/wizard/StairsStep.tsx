"use client";

import { useDeck } from "@/lib/deck-context";
import { StairLocation } from "@/types/deck";
import OptionCard from "@/components/ui/OptionCard";
import NumberInput from "@/components/ui/NumberInput";

const LOCATIONS: { value: StairLocation; label: string }[] = [
  { value: "none", label: "None" },
  { value: "front", label: "Front" },
  { value: "back", label: "Back" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
];

export default function StairsStep() {
  const { state, dispatch } = useDeck();
  const { stairs } = state.config;

  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-3">Stairs</h2>

      <div className="flex flex-wrap gap-2">
        {LOCATIONS.map((loc) => (
          <OptionCard
            key={loc.value}
            compact
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
        <div className="mt-4 max-w-[160px]">
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
