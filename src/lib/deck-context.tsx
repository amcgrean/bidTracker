"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";
import {
  DeckConfig,
  DEFAULT_DECK_CONFIG,
  WizardStep,
  WIZARD_STEPS,
} from "@/types/deck";

interface DeckState {
  config: DeckConfig;
  currentStep: WizardStep;
}

type DeckAction =
  | { type: "UPDATE_CONFIG"; payload: Partial<DeckConfig> }
  | { type: "SET_STEP"; payload: WizardStep }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

const initialState: DeckState = {
  config: DEFAULT_DECK_CONFIG,
  currentStep: "shape",
};

function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    case "UPDATE_CONFIG":
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      };
    case "SET_STEP":
      return { ...state, currentStep: action.payload };
    case "NEXT_STEP": {
      const idx = WIZARD_STEPS.indexOf(state.currentStep);
      if (idx < WIZARD_STEPS.length - 1) {
        return { ...state, currentStep: WIZARD_STEPS[idx + 1] };
      }
      return state;
    }
    case "PREV_STEP": {
      const idx = WIZARD_STEPS.indexOf(state.currentStep);
      if (idx > 0) {
        return { ...state, currentStep: WIZARD_STEPS[idx - 1] };
      }
      return state;
    }
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface DeckContextValue {
  state: DeckState;
  dispatch: React.Dispatch<DeckAction>;
}

const DeckContext = createContext<DeckContextValue | null>(null);

export function DeckProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(deckReducer, initialState);
  return (
    <DeckContext.Provider value={{ state, dispatch }}>
      {children}
    </DeckContext.Provider>
  );
}

export function useDeck() {
  const ctx = useContext(DeckContext);
  if (!ctx) {
    throw new Error("useDeck must be used within a DeckProvider");
  }
  return ctx;
}
