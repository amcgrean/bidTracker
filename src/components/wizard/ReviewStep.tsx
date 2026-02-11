"use client";

import { useDeck } from "@/lib/deck-context";
import { estimateMaterials } from "@/lib/materials";

export default function ReviewStep() {
  const { state } = useDeck();
  const { config } = state;
  const materials = estimateMaterials(config);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        Review &amp; Estimate
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Review your selections and see the estimated material list.
      </p>

      {/* Config summary */}
      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <h3 className="font-semibold text-gray-800 mb-2">Your Deck</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-gray-500">Shape</dt>
          <dd className="text-gray-900">{config.shape}</dd>
          <dt className="text-gray-500">Size</dt>
          <dd className="text-gray-900">
            {config.dimensions.width}&apos; x {config.dimensions.depth}&apos;
            {config.dimensions.extensionWidth
              ? ` + ${config.dimensions.extensionWidth}' x ${config.dimensions.extensionDepth}'`
              : ""}
          </dd>
          <dt className="text-gray-500">Height</dt>
          <dd className="text-gray-900">{config.dimensions.height} ft</dd>
          <dt className="text-gray-500">Decking</dt>
          <dd className="text-gray-900">{config.material} ({config.deckingCategory})</dd>
          <dt className="text-gray-500">Pattern</dt>
          <dd className="text-gray-900">{config.boardPattern}</dd>
          <dt className="text-gray-500">Railing</dt>
          <dd className="text-gray-900">
            {config.railing}{config.railingBrand !== "generic" ? ` — ${config.railingBrand}` : ""}
          </dd>
          <dt className="text-gray-500">Stairs</dt>
          <dd className="text-gray-900">
            {config.stairs.location === "none"
              ? "None"
              : `${config.stairs.location} (${config.stairs.width}' wide)`}
          </dd>
          <dt className="text-gray-500">Ledger</dt>
          <dd className="text-gray-900">
            {config.ledgerAttached ? "Yes" : "Freestanding"}
          </dd>
        </dl>
      </div>

      {/* Material table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-2 font-medium">Item</th>
              <th className="pb-2 font-medium">Qty</th>
              <th className="pb-2 font-medium">Unit</th>
              <th className="pb-2 font-medium text-right">Est. Cost</th>
            </tr>
          </thead>
          <tbody>
            {materials.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-400">
                    {item.description}
                  </div>
                </td>
                <td className="py-2 text-gray-700">{item.quantity}</td>
                <td className="py-2 text-gray-700">{item.unit}</td>
                <td className="py-2 text-right text-gray-700">
                  ${item.totalCost.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300">
              <td colSpan={3} className="pt-3 font-bold text-gray-900">
                Estimated Total
              </td>
              <td className="pt-3 text-right font-bold text-gray-900">
                ${materials.totalCost.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Notes */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-600 mb-1">Notes</h4>
        <ul className="list-disc pl-5 text-xs text-gray-500 space-y-0.5">
          {materials.notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
