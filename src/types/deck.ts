export type DeckShape = "rectangle" | "l-shape" | "t-shape" | "wrap-around";

export type RailingType = "none" | "wood" | "cedar" | "metal" | "glass";

export type RailingBrand =
  | "generic"
  | "westbury"
  | "deckorators"
  | "trex"
  | "timbertech"
  | "wolf"
  | "dekpro";

export type DeckingMaterial =
  | "pressure-treated"
  | "cedar"
  | "composite-trex"
  | "composite-timbertech"
  | "composite-deckorators"
  | "composite-wolf"
  | "composite-moistureshield";

export type DeckingCategory = "wood" | "composite";

export type BoardWidth = "5.5" | "3.5"; // inches (nominal 6" and 4")

export type BoardPattern = "standard" | "diagonal" | "herringbone" | "picture-frame";

export type BeamType = "dropped" | "flush";

export type StairLocation = "none" | "front" | "back" | "left" | "right";

export type ExteriorFacade = "vinyl" | "brick" | "stone" | "stucco" | "wood";

export interface DeckDimensions {
  /** Primary width in feet */
  width: number;
  /** Primary depth in feet */
  depth: number;
  /** Height from ground in feet */
  height: number;
  /** For L/T shapes: secondary section width */
  extensionWidth?: number;
  /** For L/T shapes: secondary section depth */
  extensionDepth?: number;
}

export interface StairConfig {
  location: StairLocation;
  width: number; // feet
}

export interface DeckConfig {
  shape: DeckShape;
  dimensions: DeckDimensions;
  deckingCategory: DeckingCategory;
  material: DeckingMaterial;
  boardWidth: BoardWidth;
  boardPattern: BoardPattern;
  railing: RailingType;
  railingBrand: RailingBrand;
  beamType: BeamType;
  stairs: StairConfig;
  ledgerAttached: boolean; // attached to house on one side?
  quoteName: string;
  quoteNotes: string;
  quoteNumber?: string;
  hasHouse: boolean;
  exteriorFacade: ExteriorFacade;
  houseColor: string;
  patioDoor: boolean;
  showGrass: boolean;
  activeDeckBrand: string;
  activeDeckLine: string;
  activeDeckColor: string;
  activeRailSeries: string;
  activeRailColor: string;
}

export interface MaterialItem {
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface MaterialList {
  items: MaterialItem[];
  totalCost: number;
  notes: string[];
}

export type WizardStep =
  | "shape"
  | "dimensions"
  | "material"
  | "pattern"
  | "railing"
  | "stairs"
  | "review";

export const WIZARD_STEPS: WizardStep[] = [
  "shape",
  "dimensions",
  "material",
  "pattern",
  "railing",
  "stairs",
  "review",
];

export const DEFAULT_DECK_CONFIG: DeckConfig = {
  shape: "rectangle",
  dimensions: { width: 12, depth: 10, height: 3 },
  deckingCategory: "wood",
  material: "pressure-treated",
  boardWidth: "5.5",
  boardPattern: "standard",
  railing: "metal",
  railingBrand: "westbury",
  beamType: "dropped",
  stairs: { location: "front", width: 4 },
  ledgerAttached: true,
  quoteName: "",
  quoteNotes: "",
  hasHouse: true,
  exteriorFacade: "vinyl",
  houseColor: "#d5d0c8",
  patioDoor: false,
  showGrass: false,
  activeDeckBrand: "Trex",
  activeDeckLine: "Transcend Lineage",
  activeDeckColor: "#a59784",
  activeRailSeries: "Tuscany C10",
  activeRailColor: "#1a1a1a",
};
