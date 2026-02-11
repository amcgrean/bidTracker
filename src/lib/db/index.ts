import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import {
  CREATE_TABLES_SQL,
  SEED_DECKING,
  SEED_RAILING,
  SEED_SETTINGS,
} from "./schema";

const DEFAULT_DB_FILENAME = "deck-configurator.db";

let _db: Database.Database | null = null;

function resolveDbPath(): string {
  const explicitPath = process.env.DECK_DB_PATH || process.env.DATABASE_PATH;
  if (explicitPath) {
    const explicitDir = path.dirname(explicitPath);
    if (!fs.existsSync(explicitDir)) fs.mkdirSync(explicitDir, { recursive: true });
    return explicitPath;
  }

  const localPath = path.join(process.cwd(), "data", DEFAULT_DB_FILENAME);
  try {
    const localDir = path.dirname(localPath);
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
    return localPath;
  } catch {
    const tempPath = path.join("/tmp", DEFAULT_DB_FILENAME);
    const tempDir = path.dirname(tempPath);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    return tempPath;
  }
}

export function getDb(): Database.Database {
  if (_db) return _db;

  const dbPath = resolveDbPath();
  _db = new Database(dbPath);
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

export interface QuoteRow {
  id: number;
  quote_number: string;
  quote_name: string;
  notes: string;
  config_json: string;
  created_at: string;
  updated_at: string;
}

function generateQuoteNumber(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `Q-${stamp}-${suffix}`;
}

export function listQuotes(): Pick<QuoteRow, "id" | "quote_number" | "quote_name" | "updated_at">[] {
  return getDb()
    .prepare("SELECT id, quote_number, quote_name, updated_at FROM quotes ORDER BY datetime(updated_at) DESC")
    .all() as Pick<QuoteRow, "id" | "quote_number" | "quote_name" | "updated_at">[];
}

export function getQuote(id: number): QuoteRow | undefined {
  return getDb().prepare("SELECT * FROM quotes WHERE id = ?").get(id) as QuoteRow | undefined;
}

export function saveQuote(payload: { id?: number; quoteName: string; notes: string; configJson: string; quoteNumber?: string }) {
  const db = getDb();
  const quoteNumber = payload.quoteNumber || generateQuoteNumber();
  if (payload.id) {
    db.prepare(
      `UPDATE quotes
       SET quote_name = @quote_name,
           notes = @notes,
           config_json = @config_json,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = @id`,
    ).run({ id: payload.id, quote_name: payload.quoteName, notes: payload.notes, config_json: payload.configJson });
    return { id: payload.id, quoteNumber };
  }

  const result = db.prepare(
    `INSERT INTO quotes (quote_number, quote_name, notes, config_json)
     VALUES (@quote_number, @quote_name, @notes, @config_json)`,
  ).run({ quote_number: quoteNumber, quote_name: payload.quoteName, notes: payload.notes, config_json: payload.configJson });

  return { id: Number(result.lastInsertRowid), quoteNumber };
}
