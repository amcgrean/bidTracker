"use client";

import { useMemo } from "react";
import { useDeck } from "@/lib/deck-context";
import OptionCard from "@/components/ui/OptionCard";
import { BRAND_CATALOG, getDeckLines } from "@/lib/brand-data";
import { DeckingBrand, DeckingLine } from "@/lib/brand-data";


function toDeckMaterial(brandName: string) {
  if (brandName.startsWith("Trex")) return "composite-trex" as const;
  if (brandName.startsWith("TimberTech")) return "composite-timbertech" as const;
  if (brandName.startsWith("MoistureShield")) return "composite-moistureshield" as const;
  if (brandName.startsWith("Wolf")) return "composite-wolf" as const;
  return "composite-deckorators" as const;
}

export default function MaterialStep() {
  const { state, dispatch } = useDeck();
  const {
    activeDeckBrand,
    activeDeckLine,
    activeDeckColor,
  } = state.config;

  const brands = BRAND_CATALOG.decking_brands;

  const selectedBrand = useMemo<DeckingBrand>(() => {
    return brands.find((brand) => brand.brand === activeDeckBrand) ?? brands[0];
  }, [activeDeckBrand, brands]);

  const lines = useMemo<DeckingLine[]>(() => getDeckLines(selectedBrand), [selectedBrand]);

  const selectedLine =
    lines.find((line) => line.name === activeDeckLine) ?? lines[0];

  const selectedColor =
    selectedLine?.colors.find((color) => color.hex === activeDeckColor) ??
    selectedLine?.colors[0];

  function setBrand(nextBrand: DeckingBrand) {
    const nextLines = getDeckLines(nextBrand);
    const nextLine = nextLines[0];
    const nextColor = nextLine?.colors[0];

    dispatch({
      type: "UPDATE_CONFIG",
      payload: {
        deckingCategory: "composite",
        material: toDeckMaterial(nextBrand.brand),
        activeDeckBrand: nextBrand.brand,
        activeDeckLine: nextLine?.name ?? "",
        activeDeckColor: nextColor?.hex ?? activeDeckColor,
      },
    });
  }

  function setLine(line: DeckingLine) {
    const firstColor = line.colors[0];
    dispatch({
      type: "UPDATE_CONFIG",
      payload: {
        activeDeckLine: line.name,
        activeDeckColor: firstColor?.hex ?? activeDeckColor,
      },
    });
  }

  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-3">Material Selection</h2>

      <h3 className="text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        Brand
      </h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {brands.map((brand) => (
          <OptionCard
            key={brand.brand}
            compact
            label={brand.brand}
            selected={selectedBrand.brand === brand.brand}
            onClick={() => setBrand(brand)}
          />
        ))}
      </div>

      <h3 className="text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        Line
      </h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {lines.map((line) => (
          <OptionCard
            key={line.name}
            compact
            label={line.name}
            selected={selectedLine?.name === line.name}
            onClick={() => setLine(line)}
          />
        ))}
      </div>

      <h3 className="text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        Color
      </h3>
      <div className="flex flex-wrap gap-3">
        {selectedLine?.colors.map((color) => (
          <button
            key={color.name}
            type="button"
            onClick={() =>
              dispatch({
                type: "UPDATE_CONFIG",
                payload: {
                  activeDeckColor: color.hex,
                },
              })
            }
            className="flex items-center gap-2"
            title={`${color.name}${color.finish ? ` • ${color.finish}` : ""}`}
          >
            <span
              className={`h-7 w-7 rounded-full border-2 ${
                activeDeckColor === color.hex ? "border-gray-900" : "border-gray-300"
              }`}
              style={{ backgroundColor: color.hex }}
            />
            <span className="text-xs text-gray-700">{color.name}</span>
          </button>
        ))}
      </div>

      {selectedColor && (
        <p className="mt-3 text-xs text-gray-500">
          Selected: {selectedColor.name}
          {selectedColor.finish ? ` (${selectedColor.finish})` : ""}
        </p>
      )}
    </div>
  );
}
