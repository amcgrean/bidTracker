import Database from "better-sqlite3";
import path from "path";
import {
  CREATE_TABLES_SQL,
  SEED_DECKING,
  SEED_RAILING,
  SEED_SETTINGS,
} from "./schema";

const DB_PATH = path.join(process.cwd(), "data", "deck-configurator.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  // Ensure data directory exists
  const fs = require("fs");
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  // Create tables
  _db.exec(CREATE_TABLES_SQL);

  // Seed if empty
  const deckingCount = _db
    .prepare("SELECT COUNT(*) as c FROM decking_products")
    .get() as { c: number };

  if (deckingCount.c === 0) {
    const insertDecking = _db.prepare(
      `INSERT INTO decking_products (id, category, label, description, cost_per_sqft, sort_order)
       VALUES (@id, @category, @label, @description, @cost_per_sqft, @sort_order)`,
    );
    const insertRailing = _db.prepare(
      `INSERT INTO railing_products (id, type, label, description, cost_per_lf, sort_order)
       VALUES (@id, @type, @label, @description, @cost_per_lf, @sort_order)`,
    );
    const insertSetting = _db.prepare(
      `INSERT INTO estimate_settings (key, value, label, description)
       VALUES (@key, @value, @label, @description)`,
    );

    const seedAll = _db.transaction(() => {
      for (const d of SEED_DECKING) insertDecking.run(d);
      for (const r of SEED_RAILING) insertRailing.run(r);
      for (const s of SEED_SETTINGS) insertSetting.run(s);
    });

    seedAll();
  }

  return _db;
}

// ─── Decking Products ────────────────────────────────────────────────────────

export interface DeckingProductRow {
  id: string;
  category: string;
  label: string;
  description: string;
  cost_per_sqft: number;
  active: number;
  sort_order: number;
}

export function getAllDeckingProducts(): DeckingProductRow[] {
  return getDb()
    .prepare("SELECT * FROM decking_products ORDER BY category, sort_order")
    .all() as DeckingProductRow[];
}

export function getActiveDeckingProducts(): DeckingProductRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM decking_products WHERE active = 1 ORDER BY category, sort_order",
    )
    .all() as DeckingProductRow[];
}

export function upsertDeckingProduct(product: Omit<DeckingProductRow, "active"> & { active?: number }) {
  const db = getDb();
  db.prepare(
    `INSERT INTO decking_products (id, category, label, description, cost_per_sqft, active, sort_order)
     VALUES (@id, @category, @label, @description, @cost_per_sqft, @active, @sort_order)
     ON CONFLICT(id) DO UPDATE SET
       category=excluded.category, label=excluded.label,
       description=excluded.description, cost_per_sqft=excluded.cost_per_sqft,
       active=excluded.active, sort_order=excluded.sort_order`,
  ).run({ active: 1, ...product });
}

export function deleteDeckingProduct(id: string) {
  getDb().prepare("DELETE FROM decking_products WHERE id = ?").run(id);
}

// ─── Railing Products ────────────────────────────────────────────────────────

export interface RailingProductRow {
  id: string;
  type: string;
  label: string;
  description: string;
  cost_per_lf: number;
  active: number;
  sort_order: number;
}

export function getAllRailingProducts(): RailingProductRow[] {
  return getDb()
    .prepare("SELECT * FROM railing_products ORDER BY type, sort_order")
    .all() as RailingProductRow[];
}

export function getActiveRailingProducts(): RailingProductRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM railing_products WHERE active = 1 ORDER BY type, sort_order",
    )
    .all() as RailingProductRow[];
}

export function upsertRailingProduct(product: Omit<RailingProductRow, "active"> & { active?: number }) {
  const db = getDb();
  db.prepare(
    `INSERT INTO railing_products (id, type, label, description, cost_per_lf, active, sort_order)
     VALUES (@id, @type, @label, @description, @cost_per_lf, @active, @sort_order)
     ON CONFLICT(id) DO UPDATE SET
       type=excluded.type, label=excluded.label,
       description=excluded.description, cost_per_lf=excluded.cost_per_lf,
       active=excluded.active, sort_order=excluded.sort_order`,
  ).run({ active: 1, ...product });
}

export function deleteRailingProduct(id: string) {
  getDb().prepare("DELETE FROM railing_products WHERE id = ?").run(id);
}

// ─── Estimate Settings ───────────────────────────────────────────────────────

export interface SettingRow {
  key: string;
  value: string;
  label: string;
  description: string;
}

export function getAllSettings(): SettingRow[] {
  return getDb()
    .prepare("SELECT * FROM estimate_settings ORDER BY key")
    .all() as SettingRow[];
}

export function getSetting(key: string): string | undefined {
  const row = getDb()
    .prepare("SELECT value FROM estimate_settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value;
}

export function updateSetting(key: string, value: string) {
  getDb()
    .prepare("UPDATE estimate_settings SET value = ? WHERE key = ?")
    .run(value, key);
}
