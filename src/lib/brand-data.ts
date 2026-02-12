export interface BrandColor {
  name: string;
  hex: string;
  finish?: string;
}

export interface DeckingLine {
  name: string;
  colors: BrandColor[];
}

export interface DeckingBrand {
  brand: string;
  lines?: DeckingLine[];
  colors?: BrandColor[];
}

export type RailSeriesType =
  | "baluster"
  | "glass_panel"
  | "baluster_ornamental"
  | "cable"
  | "thick_baluster";

export interface RailSeries {
  name: string;
  type: RailSeriesType;
  colors?: BrandColor[];
}

export interface RailingSystem {
  brand: string;
  series: RailSeries[];
  colors?: BrandColor[];
}

export const BRAND_CATALOG: {
  decking_brands: DeckingBrand[];
  railing_systems: RailingSystem[];
} = {
  decking_brands: [
    {
      brand: "Trex",
      lines: [
        {
          name: "Transcend Lineage",
          colors: [
            { name: "Hatteras", hex: "#a59784", finish: "Refined Grain" },
            { name: "Jasper", hex: "#4e3b31", finish: "Refined Grain" },
            { name: "Biscayne", hex: "#b39c7d", finish: "Refined Grain" },
            { name: "Rainier", hex: "#8c8d8f", finish: "Refined Grain" },
          ],
        },
        {
          name: "Transcend",
          colors: [
            { name: "Island Mist", hex: "#909291", finish: "Deep Streak" },
            { name: "Tiki Torch", hex: "#a36e4a", finish: "Deep Streak" },
            { name: "Havana Gold", hex: "#b38b5d", finish: "Deep Streak" },
            { name: "Spiced Rum", hex: "#634333", finish: "Deep Streak" },
          ],
        },
        {
          name: "Enhance",
          colors: [
            { name: "Foggy Wharf", hex: "#9ea0a1", finish: "Wood Grain" },
            { name: "Rocky Harbor", hex: "#8c8378", finish: "Wood Grain" },
            { name: "Toasted Sand", hex: "#bca38b", finish: "Wood Grain" },
          ],
        },
      ],
    },
    {
      brand: "TimberTech (AZEK)",
      lines: [
        {
          name: "Vintage Collection",
          colors: [
            { name: "Coastline", hex: "#9c9c9c", finish: "Wire Brushed" },
            {
              name: "Weathered Teak",
              hex: "#b08d57",
              finish: "Wire Brushed",
            },
            { name: "Mahogany", hex: "#7d4a34", finish: "Wire Brushed" },
            { name: "Dark Hickory", hex: "#4a3c32", finish: "Wire Brushed" },
          ],
        },
        {
          name: "Landmark Collection",
          colors: [
            { name: "Castle Gate", hex: "#7a7a7a", finish: "Cross Cut" },
            {
              name: "French White Oak",
              hex: "#c4b5a3",
              finish: "Cross Cut",
            },
          ],
        },
      ],
    },
    {
      brand: "MoistureShield",
      lines: [
        {
          name: "Vision",
          colors: [
            { name: "Smokey Gray", hex: "#7a7b7d" },
            { name: "Spanish Leather", hex: "#5e4a3b" },
            { name: "Sandstone", hex: "#bda68e" },
            { name: "Cold Brew", hex: "#3d3029" },
          ],
        },
      ],
    },
    {
      brand: "Wolf Serenity",
      colors: [
        { name: "Amberwood", hex: "#9c6d4a" },
        { name: "Black Walnut", hex: "#3d2b21" },
        { name: "Driftwood Grey", hex: "#8c8c8c" },
      ],
    },
  ],
  railing_systems: [
    {
      brand: "Westbury Aluminum",
      series: [
        { name: "Tuscany C10", type: "baluster" },
        { name: "Veranda C70", type: "glass_panel" },
        { name: "Riviera C30", type: "baluster_ornamental" },
        { name: "VertiCable C80", type: "cable" },
      ],
      colors: [
        { name: "Black Fine Texture", hex: "#1a1a1a" },
        { name: "Bronze Fine Texture", hex: "#3b312b" },
        { name: "White Fine Texture", hex: "#f2f2f2" },
      ],
    },
    {
      brand: "Trex Railing",
      series: [
        {
          name: "Signature Aluminum",
          type: "baluster",
          colors: [
            { name: "Charcoal Black", hex: "#232323" },
            { name: "Bronze", hex: "#3d3630" },
          ],
        },
        {
          name: "Transcend Composite",
          type: "thick_baluster",
          colors: [
            { name: "Classic White", hex: "#f7f7f7" },
            { name: "Vintage Lantern", hex: "#403129" },
          ],
        },
      ],
    },
  ],
};

export function getDeckLines(brand: DeckingBrand): DeckingLine[] {
  if (brand.lines && brand.lines.length > 0) {
    return brand.lines;
  }

  return [
    {
      name: `${brand.brand} Collection`,
      colors: brand.colors ?? [],
    },
  ];
}

export function getRailSeriesColorOptions(system: RailingSystem, series: RailSeries): BrandColor[] {
  if (series.colors && series.colors.length > 0) {
    return series.colors;
  }

  return system.colors ?? [];
}
