"use client";

import { useDeck } from "@/lib/deck-context";
import { BeamType } from "@/types/deck";
import NumberInput from "@/components/ui/NumberInput";
import OptionCard from "@/components/ui/OptionCard";

export default function DimensionsStep() {
  const { state, dispatch } = useDeck();
  const { dimensions, shape, ledgerAttached, beamType, hasHouse } = state.config;
  const showExtension = shape === "l-shape" || shape === "t-shape" || shape === "wrap-around";

  function update(patch: Partial<typeof dimensions>) {
    dispatch({
      type: "UPDATE_CONFIG",
      payload: { dimensions: { ...dimensions, ...patch } },
    });
  }

  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-3">Dimensions</h2>

      <div className="grid grid-cols-3 gap-3">
        <NumberInput
          label="Width"
          value={dimensions.width}
          onChange={(v) => update({ width: v })}
          min={4}
          max={60}
        />
        <NumberInput
          label="Depth"
          value={dimensions.depth}
          onChange={(v) => update({ depth: v })}
          min={4}
          max={40}
        />
        <NumberInput
          label="Height"
          value={dimensions.height}
          onChange={(v) => update({ height: v })}
          min={0.5}
          max={15}
          step={0.5}
        />
      </div>

      {showExtension && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Extension
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              label="Ext. width"
              value={dimensions.extensionWidth ?? 8}
              onChange={(v) => update({ extensionWidth: v })}
              min={4}
              max={40}
            />
            <NumberInput
              label="Ext. depth"
              value={dimensions.extensionDepth ?? 6}
              onChange={(v) => update({ extensionDepth: v })}
              min={4}
              max={30}
            />
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={ledgerAttached}
            disabled={!hasHouse}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_CONFIG",
                payload: { ledgerAttached: e.target.checked },
              })
            }
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700">Ledger-attached to house</span>
          {!hasHouse && <span className="text-xs text-gray-400">(enable house on first step to attach ledger)</span>}
        </label>

        <div>
          <h3 className="text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Beam Type
          </h3>
          <div className="flex gap-2">
            <OptionCard
              compact
              label="Dropped Beam"
              selected={beamType === "dropped"}
              onClick={() =>
                dispatch({ type: "UPDATE_CONFIG", payload: { beamType: "dropped" as BeamType } })
              }
            />
            <OptionCard
              compact
              label="Flush / Engineered"
              selected={beamType === "flush"}
              onClick={() =>
                dispatch({ type: "UPDATE_CONFIG", payload: { beamType: "flush" as BeamType } })
              }
            />
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            {beamType === "flush"
              ? "Engineered beam sits flush with joists — no dropped beam below deck surface."
              : "Standard beam drops below joist level. Most common for residential decks."}
          </p>
        </div>
      </div>
    </div>
  );
}
