"use client";

import { useDeck } from "@/lib/deck-context";
import StepNavigation from "@/components/ui/StepNavigation";
import ShapeStep from "./ShapeStep";
import DimensionsStep from "./DimensionsStep";
import MaterialStep from "./MaterialStep";
import PatternStep from "./PatternStep";
import RailingStep from "./RailingStep";
import StairsStep from "./StairsStep";
import ReviewStep from "./ReviewStep";

export default function WizardPanel() {
  const { state } = useDeck();

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
      <div className="flex-1 overflow-y-auto p-6">{stepComponent}</div>
      <div className="px-6 pb-6">
        <StepNavigation />
      </div>
    </div>
  );
}
