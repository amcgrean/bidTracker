"use client";

import { useState } from "react";
import { DeckProvider } from "@/lib/deck-context";
import WizardPanel from "@/components/wizard/WizardPanel";
import DeckCanvas from "@/components/deck-renderer/DeckCanvas";

export default function Home() {
  const [mobileTab, setMobileTab] = useState<"wizard" | "preview">("wizard");

  return (
    <DeckProvider>
      <div className="flex h-screen flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Deck Configurator
            </h1>
            <p className="text-xs text-gray-500">
              Design your deck &middot; See a 2D preview &middot; Get a material
              estimate
            </p>
          </div>
        </header>

        {/* Mobile tab switcher */}
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

        {/* Main content: side-by-side on desktop, tabbed on mobile */}
        <div className="flex flex-1 overflow-hidden">
          {/* Wizard panel */}
          <aside
            className={`w-full border-r border-gray-200 bg-white overflow-y-auto sm:block sm:max-w-md ${
              mobileTab === "wizard" ? "block" : "hidden"
            }`}
          >
            <WizardPanel />
          </aside>

          {/* 2D Preview */}
          <main
            className={`flex-1 p-4 sm:block ${
              mobileTab === "preview" ? "block" : "hidden"
            }`}
          >
            <DeckCanvas />
          </main>
        </div>
      </div>
    </DeckProvider>
  );
}
