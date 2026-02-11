"use client";

import { useEffect, useRef, useState } from "react";
import { useDeck } from "@/lib/deck-context";
import { estimateMaterials } from "@/lib/materials";

interface QuoteSummary {
  id: number;
  quote_number: string;
  quote_name: string;
  updated_at: string;
}

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
    <head><title>Deck Material Estimate</title></head>
    <body style="font-family: Arial, sans-serif; padding: 24px; color: #222;">
      <h1 style="margin-bottom: 6px;">Deck Material Estimate</h1>
      ${el.innerHTML}
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 250);
}

export default function ReviewStep() {
  const { state, dispatch } = useDeck();
  const { config } = state;
  const materials = estimateMaterials(config);
  const printRef = useRef<HTMLDivElement>(null);
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [savingQuote, setSavingQuote] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  async function refreshQuotes() {
    const res = await fetch("/api/quotes");
    const data = await res.json();
    setQuotes(data.quotes ?? []);
  }

  async function saveCurrentQuote() {
    setSavingQuote(true);
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteName: config.quoteName || "Untitled Quote",
        notes: config.quoteNotes,
        quoteNumber: config.quoteNumber,
        config,
      }),
    });
    const data = await res.json();
    dispatch({ type: "UPDATE_CONFIG", payload: { quoteNumber: data.quoteNumber } });
    await refreshQuotes();
    setSavingQuote(false);
  }

  async function loadQuote(id: number) {
    const res = await fetch(`/api/quotes?id=${id}`);
    const data = await res.json();
    if (data.quote?.config_json) {
      const loaded = JSON.parse(data.quote.config_json);
      dispatch({ type: "LOAD_CONFIG", payload: loaded });
    }
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refreshQuotes();
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-900">Review &amp; Estimate</h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
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

      <div className="mt-3 mb-4 rounded-lg border border-gray-200 p-3 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Quote Name</label>
            <input
              value={config.quoteName}
              onChange={(e) => dispatch({ type: "UPDATE_CONFIG", payload: { quoteName: e.target.value } })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Quote Number</label>
            <div className="h-10 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {config.quoteNumber || "(auto-generated when saved)"}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Quote Notes</label>
          <textarea
            value={config.quoteNotes}
            onChange={(e) => dispatch({ type: "UPDATE_CONFIG", payload: { quoteNotes: e.target.value } })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            rows={2}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={saveCurrentQuote}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
          >
            {savingQuote ? "Saving..." : "Save Quote"}
          </button>
          <button
            onClick={() => void refreshQuotes()}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Refresh Saved Quotes
          </button>
        </div>
        {quotes.length > 0 && (
          <div className="mt-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Open Existing Quote</label>
            <div className="flex gap-2 flex-wrap">
              {quotes.slice(0, 8).map((q) => (
                <button
                  key={q.id}
                  onClick={() => void loadQuote(q.id)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                >
                  {q.quote_number} — {q.quote_name || "Untitled"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div ref={printRef}>
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Your Deck</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-gray-500">Quote</dt>
            <dd className="text-gray-900">{config.quoteName || "Untitled"} {config.quoteNumber ? `(${config.quoteNumber})` : ""}</dd>
            <dt className="text-gray-500">Shape</dt>
            <dd className="text-gray-900 capitalize">{config.shape.replace("-", " ")}</dd>
            <dt className="text-gray-500">Size</dt>
            <dd className="text-gray-900">{config.dimensions.width}&apos; x {config.dimensions.depth}&apos;</dd>
            <dt className="text-gray-500">Height</dt>
            <dd className="text-gray-900">{config.dimensions.height} ft</dd>
            <dt className="text-gray-500">Decking</dt>
            <dd className="text-gray-900">{formatMaterial(config.material)} ({config.deckingCategory})</dd>
            <dt className="text-gray-500">Railing</dt>
            <dd className="text-gray-900 capitalize">{config.railing}</dd>
            <dt className="text-gray-500">House</dt>
            <dd className="text-gray-900">{config.hasHouse ? `${config.exteriorFacade} facade` : "No house"}</dd>
          </dl>
        </div>

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
                  <td className="py-2"><div className="font-medium text-gray-900">{item.name}</div><div className="text-xs text-gray-400">{item.description}</div></td>
                  <td className="py-2 text-gray-700">{item.quantity}</td>
                  <td className="py-2 text-gray-700">{item.unit}</td>
                  <td className="py-2 text-right text-gray-700">${item.totalCost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300">
                <td colSpan={3} className="pt-3 font-bold text-gray-900">Estimated Total</td>
                <td className="pt-3 text-right font-bold text-gray-900">${materials.totalCost.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
