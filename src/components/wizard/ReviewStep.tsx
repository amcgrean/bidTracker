"use client";

import { useRef } from "react";
import { useDeck } from "@/lib/deck-context";
import { estimateMaterials } from "@/lib/materials";

function formatMaterial(mat: string): string {
  return mat
    .replace("composite-", "")
    .replace("pressure-treated", "Pressure-Treated")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function exportToPdf(el: HTMLElement) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Deck Material Estimate</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        h2 { font-size: 16px; margin-top: 18px; margin-bottom: 8px; color: #444; }
        .subtitle { font-size: 12px; color: #888; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { padding: 6px 8px; border-bottom: 1px solid #ddd; text-align: left; }
        th { color: #666; font-weight: 600; }
        .cost { text-align: right; }
        .total td { border-top: 2px solid #333; font-weight: bold; padding-top: 10px; }
        dl { display: grid; grid-template-columns: 120px 1fr; gap: 2px 12px; font-size: 13px; }
        dt { color: #666; }
        dd { margin: 0; }
        .notes { font-size: 11px; color: #888; margin-top: 16px; }
        .notes li { margin-bottom: 2px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>Deck Material Estimate</h1>
      <div class="subtitle">Beisser Lumber Company &mdash; Generated ${new Date().toLocaleDateString()}</div>
      ${el.innerHTML}
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

export default function ReviewStep() {
  const { state } = useDeck();
  const { config } = state;
  const materials = estimateMaterials(config);
  const printRef = useRef<HTMLDivElement>(null);

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : "";

  return (
    <div>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-900">
          Review &amp; Estimate
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
            }}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Copy Link
          </button>
          <button
            onClick={() => printRef.current && exportToPdf(printRef.current)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            Export PDF
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Review your selections and see the estimated material list.
      </p>

      <div ref={printRef}>
        {/* Config summary */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Your Deck</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-gray-500">Shape</dt>
            <dd className="text-gray-900 capitalize">{config.shape.replace("-", " ")}</dd>
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
            <dd className="text-gray-900">
              {formatMaterial(config.material)} ({config.deckingCategory})
            </dd>
            <dt className="text-gray-500">Pattern</dt>
            <dd className="text-gray-900 capitalize">{config.boardPattern.replace("-", " ")}</dd>
            <dt className="text-gray-500">Railing</dt>
            <dd className="text-gray-900 capitalize">
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
    </div>
  );
}
