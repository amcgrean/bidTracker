"use client";

import { useDeck } from "@/lib/deck-context";
import { WIZARD_STEPS, WizardStep } from "@/types/deck";
import StepNavigation from "@/components/ui/StepNavigation";
import ShapeStep from "./ShapeStep";
import DimensionsStep from "./DimensionsStep";
import MaterialStep from "./MaterialStep";
import PatternStep from "./PatternStep";
import RailingStep from "./RailingStep";
import StairsStep from "./StairsStep";
import ReviewStep from "./ReviewStep";

const STEP_LABELS: Record<WizardStep, string> = {
  shape: "Shape",
  dimensions: "Size",
  material: "Material",
  pattern: "Pattern",
  railing: "Railing",
  stairs: "Stairs",
  review: "Review",
};

export default function WizardPanel() {
  const { state, dispatch } = useDeck();
  const currentIdx = WIZARD_STEPS.indexOf(state.currentStep);

  const stepComponent = {
    shape: <ShapeStep />,
    dimensions: <DimensionsStep />,
    material: <MaterialStep />,
    pattern: <PatternStep />,
    railing: <RailingStep />,
    stairs: <StairsStep />,
    review: <ReviewStep />,
  }[state.currentStep];

  return (
    <div className="flex h-full flex-col">
      {/* Step tabs at the top */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {WIZARD_STEPS.map((step, i) => (
          <button
            key={step}
            onClick={() => dispatch({ type: "SET_STEP", payload: step })}
            className={`
              shrink-0 px-3 py-2 text-xs font-medium border-b-2 transition-colors
              ${
                i === currentIdx
                  ? "border-blue-600 text-blue-600 bg-blue-50/50"
                  : i < currentIdx
                    ? "border-transparent text-blue-500 hover:text-blue-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
              }
            `}
          >
            <span className="tabular-nums mr-1 opacity-50">{i + 1}</span>
            {STEP_LABELS[step]}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">{stepComponent}</div>

      {/* Bottom nav */}
      <div className="px-4 pb-3">
        <StepNavigation />
      </div>
    </div>
  );
}
