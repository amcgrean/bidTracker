"use client";

import { useDeck } from "@/lib/deck-context";
import {
  DeckingMaterial,
  DeckingCategory,
  BoardWidth,
} from "@/types/deck";
import OptionCard from "@/components/ui/OptionCard";

const WOOD_MATERIALS: {
  value: DeckingMaterial;
  label: string;
  description: string;
}[] = [
  {
    value: "pressure-treated",
    label: "Pressure-Treated",
    description: "Most affordable. Stain/seal every 1-2 years.",
  },
  {
    value: "cedar",
    label: "Cedar",
    description: "Naturally rot-resistant. Beautiful grain.",
  },
];

const COMPOSITE_MATERIALS: {
  value: DeckingMaterial;
  label: string;
  description: string;
}[] = [
  { value: "composite-trex", label: "Trex", description: "Transcend, Enhance, Select. 25-yr warranty." },
  { value: "composite-timbertech", label: "TimberTech / AZEK", description: "Premium PVC. 30+ yr warranty." },
  { value: "composite-deckorators", label: "Deckorators", description: "Mineral-based Surestone core." },
  { value: "composite-wolf", label: "Wolf", description: "Serenity & Perspective lines." },
  { value: "composite-moistureshield", label: "MoistureShield", description: "Pool-friendly. Slip-resistant." },
];

export default function MaterialStep() {
  const { state, dispatch } = useDeck();
  const { deckingCategory, material, boardWidth } = state.config;

  const materialOptions =
    deckingCategory === "wood" ? WOOD_MATERIALS : COMPOSITE_MATERIALS;

  function setCategory(cat: DeckingCategory) {
    const defaultMat =
      cat === "wood" ? "pressure-treated" : "composite-trex";
    dispatch({
      type: "UPDATE_CONFIG",
      payload: {
        deckingCategory: cat,
        material: defaultMat as DeckingMaterial,
      },
    });
  }

  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-3">Material</h2>

      {/* Category toggle */}
      <div className="flex gap-2 mb-4">
        <OptionCard compact label="Wood" selected={deckingCategory === "wood"} onClick={() => setCategory("wood")} />
        <OptionCard compact label="Composite" selected={deckingCategory === "composite"} onClick={() => setCategory("composite")} />
      </div>

      {/* Brand/type */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {materialOptions.map((m) => (
          <OptionCard
            key={m.value}
            label={m.label}
            description={m.description}
            selected={material === m.value}
            onClick={() =>
              dispatch({ type: "UPDATE_CONFIG", payload: { material: m.value } })
            }
          />
        ))}
      </div>

      {/* Board width */}
      <h3 className="text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        Board Width
      </h3>
      <div className="flex gap-2">
        {([["5.5", '5.5" (6" nom.)'], ["3.5", '3.5" (4" nom.)']] as const).map(([val, lbl]) => (
          <OptionCard
            key={val}
            compact
            label={lbl}
            selected={boardWidth === val}
            onClick={() =>
              dispatch({ type: "UPDATE_CONFIG", payload: { boardWidth: val as BoardWidth } })
            }
          />
        ))}
      </div>
    </div>
  );
}
