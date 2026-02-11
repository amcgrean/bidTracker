import { DeckConfig, DEFAULT_DECK_CONFIG } from "@/types/deck";

/**
 * Encode a DeckConfig into compact URL search params.
 * Keys are short to keep URLs reasonable.
 */
export function configToParams(config: DeckConfig): URLSearchParams {
  const p = new URLSearchParams();
  p.set("sh", config.shape);
  p.set("w", String(config.dimensions.width));
  p.set("d", String(config.dimensions.depth));
  p.set("h", String(config.dimensions.height));
  if (config.dimensions.extensionWidth)
    p.set("ew", String(config.dimensions.extensionWidth));
  if (config.dimensions.extensionDepth)
    p.set("ed", String(config.dimensions.extensionDepth));
  p.set("cat", config.deckingCategory);
  p.set("mat", config.material);
  p.set("bw", config.boardWidth);
  p.set("bp", config.boardPattern);
  p.set("rl", config.railing);
  p.set("rb", config.railingBrand);
  p.set("bt", config.beamType);
  p.set("sl", config.stairs.location);
  p.set("sw", String(config.stairs.width));
  p.set("la", config.ledgerAttached ? "1" : "0");
  p.set("qn", config.quoteName);
  p.set("qnote", config.quoteNotes);
  if (config.quoteNumber) p.set("qnum", config.quoteNumber);
  p.set("hh", config.hasHouse ? "1" : "0");
  p.set("fac", config.exteriorFacade);
  p.set("hc", config.houseColor);
  p.set("pd", config.patioDoor ? "1" : "0");
  p.set("gr", config.showGrass ? "1" : "0");
  return p;
}

/**
 * Parse URL search params back into a DeckConfig.
 * Falls back to defaults for any missing/invalid params.
 */
export function paramsToConfig(params: URLSearchParams): DeckConfig | null {
  // Only parse if there's at least a shape param (indicates a shared link)
  if (!params.has("sh")) return null;

  const def = DEFAULT_DECK_CONFIG;

  return {
    shape: (params.get("sh") as DeckConfig["shape"]) ?? def.shape,
    dimensions: {
      width: Number(params.get("w")) || def.dimensions.width,
      depth: Number(params.get("d")) || def.dimensions.depth,
      height: Number(params.get("h")) || def.dimensions.height,
      extensionWidth: params.has("ew")
        ? Number(params.get("ew"))
        : undefined,
      extensionDepth: params.has("ed")
        ? Number(params.get("ed"))
        : undefined,
    },
    deckingCategory:
      (params.get("cat") as DeckConfig["deckingCategory"]) ??
      def.deckingCategory,
    material:
      (params.get("mat") as DeckConfig["material"]) ?? def.material,
    boardWidth:
      (params.get("bw") as DeckConfig["boardWidth"]) ?? def.boardWidth,
    boardPattern:
      (params.get("bp") as DeckConfig["boardPattern"]) ?? def.boardPattern,
    railing:
      (params.get("rl") as DeckConfig["railing"]) ?? def.railing,
    railingBrand:
      (params.get("rb") as DeckConfig["railingBrand"]) ?? def.railingBrand,
    beamType:
      (params.get("bt") as DeckConfig["beamType"]) ?? def.beamType,
    stairs: {
      location:
        (params.get("sl") as DeckConfig["stairs"]["location"]) ??
        def.stairs.location,
      width: Number(params.get("sw")) || def.stairs.width,
    },
    ledgerAttached: params.get("la") === "0" ? false : def.ledgerAttached,
    quoteName: params.get("qn") ?? def.quoteName,
    quoteNotes: params.get("qnote") ?? def.quoteNotes,
    quoteNumber: params.get("qnum") || undefined,
    hasHouse: params.get("hh") === "0" ? false : def.hasHouse,
    exteriorFacade: (params.get("fac") as DeckConfig["exteriorFacade"]) ?? def.exteriorFacade,
    houseColor: params.get("hc") ?? def.houseColor,
    patioDoor: params.get("pd") === "1",
    showGrass: params.get("gr") === "1",
  };
}
