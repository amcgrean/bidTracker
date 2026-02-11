"use client";

import { useRef, useCallback } from "react";
import { useDeck } from "@/lib/deck-context";
import { DeckConfig } from "@/types/deck";

/**
 * Returns a helper that dispatches a config update and auto-advances
 * to the next wizard step after a short visual delay (400ms).
 * Use on steps where a single click/selection should move forward.
 */
export function useAutoAdvance() {
  const { dispatch } = useDeck();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectAndAdvance = useCallback(
    (payload: Partial<DeckConfig>) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      dispatch({ type: "UPDATE_CONFIG", payload });

      timerRef.current = setTimeout(() => {
        dispatch({ type: "NEXT_STEP" });
      }, 400);
    },
    [dispatch],
  );

  return selectAndAdvance;
}
