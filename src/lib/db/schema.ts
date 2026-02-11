/**
 * Database schema for the Deck Configurator backend.
 * Uses better-sqlite3 for local development.
 *
 * Tables:
 *   decking_products  — decking material options and pricing
 *   railing_products  — railing options and pricing
 *   estimate_settings — global settings for the estimator (waste factor, hardware costs, etc.)
 */

export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS decking_products (
    id          TEXT PRIMARY KEY,
    category    TEXT NOT NULL CHECK(category IN ('wood','composite')),
    label       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    cost_per_sqft REAL NOT NULL DEFAULT 0,
    active      INTEGER NOT NULL DEFAULT 1,
    sort_order  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS railing_products (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL CHECK(type IN ('wood','cedar','metal','glass')),
    label       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    cost_per_lf REAL NOT NULL DEFAULT 0,
    active      INTEGER NOT NULL DEFAULT 1,
    sort_order  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS estimate_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_number  TEXT NOT NULL UNIQUE,
    quote_name    TEXT NOT NULL DEFAULT '',
    notes         TEXT NOT NULL DEFAULT '',
    config_json   TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`
;

/** Seed data matching the current hardcoded product catalog */
export const SEED_DECKING = [
  { id: "pressure-treated", category: "wood", label: "Pressure-Treated Lumber", description: "Most affordable. Requires staining/sealing every 1-2 years.", cost_per_sqft: 2.5, sort_order: 0 },
  { id: "cedar", category: "wood", label: "Cedar", description: "Naturally rot-resistant with beautiful grain. Moderate cost.", cost_per_sqft: 5.0, sort_order: 1 },
  { id: "composite-trex", category: "composite", label: "Trex", description: "Industry leader. Transcend, Enhance, and Select lines. 25-year warranty.", cost_per_sqft: 8.0, sort_order: 0 },
  { id: "composite-timbertech", category: "composite", label: "TimberTech / AZEK", description: "Premium composite and PVC lines. Advanced cap technology. 30+ year warranty.", cost_per_sqft: 9.0, sort_order: 1 },
  { id: "composite-deckorators", category: "composite", label: "Deckorators", description: "Mineral-based composite. Surestone core resists moisture and mold.", cost_per_sqft: 7.5, sort_order: 2 },
  { id: "composite-wolf", category: "composite", label: "Wolf Home Products", description: "Serenity and Perspective lines. Natural wood look with lasting performance.", cost_per_sqft: 7.0, sort_order: 3 },
  { id: "composite-moistureshield", category: "composite", label: "MoistureShield", description: "Built for wet environments. Heat-tolerant, slip-resistant, pool-friendly.", cost_per_sqft: 8.5, sort_order: 4 },
];

export const SEED_RAILING = [
  { id: "generic", type: "wood", label: "Standard / Other", description: "Generic wood or unbranded railing.", cost_per_lf: 15, sort_order: 0 },
  { id: "cedar-generic", type: "cedar", label: "Cedar Railing", description: "Gripable cedar railing for a natural, rustic traditional look.", cost_per_lf: 18, sort_order: 1 },
  { id: "westbury", type: "metal", label: "Westbury", description: "Our top aluminum railing line. ScreenRail and Tuscany series.", cost_per_lf: 45, sort_order: 0 },
  { id: "deckorators-rail", type: "metal", label: "Deckorators", description: "Aluminum and composite railing options with ALX and CXT lines.", cost_per_lf: 42, sort_order: 1 },
  { id: "trex-rail", type: "metal", label: "Trex", description: "Composite and aluminum railing. Signature and Transcend lines.", cost_per_lf: 48, sort_order: 2 },
  { id: "timbertech-rail", type: "metal", label: "TimberTech", description: "RadianceRail and classic composite railing systems.", cost_per_lf: 46, sort_order: 3 },
  { id: "wolf-rail", type: "metal", label: "Wolf", description: "Wolf Railing system. Pairs with Wolf composite decking.", cost_per_lf: 40, sort_order: 4 },
  { id: "dekpro-rail", type: "metal", label: "DekPro", description: "Distinctive baluster designs. Unique style between the posts.", cost_per_lf: 38, sort_order: 5 },
  { id: "westbury-glass", type: "glass", label: "Westbury Glass", description: "Unobstructed views with tempered glass panels in aluminum frames.", cost_per_lf: 75, sort_order: 0 },
];

export const SEED_SETTINGS = [
  { key: "waste_factor_standard", value: "1.10", label: "Waste Factor (Standard)", description: "Multiplier for standard board pattern waste" },
  { key: "waste_factor_diagonal", value: "1.15", label: "Waste Factor (Diagonal)", description: "Multiplier for diagonal board pattern waste" },
  { key: "joist_spacing_inches", value: "16", label: "Joist Spacing (inches)", description: "On-center spacing for joists" },
  { key: "post_spacing_feet", value: "6", label: "Post Spacing (feet)", description: "Spacing between support posts and beam supports" },
  { key: "joist_cost_per_foot", value: "1.50", label: "Joist Cost (per foot)", description: "Cost per linear foot for 2x8 joists" },
  { key: "beam_cost_per_foot", value: "1.50", label: "Beam Cost (per foot)", description: "Cost per linear foot for 2x8 beam boards" },
  { key: "post_cost_per_foot", value: "2.00", label: "Post Cost (per foot)", description: "Cost per linear foot for 4x4 posts" },
  { key: "concrete_bags_per_post", value: "2", label: "Concrete Bags Per Post", description: "Number of 60lb bags per footing" },
  { key: "concrete_bag_cost", value: "6.00", label: "Concrete Bag Cost", description: "Cost per 60lb bag of concrete" },
  { key: "screw_box_cost", value: "45.00", label: "Screw Box Cost", description: "Cost per 5lb box of deck screws" },
  { key: "screw_coverage_sqft", value: "100", label: "Screw Coverage (sq ft)", description: "Square footage covered per box of screws" },
  { key: "joist_hanger_cost", value: "3.50", label: "Joist Hanger Cost", description: "Cost per joist hanger" },
  { key: "stringer_cost", value: "25.00", label: "Stringer Cost", description: "Cost per stair stringer (2x12)" },
  { key: "rise_per_step_inches", value: "7.50", label: "Rise Per Step (inches)", description: "Standard rise per stair step" },
];
