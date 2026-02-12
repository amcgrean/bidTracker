"use client";

import { useState } from "react";
import { DeckProvider } from "@/lib/deck-context";
import WizardPanel from "@/components/wizard/WizardPanel";
import DeckCanvas, { type RenderMode } from "@/components/deck-renderer/DeckCanvas";

const RENDER_MODES: Array<{ value: RenderMode; label: string }> = [
  { value: "surface", label: "Surface" },
  { value: "framing", label: "Framing" },
  { value: "elevation", label: "Side Railing" },
  { value: "isometric", label: "Isometric" },
];

export default function Home() {
  const [mobileTab, setMobileTab] = useState<"wizard" | "preview">("wizard");
  const [renderMode, setRenderMode] = useState<RenderMode>("surface");

  return (
    <DeckProvider>
      <div className="flex h-screen flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Deck Configurator</h1>
            <p className="text-xs text-gray-500">
              Design your deck &middot; See a 2D preview &middot; Get a material estimate
            </p>
          </div>
        </header>

        <div className="flex border-b border-gray-200 sm:hidden">
          <button
            onClick={() => setMobileTab("wizard")}
            className={`flex-1 py-2.5 text-center text-sm font-medium transition-colors ${
              mobileTab === "wizard"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
            }`}
          >
            Configure
          </button>
          <button
            onClick={() => setMobileTab("preview")}
            className={`flex-1 py-2.5 text-center text-sm font-medium transition-colors ${
              mobileTab === "preview"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
            }`}
          >
            Preview
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <aside
            className={`w-full border-r border-gray-200 bg-white overflow-y-auto sm:block sm:max-w-md ${
              mobileTab === "wizard" ? "block" : "hidden"
            }`}
          >
            <WizardPanel />
          </aside>

          <main
            className={`flex-1 p-4 sm:block sm:p-4 ${
              mobileTab === "preview" ? "block" : "hidden"
            }`}
          >
            <div className="flex h-full flex-col gap-3">
              <div className="-mx-1 overflow-x-auto px-1 pb-1">
                <div className="flex min-w-max gap-2">
                  {RENDER_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setRenderMode(mode.value)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                        renderMode === mode.value
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="min-h-0 flex-1">
                <DeckCanvas renderMode={renderMode} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </DeckProvider>
  );
}
