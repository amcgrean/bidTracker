"use client";

import { useDeck } from "@/lib/deck-context";
import NumberInput from "@/components/ui/NumberInput";

export default function DimensionsStep() {
  const { state, dispatch } = useDeck();
  const { dimensions, shape, ledgerAttached } = state.config;
  const showExtension = shape === "l-shape" || shape === "t-shape" || shape === "wrap-around";

  function update(patch: Partial<typeof dimensions>) {
    dispatch({
      type: "UPDATE_CONFIG",
      payload: { dimensions: { ...dimensions, ...patch } },
    });
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Dimensions</h2>
      <p className="text-sm text-gray-500 mb-6">
        Enter the size of your deck in feet.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          label="Height from ground"
          value={dimensions.height}
          onChange={(v) => update({ height: v })}
          min={0.5}
          max={15}
          step={0.5}
        />
      </div>

      {showExtension && (
        <div className="mt-6">
          <h3 className="text-md font-semibold text-gray-800 mb-3">
            Extension Section
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberInput
              label="Extension width"
              value={dimensions.extensionWidth ?? 8}
              onChange={(v) => update({ extensionWidth: v })}
              min={4}
              max={40}
            />
            <NumberInput
              label="Extension depth"
              value={dimensions.extensionDepth ?? 6}
              onChange={(v) => update({ extensionDepth: v })}
              min={4}
              max={30}
            />
          </div>
        </div>
      )}

      <div className="mt-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={ledgerAttached}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_CONFIG",
                payload: { ledgerAttached: e.target.checked },
              })
            }
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700">
            Attached to house (ledger board)
          </span>
        </label>
      </div>
    </div>
  );
}
