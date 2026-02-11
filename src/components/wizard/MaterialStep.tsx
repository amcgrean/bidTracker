"use client";

import { useDeck } from "@/lib/deck-context";
import {
  DeckingMaterial,
  DeckingCategory,
  BoardWidth,
} from "@/types/deck";
import OptionCard from "@/components/ui/OptionCard";

const CATEGORIES: {
  value: DeckingCategory;
  label: string;
  description: string;
}[] = [
  {
    value: "wood",
    label: "Wood Decking",
    description: "Traditional lumber — pressure-treated or cedar.",
  },
  {
    value: "composite",
    label: "Composite Decking",
    description: "Low-maintenance boards from Trex, TimberTech, Wolf, and more.",
  },
];

const WOOD_MATERIALS: {
  value: DeckingMaterial;
  label: string;
  description: string;
}[] = [
  {
    value: "pressure-treated",
    label: "Pressure-Treated Lumber",
    description: "Most affordable. Requires staining/sealing every 1-2 years.",
  },
  {
    value: "cedar",
    label: "Cedar",
    description: "Naturally rot-resistant with beautiful grain. Moderate cost.",
  },
];

const COMPOSITE_MATERIALS: {
  value: DeckingMaterial;
  label: string;
  description: string;
}[] = [
  {
    value: "composite-trex",
    label: "Trex",
    description:
      "Industry leader. Transcend, Enhance, and Select lines. 25-year warranty.",
  },
  {
    value: "composite-timbertech",
    label: "TimberTech / AZEK",
    description:
      "Premium composite and PVC lines. Advanced cap technology. 30+ year warranty.",
  },
  {
    value: "composite-deckorators",
    label: "Deckorators",
    description:
      "Mineral-based composite. Surestone core resists moisture and mold.",
  },
  {
    value: "composite-wolf",
    label: "Wolf Home Products",
    description:
      "Serenity and Perspective lines. Natural wood look with lasting performance.",
  },
  {
    value: "composite-moistureshield",
    label: "MoistureShield",
    description:
      "Built for wet environments. Heat-tolerant, slip-resistant, pool-friendly.",
  },
];

const BOARD_WIDTHS: { value: BoardWidth; label: string }[] = [
  { value: "5.5", label: '5.5" (nominal 6")' },
  { value: "3.5", label: '3.5" (nominal 4")' },
];

export default function MaterialStep() {
  const { state, dispatch } = useDeck();
  const { deckingCategory, material } = state.config;

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
      <h2 className="text-xl font-bold text-gray-900 mb-1">Decking Material</h2>
      <p className="text-sm text-gray-500 mb-6">
        Choose between wood and composite, then pick a specific product.
      </p>

      {/* Category selector */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-6">
        {CATEGORIES.map((c) => (
          <OptionCard
            key={c.value}
            label={c.label}
            description={c.description}
            selected={deckingCategory === c.value}
            onClick={() => setCategory(c.value)}
          />
        ))}
      </div>

      {/* Specific material / brand */}
      <h3 className="text-md font-semibold text-gray-800 mb-3">
        {deckingCategory === "wood" ? "Wood Type" : "Brand"}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {materialOptions.map((m) => (
          <OptionCard
            key={m.value}
            label={m.label}
            description={m.description}
            selected={material === m.value}
            onClick={() =>
              dispatch({
                type: "UPDATE_CONFIG",
                payload: { material: m.value },
              })
            }
          />
        ))}
      </div>

      {/* Board width */}
      <h3 className="mt-6 text-md font-semibold text-gray-800 mb-3">
        Board Width
      </h3>
      <div className="flex gap-3">
        {BOARD_WIDTHS.map((bw) => (
          <OptionCard
            key={bw.value}
            label={bw.label}
            selected={state.config.boardWidth === bw.value}
            onClick={() =>
              dispatch({
                type: "UPDATE_CONFIG",
                payload: { boardWidth: bw.value },
              })
            }
          />
        ))}
      </div>
    </div>
  );
}
