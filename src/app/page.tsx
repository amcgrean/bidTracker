"use client";

import { DeckProvider } from "@/lib/deck-context";
import WizardPanel from "@/components/wizard/WizardPanel";
import DeckCanvas from "@/components/deck-renderer/DeckCanvas";

export default function Home() {
  return (
    <DeckProvider>
      <div className="flex h-screen flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
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

        {/* Main content: wizard on left, canvas on right */}
        <div className="flex flex-1 overflow-hidden">
          {/* Wizard panel */}
          <aside className="w-full max-w-md border-r border-gray-200 bg-white overflow-y-auto">
            <WizardPanel />
          </aside>

          {/* 2D Preview */}
          <main className="flex-1 p-4">
            <DeckCanvas />
          </main>
        </div>
      </div>
    </DeckProvider>
  );
}
