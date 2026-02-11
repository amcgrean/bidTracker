"use client";

import { useDeck } from "@/lib/deck-context";
import { RailingType, RailingBrand } from "@/types/deck";
import OptionCard from "@/components/ui/OptionCard";

const RAILINGS: { value: RailingType; label: string; description: string }[] = [
  {
    value: "none",
    label: "No Railing",
    description: "Ground-level decks under 30\" may not require railing.",
  },
  {
    value: "wood",
    label: "Wood Railing",
    description: "Classic look. Matches pressure-treated decking.",
  },
  {
    value: "cedar",
    label: "Cedar Railing",
    description: "Gripable cedar railing for a natural, rustic traditional look.",
  },
  {
    value: "metal",
    label: "Metal / Aluminum",
    description: "Sleek modern look, powder-coated for durability. Westbury is our go-to.",
  },
  {
    value: "glass",
    label: "Glass Panel",
    description: "Unobstructed views with tempered glass panels in aluminum frames.",
  },
];

const BRANDS: {
  value: RailingBrand;
  label: string;
  description: string;
  forTypes: RailingType[];
}[] = [
  {
    value: "westbury",
    label: "Westbury",
    description: "Our top aluminum railing line. ScreenRail and Tuscany series.",
    forTypes: ["metal", "glass"],
  },
  {
    value: "deckorators",
    label: "Deckorators",
    description: "Aluminum and composite railing options with ALX and CXT lines.",
    forTypes: ["metal"],
  },
  {
    value: "trex",
    label: "Trex",
    description: "Composite and aluminum railing. Signature and Transcend lines.",
    forTypes: ["metal"],
  },
  {
    value: "timbertech",
    label: "TimberTech",
    description: "RadianceRail and classic composite railing systems.",
    forTypes: ["metal"],
  },
  {
    value: "wolf",
    label: "Wolf",
    description: "Wolf Railing system. Pairs with Wolf composite decking.",
    forTypes: ["metal"],
  },
  {
    value: "dekpro",
    label: "DekPro",
    description: "Distinctive baluster designs. Unique style between the posts.",
    forTypes: ["metal"],
  },
  {
    value: "generic",
    label: "Standard / Other",
    description: "Generic wood or unbranded railing.",
    forTypes: ["wood", "cedar"],
  },
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
      payload: {
        railing: type,
        railingBrand: defaultBrand as RailingBrand,
      },
    });
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Railing</h2>
      <p className="text-sm text-gray-500 mb-6">
        Select a railing type. Most decks over 30&quot; high require railing by code.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {RAILINGS.map((r) => (
          <OptionCard
            key={r.value}
            label={r.label}
            description={r.description}
            selected={railing === r.value}
            onClick={() => setRailing(r.value)}
          />
        ))}
      </div>

      {applicableBrands.length > 0 && railing !== "none" && (
        <>
          <h3 className="mt-6 text-md font-semibold text-gray-800 mb-3">
            Railing Brand
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {applicableBrands.map((b) => (
              <OptionCard
                key={b.value}
                label={b.label}
                description={b.description}
                selected={railingBrand === b.value}
                onClick={() =>
                  dispatch({
                    type: "UPDATE_CONFIG",
                    payload: { railingBrand: b.value },
                  })
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
