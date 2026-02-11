"use client";

import { useDeck } from "@/lib/deck-context";
import { WIZARD_STEPS, WizardStep } from "@/types/deck";

const STEP_LABELS: Record<WizardStep, string> = {
  shape: "Shape",
  dimensions: "Size",
  material: "Material",
  pattern: "Pattern",
  railing: "Railing",
  stairs: "Stairs",
  review: "Review",
};

export default function StepNavigation() {
  const { state, dispatch } = useDeck();
  const currentIdx = WIZARD_STEPS.indexOf(state.currentStep);

  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-6">
      <button
        onClick={() => dispatch({ type: "PREV_STEP" })}
        disabled={currentIdx === 0}
        className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Back
      </button>

      <div className="flex gap-2">
        {WIZARD_STEPS.map((step, i) => (
          <button
            key={step}
            onClick={() => dispatch({ type: "SET_STEP", payload: step })}
            className={`
              h-8 min-w-[60px] rounded-full px-3 text-xs font-medium transition-colors
              ${
                i === currentIdx
                  ? "bg-blue-600 text-white"
                  : i < currentIdx
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "bg-gray-100 text-gray-400"
              }
            `}
          >
            {STEP_LABELS[step]}
          </button>
        ))}
      </div>

      <button
        onClick={() => dispatch({ type: "NEXT_STEP" })}
        disabled={currentIdx === WIZARD_STEPS.length - 1}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}
