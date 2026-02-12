import {
  DeckConfig,
  MaterialItem,
  MaterialList,
  DeckingMaterial,
  RailingType,
} from "@/types/deck";

/** Approximate cost per sq ft for decking boards */
const DECKING_COST_PER_SQFT: Record<DeckingMaterial, number> = {
  "pressure-treated": 2.5,
  cedar: 5.0,
  "composite-trex": 8.0,
  "composite-timbertech": 9.0,
  "composite-deckorators": 7.5,
  "composite-wolf": 7.0,
  "composite-moistureshield": 8.5,
};

/** Approximate cost per linear foot for railing */
const RAILING_COST_PER_LF: Record<RailingType, number> = {
  none: 0,
  wood: 15,
  cedar: 18,
  metal: 45,
  glass: 75,
};

/** Joist spacing in inches */
const JOIST_SPACING = 16;

/** Post spacing in feet */
const POST_SPACING = 6;
const STANDARD_LUMBER_LENGTHS = [16, 12, 10, 8];

function optimizeLumberCuts(targetLength: number, pieceCount: number) {
  const optimization: Record<number, number> = {};
  let remaining = pieceCount;

  for (const length of STANDARD_LUMBER_LENGTHS) {
    if (length < targetLength || remaining <= 0) continue;
    optimization[length] = remaining;
    remaining = 0;
  }

  if (remaining > 0) {
    optimization[16] = (optimization[16] ?? 0) + remaining;
  }

  const entries = Object.entries(optimization)
    .map(([length, qty]) => ({ length: Number(length), qty }))
    .sort((a, b) => b.length - a.length);

  return {
    entries,
    selectedLength: entries[0]?.length ?? targetLength,
  };
}

function getDeckArea(config: DeckConfig): number {
  const primary = config.dimensions.width * config.dimensions.depth;
  if (
    (config.shape === "l-shape" || config.shape === "t-shape") &&
    config.dimensions.extensionWidth &&
    config.dimensions.extensionDepth
  ) {
    return (
      primary +
      config.dimensions.extensionWidth * config.dimensions.extensionDepth
    );
  }
  if (config.shape === "wrap-around") {
    // Wrap-around adds a strip along two sides
    const extraDepth = config.dimensions.extensionDepth ?? 6;
    return primary + extraDepth * config.dimensions.depth;
  }
  return primary;
}

function getPerimeter(config: DeckConfig): number {
  const w = config.dimensions.width;
  const d = config.dimensions.depth;

  if (config.shape === "rectangle") {
    // If ledger-attached, one width side is against the house (no railing there)
    return config.ledgerAttached ? w + 2 * d : 2 * w + 2 * d;
  }

  // Simplified perimeter for complex shapes — will be refined later
  const area = getDeckArea(config);
  const equivalentSide = Math.sqrt(area);
  const perim = equivalentSide * 4;
  return config.ledgerAttached ? perim * 0.75 : perim;
}

export function estimateMaterials(config: DeckConfig): MaterialList {
  const area = getDeckArea(config);
  const perimeter = getPerimeter(config);
  const items: MaterialItem[] = [];
  const notes: string[] = [];

  // --- Decking boards ---
  const wasteFactor = config.boardPattern === "diagonal" ? 1.15 : 1.1;
  const deckingSqFt = area * wasteFactor;
  const deckingCostPerSqFt = DECKING_COST_PER_SQFT[config.material];
  items.push({
    name: "Decking boards",
    description: `${config.material} ${config.boardWidth}" wide`,
    quantity: Math.ceil(deckingSqFt),
    unit: "sq ft",
    unitCost: deckingCostPerSqFt,
    totalCost: Math.ceil(deckingSqFt) * deckingCostPerSqFt,
  });

  // --- Joists (2x8 or 2x10) ---
  const joistCount =
    Math.ceil((config.dimensions.width * 12) / JOIST_SPACING) + 1;
  const joistLength = config.dimensions.depth;
  const joistPlan = optimizeLumberCuts(joistLength, joistCount);
  items.push({
    name: "Joists (2x8)",
    description: `${joistLength}' long, ${JOIST_SPACING}" on center (optimized from ${joistPlan.selectedLength}' stock)`,
    quantity: joistCount,
    unit: "each",
    unitCost: joistPlan.selectedLength * 1.5,
    totalCost: joistCount * joistPlan.selectedLength * 1.5,
  });

  // --- Beams ---
  const isFlush = config.beamType === "flush";
  const beamCount = Math.ceil(config.dimensions.depth / POST_SPACING) + 1;
  const beamPlan = optimizeLumberCuts(config.dimensions.width, beamCount);

  if (isFlush) {
    // Engineered / flush beam — LVL or PSL, sits flush with joists
    const flushBeamCostPerFt = 6.0; // LVL ~$6/ft
    items.push({
      name: "Engineered beam (LVL)",
      description: `Flush mount, ${config.dimensions.width}' span (${beamPlan.selectedLength}' stock)`,
      quantity: beamCount,
      unit: "each",
      unitCost: beamPlan.selectedLength * flushBeamCostPerFt,
      totalCost: beamCount * beamPlan.selectedLength * flushBeamCostPerFt,
    });

    // Flush beams need beam hangers
    items.push({
      name: "Beam hangers (flush mount)",
      description: "Simpson or equivalent concealed hanger",
      quantity: beamCount * 2,
      unit: "each",
      unitCost: 18,
      totalCost: beamCount * 2 * 18,
    });
  } else {
    // Standard dropped beam — doubled 2x8 dimensional lumber
    items.push({
      name: "Beam boards (2x8)",
      description: `Doubled, ${config.dimensions.width}' span (${beamPlan.selectedLength}' stock)`,
      quantity: beamCount * 2,
      unit: "each",
      unitCost: beamPlan.selectedLength * 1.5,
      totalCost: beamCount * 2 * beamPlan.selectedLength * 1.5,
    });
  }

  // --- Posts (4x4 or 6x6) ---
  const postsPerBeam = Math.ceil(config.dimensions.width / POST_SPACING) + 1;
  const totalPosts = postsPerBeam * beamCount;
  const postLength = config.dimensions.height + 2; // 2' in ground/footing
  items.push({
    name: "Support posts (4x4)",
    description: `${postLength}' long`,
    quantity: totalPosts,
    unit: "each",
    unitCost: postLength * 2.0,
    totalCost: totalPosts * postLength * 2.0,
  });

  // --- Concrete footings ---
  items.push({
    name: "Concrete footings",
    description: "Pre-mixed 60lb bags (2 per post)",
    quantity: totalPosts * 2,
    unit: "bags",
    unitCost: 6.0,
    totalCost: totalPosts * 2 * 6.0,
  });

  // --- Ledger board ---
  if (config.ledgerAttached) {
    const ledgerLength = optimizeLumberCuts(config.dimensions.width, 1).selectedLength;
    items.push({
      name: "Ledger board (2x8)",
      description: `${config.dimensions.width}' long, lag bolted to house (${ledgerLength}' stock)`,
      quantity: 1,
      unit: "each",
      unitCost: ledgerLength * 1.5,
      totalCost: ledgerLength * 1.5,
    });
  }

  // --- Railing ---
  if (config.railing !== "none") {
    const railingLF = Math.ceil(perimeter);
    const railCost = RAILING_COST_PER_LF[config.railing];
    const brandLabel = config.railingBrand === "generic" ? "" : ` (${config.railingBrand})`;
    items.push({
      name: "Railing",
      description: `${config.railing}${brandLabel} railing`,
      quantity: railingLF,
      unit: "linear ft",
      unitCost: railCost,
      totalCost: railingLF * railCost,
    });
  }

  // --- Stairs ---
  if (config.stairs.location !== "none") {
    const risePerStep = 7.5; // inches
    const stepCount = Math.ceil((config.dimensions.height * 12) / risePerStep);
    const stringerCount = Math.ceil(config.stairs.width / 1.5) + 1;

    items.push({
      name: "Stair stringers (2x12)",
      description: `${stepCount} steps`,
      quantity: stringerCount,
      unit: "each",
      unitCost: 25,
      totalCost: stringerCount * 25,
    });

    items.push({
      name: "Stair treads",
      description: `${config.stairs.width}' wide`,
      quantity: stepCount * 2, // two boards per tread
      unit: "each",
      unitCost: (config.stairs.width * DECKING_COST_PER_SQFT[config.material]),
      totalCost:
        stepCount * 2 * config.stairs.width * DECKING_COST_PER_SQFT[config.material],
    });
  }

  // --- Hardware ---
  const screwBoxes = Math.ceil(area / 100); // ~1 box per 100 sqft
  items.push({
    name: "Deck screws (5lb box)",
    description: "Coated deck screws",
    quantity: screwBoxes,
    unit: "boxes",
    unitCost: 45,
    totalCost: screwBoxes * 45,
  });

  items.push({
    name: "Joist hangers",
    description: "Simpson Strong-Tie or equivalent",
    quantity: joistCount,
    unit: "each",
    unitCost: 3.5,
    totalCost: joistCount * 3.5,
  });

  const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);

  notes.push(
    "Estimates include ~10-15% waste factor for cuts.",
    "Cut plans snap to standard lumber lengths (8', 10', 12', 16').",
    "Actual costs vary by region and supplier.",
    "Permit costs and labor are not included.",
    "Foundation requirements may vary by local code — consult a professional.",
  );

  if (isFlush) {
    notes.push(
      "Flush/engineered beams (LVL) eliminate the dropped beam below the deck surface. Requires concealed beam hangers.",
    );
  }

  return { items, totalCost, notes };
}
