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
    <div className="flex items-center justify-between border-t border-gray-200 pt-4 gap-2 sm:pt-6">
      <button
        onClick={() => dispatch({ type: "PREV_STEP" })}
        disabled={currentIdx === 0}
        className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed sm:px-4"
      >
        Back
      </button>

      <div className="flex gap-1 overflow-x-auto sm:gap-2">
        {WIZARD_STEPS.map((step, i) => (
          <button
            key={step}
            onClick={() => dispatch({ type: "SET_STEP", payload: step })}
            className={`
              h-7 min-w-[28px] rounded-full px-1.5 text-[10px] font-medium transition-colors shrink-0
              sm:h-8 sm:min-w-[60px] sm:px-3 sm:text-xs
              ${
                i === currentIdx
                  ? "bg-blue-600 text-white"
                  : i < currentIdx
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "bg-gray-100 text-gray-400"
              }
            `}
          >
            <span className="hidden sm:inline">{STEP_LABELS[step]}</span>
            <span className="sm:hidden">{i + 1}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => dispatch({ type: "NEXT_STEP" })}
        disabled={currentIdx === WIZARD_STEPS.length - 1}
        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed sm:px-4"
      >
        Next
      </button>
    </div>
  );
}
