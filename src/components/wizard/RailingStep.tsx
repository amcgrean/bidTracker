"use client";

import { useDeck } from "@/lib/deck-context";
import { RailingType, RailingBrand } from "@/types/deck";
import OptionCard from "@/components/ui/OptionCard";

const RAILINGS: { value: RailingType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "wood", label: "Wood" },
  { value: "cedar", label: "Cedar" },
  { value: "metal", label: "Metal / Aluminum" },
  { value: "glass", label: "Glass Panel" },
];

const BRANDS: {
  value: RailingBrand;
  label: string;
  forTypes: RailingType[];
}[] = [
  { value: "westbury", label: "Westbury", forTypes: ["metal", "glass"] },
  { value: "deckorators", label: "Deckorators", forTypes: ["metal"] },
  { value: "trex", label: "Trex", forTypes: ["metal"] },
  { value: "timbertech", label: "TimberTech", forTypes: ["metal"] },
  { value: "wolf", label: "Wolf", forTypes: ["metal"] },
  { value: "dekpro", label: "DekPro", forTypes: ["metal"] },
  { value: "generic", label: "Standard", forTypes: ["wood", "cedar"] },
];

export default function RailingStep() {
  const { state, dispatch } = useDeck();
  const { railing, railingBrand } = state.config;

  const applicableBrands = BRANDS.filter((b) => b.forTypes.includes(railing));

  function setRailing(type: RailingType) {
    const defaultBrand =
      type === "wood" || type === "cedar"
        ? "generic"
        : type === "metal" || type === "glass"
          ? "westbury"
          : "generic";
    dispatch({
      type: "UPDATE_CONFIG",
      payload: { railing: type, railingBrand: defaultBrand as RailingBrand },
    });
  }

  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-3">Railing</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {RAILINGS.map((r) => (
          <OptionCard
            key={r.value}
            compact
            label={r.label}
            selected={railing === r.value}
            onClick={() => setRailing(r.value)}
          />
        ))}
      </div>

      {applicableBrands.length > 0 && railing !== "none" && (
        <>
          <h3 className="text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Brand
          </h3>
          <div className="flex flex-wrap gap-2">
            {applicableBrands.map((b) => (
              <OptionCard
                key={b.value}
                compact
                label={b.label}
                selected={railingBrand === b.value}
                onClick={() =>
                  dispatch({ type: "UPDATE_CONFIG", payload: { railingBrand: b.value } })
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
