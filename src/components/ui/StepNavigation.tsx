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
    <div className="flex items-center gap-2 border-t border-gray-200 pt-3">
      <button
        onClick={() => dispatch({ type: "PREV_STEP" })}
        disabled={currentIdx === 0}
        className="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Back
      </button>

      <div className="flex flex-1 justify-center gap-1">
        {WIZARD_STEPS.map((step, i) => (
          <button
            key={step}
            onClick={() => dispatch({ type: "SET_STEP", payload: step })}
            title={STEP_LABELS[step]}
            className={`
              h-2 w-2 rounded-full transition-all shrink-0
              ${i === currentIdx ? "bg-blue-600 scale-125" : ""}
              ${i < currentIdx ? "bg-blue-300" : ""}
              ${i > currentIdx ? "bg-gray-200" : ""}
            `}
          />
        ))}
      </div>

      <button
        onClick={() => dispatch({ type: "NEXT_STEP" })}
        disabled={currentIdx === WIZARD_STEPS.length - 1}
        className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}
