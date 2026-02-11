"use client";

import { useDeck } from "@/lib/deck-context";
import { useAutoAdvance } from "@/lib/use-auto-advance";
import { DeckShape, ExteriorFacade } from "@/types/deck";
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

const FACADE_OPTIONS: ExteriorFacade[] = ["vinyl", "brick", "stone", "stucco", "wood"];

export default function ShapeStep() {
  const { state, dispatch } = useDeck();
  const selectAndAdvance = useAutoAdvance();
  const { config } = state;

  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-3">Quote Setup</h2>
      <div className="grid grid-cols-1 gap-3 mb-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Quote Name</label>
          <input
            value={config.quoteName}
            onChange={(e) => dispatch({ type: "UPDATE_CONFIG", payload: { quoteName: e.target.value } })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Customer / project name"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Notes</label>
          <textarea
            value={config.quoteNotes}
            onChange={(e) => dispatch({ type: "UPDATE_CONFIG", payload: { quoteNotes: e.target.value } })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            rows={2}
            placeholder="Site notes, scope, customer requests"
          />
        </div>
      </div>

      <div className="rounded-md border border-gray-200 p-3 mb-4 bg-gray-50/60 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.hasHouse}
            onChange={(e) => dispatch({ type: "UPDATE_CONFIG", payload: { hasHouse: e.target.checked, ledgerAttached: e.target.checked ? config.ledgerAttached : false } })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700">House present next to deck</span>
        </label>

        {config.hasHouse && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Exterior Facade</label>
              <select
                value={config.exteriorFacade}
                onChange={(e) => dispatch({ type: "UPDATE_CONFIG", payload: { exteriorFacade: e.target.value as ExteriorFacade } })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm capitalize"
              >
                {FACADE_OPTIONS.map((fac) => (
                  <option key={fac} value={fac}>{fac}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.patioDoor}
                onChange={(e) => dispatch({ type: "UPDATE_CONFIG", payload: { patioDoor: e.target.checked } })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Show patio door on house wall</span>
            </label>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">House Color</label>
              <input
                type="color"
                value={config.houseColor}
                onChange={(e) => dispatch({ type: "UPDATE_CONFIG", payload: { houseColor: e.target.value } })}
                className="h-8 w-10 rounded border border-gray-300"
              />
              <span className="text-xs text-gray-500">{config.houseColor}</span>
            </div>
          </>
        )}

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.showGrass}
            onChange={(e) => dispatch({ type: "UPDATE_CONFIG", payload: { showGrass: e.target.checked } })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700">Show grass under deck in 3D</span>
        </label>
      </div>

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
