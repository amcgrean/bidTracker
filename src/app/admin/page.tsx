"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// ─── Types matching the DB rows ──────────────────────────────────────────────

interface DeckingProduct {
  id: string;
  category: string;
  label: string;
  description: string;
  cost_per_sqft: number;
  active: number;
  sort_order: number;
}

interface RailingProduct {
  id: string;
  type: string;
  label: string;
  description: string;
  cost_per_lf: number;
  active: number;
  sort_order: number;
}

interface Setting {
  key: string;
  value: string;
  label: string;
  description: string;
}



function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getValue(row: string[], col: Record<string, number>, ...keys: string[]): string {
  for (const key of keys) {
    const idx = col[normalizeHeader(key)];
    if (idx !== undefined) {
      const value = row[idx] ?? "";
      if (value !== "") return value;
    }
  }
  return "";
}

function parseDeckingCategory(raw: string): "wood" | "composite" {
  const normalized = raw.toLowerCase();
  return normalized.includes("composite") ? "composite" : "wood";
}

function parseCsvRows(text: string): string[][] {
  const normalizedText = text.includes("\\n") && !text.includes("\n")
    ? text.replace(/\\n/g, "\n")
    : text;

  const firstLine = normalizedText.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = firstLine.includes("\t") ? "\t" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText[i];

    if (char === '"') {
      if (inQuotes && normalizedText[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && normalizedText[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some((v) => v.length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((v) => v.length > 0)) rows.push(row);
  }

  return rows;
}

// ─── Admin page ──────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<"decking" | "railing" | "settings">("decking");
  const [decking, setDecking] = useState<DeckingProduct[]>([]);
  const [railing, setRailing] = useState<RailingProduct[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [saving, setSaving] = useState(false);

  async function loadProducts() {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setDecking(data.decking);
    setRailing(data.railing);
  }

  async function loadSettings() {
    const res = await fetch("/api/admin/settings");
    const data = await res.json();
    setSettings(data.settings);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts();
      void loadSettings();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // ── Save helpers ──

  async function saveDeckingProduct(product: DeckingProduct) {
    setSaving(true);
    await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "decking", ...product }),
    });
    setSaving(false);
    void loadProducts();
  }

  async function saveRailingProduct(product: RailingProduct) {
    setSaving(true);
    await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "railing", ...product }),
    });
    setSaving(false);
    void loadProducts();
  }

  async function deleteDeckingProduct(id: string) {
    if (!confirm(`Delete decking product "${id}"?`)) return;
    await fetch(`/api/admin/products?table=decking&id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    void loadProducts();
  }

  async function deleteRailingProduct(id: string) {
    if (!confirm(`Delete railing product "${id}"?`)) return;
    await fetch(`/api/admin/products?table=railing&id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    void loadProducts();
  }

  async function saveSetting(key: string, value: string) {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setSaving(false);
    void loadSettings();
  }

  async function importDeckingProducts(products: DeckingProduct[]) {
    setSaving(true);
    for (const product of products) {
      await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "decking", ...product }),
      });
    }
    setSaving(false);
    void loadProducts();
  }

  async function importRailingProducts(products: RailingProduct[]) {
    setSaving(true);
    for (const product of products) {
      await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "railing", ...product }),
      });
    }
    setSaving(false);
    void loadProducts();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Admin — Deck Configurator
            </h1>
            <p className="text-xs text-gray-500">
              Manage products, pricing, and estimator settings
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Back to Configurator
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white px-6">
        <div className="flex gap-6">
          {(["decking", "railing", "settings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                tab === t
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "settings" ? "Estimate Settings" : `${t} Products`}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {saving && (
          <div className="mb-4 rounded bg-blue-50 px-4 py-2 text-sm text-blue-700">
            Saving...
          </div>
        )}

        {tab === "decking" && (
          <DeckingTable
            products={decking}
            onSave={saveDeckingProduct}
            onDelete={deleteDeckingProduct}
            onImport={importDeckingProducts}
          />
        )}

        {tab === "railing" && (
          <RailingTable
            products={railing}
            onSave={saveRailingProduct}
            onDelete={deleteRailingProduct}
            onImport={importRailingProducts}
          />
        )}

        {tab === "settings" && (
          <SettingsTable settings={settings} onSave={saveSetting} />
        )}
      </div>
    </div>
  );
}

// ─── Decking table ───────────────────────────────────────────────────────────

function DeckingTable({
  products,
  onSave,
  onDelete,
  onImport,
}: {
  products: DeckingProduct[];
  onSave: (p: DeckingProduct) => void;
  onDelete: (id: string) => void;
  onImport: (products: DeckingProduct[]) => Promise<void>;
}) {
  const [editing, setEditing] = useState<DeckingProduct | null>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const rows = parseCsvRows(text);
    if (rows.length < 2) return;

    const [header, ...body] = rows;
    const col = Object.fromEntries(header.map((h, i) => [normalizeHeader(h), i]));

    const parsed = body
      .filter((r) => r.length > 0)
      .map((r, idx) => {
        const item = getValue(r, col, "id", "item", "sku", "vendorsku");
        const major = getValue(r, col, "major_description", "major description", "category");
        const minor = getValue(r, col, "minor_description", "minor description", "subcategory");
        const ext = getValue(r, col, "ext_description", "ext description", "brand", "vendor");
        const description = getValue(r, col, "description", "label");
        const size = getValue(r, col, "size_", "size", "dimensions");
        const category = parseDeckingCategory(major || getValue(r, col, "deckingCategory", "type", "category"));

        const id = item || `decking-${idx + 1}`;
        const labelBase = description || item;
        const label = ext && labelBase && !labelBase.toLowerCase().includes(ext.toLowerCase())
          ? `${ext} — ${labelBase}`
          : (labelBase || ext || item);

        const detailParts = [major, minor, size].filter(Boolean);

        return {
          id,
          category,
          label,
          description: detailParts.length > 0 ? `${detailParts.join(" • ")}${description ? ` — ${description}` : ""}` : description,
          cost_per_sqft: Number(getValue(r, col, "cost_per_sqft", "cost", "costpersqft") || 0),
          active: Number(getValue(r, col, "active") || 1) ? 1 : 0,
          sort_order: Number(getValue(r, col, "sort_order", "sortorder") || idx),
        };
      })
      .filter((r) => r.id && r.label);

    await onImport(parsed);
    e.currentTarget.value = "";
  }

  const emptyProduct: DeckingProduct = {
    id: "",
    category: "composite",
    label: "",
    description: "",
    cost_per_sqft: 0,
    active: 1,
    sort_order: products.length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Decking Products</h2>
        <div className="flex items-center gap-2">
          <label className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
            Import CSV
            <input type="file" accept=".csv,text/csv,.txt,text/tab-separated-values" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={() => setEditing(emptyProduct)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Add Product
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">$/sqft</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">
                  {p.id}
                </td>
                <td className="px-4 py-3 text-gray-900">{p.label}</td>
                <td className="px-4 py-3 capitalize text-gray-600">
                  {p.category}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  ${p.cost_per_sqft.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {p.active ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => setEditing(p)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <DeckingEditor
          product={editing}
          onSave={(p) => {
            onSave(p);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function DeckingEditor({
  product,
  onSave,
  onCancel,
}: {
  product: DeckingProduct;
  onSave: (p: DeckingProduct) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(product);
  const isNew = product.id === "";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {isNew ? "Add Decking Product" : "Edit Decking Product"}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID (slug)
            </label>
            <input
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              disabled={!isNew}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
              placeholder="e.g. composite-trex"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="wood">Wood</option>
              <option value="composite">Composite</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost per sq ft ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.cost_per_sqft}
                onChange={(e) =>
                  setForm({ ...form, cost_per_sqft: Number(e.target.value) })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active === 1}
              onChange={(e) =>
                setForm({ ...form, active: e.target.checked ? 1 : 0 })
              }
            />
            Active (visible to customers)
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.id || !form.label}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Railing table ───────────────────────────────────────────────────────────

function RailingTable({
  products,
  onSave,
  onDelete,
  onImport,
}: {
  products: RailingProduct[];
  onSave: (p: RailingProduct) => void;
  onDelete: (id: string) => void;
  onImport: (products: RailingProduct[]) => Promise<void>;
}) {
  const [editing, setEditing] = useState<RailingProduct | null>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const rows = parseCsvRows(text);
    if (rows.length < 2) return;

    const [header, ...body] = rows;
    const col = Object.fromEntries(header.map((h, i) => [h.trim().toLowerCase(), i]));

    const parsed = body
      .filter((r) => r.length > 0)
      .map((r, idx) => ({
        id: r[col.id] ?? `railing-${idx + 1}`,
        type: (r[col.type] ?? "metal") || "metal",
        label: r[col.label] ?? "",
        description: r[col.description] ?? "",
        cost_per_lf: Number(r[col.cost_per_lf] ?? r[col.cost] ?? 0),
        active: Number(r[col.active] ?? 1) ? 1 : 0,
        sort_order: Number(r[col.sort_order] ?? idx),
      }))
      .filter((r) => r.id && r.label);

    await onImport(parsed);
    e.currentTarget.value = "";
  }

  const emptyProduct: RailingProduct = {
    id: "",
    type: "metal",
    label: "",
    description: "",
    cost_per_lf: 0,
    active: 1,
    sort_order: products.length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Railing Products</h2>
        <div className="flex items-center gap-2">
          <label className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
            Import CSV
            <input type="file" accept=".csv,text/csv,.txt,text/tab-separated-values" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={() => setEditing(emptyProduct)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Add Product
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">$/lf</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">
                  {p.id}
                </td>
                <td className="px-4 py-3 text-gray-900">{p.label}</td>
                <td className="px-4 py-3 capitalize text-gray-600">
                  {p.type}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  ${p.cost_per_lf.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {p.active ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => setEditing(p)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <RailingEditor
          product={editing}
          onSave={(p) => {
            onSave(p);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function RailingEditor({
  product,
  onSave,
  onCancel,
}: {
  product: RailingProduct;
  onSave: (p: RailingProduct) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(product);
  const isNew = product.id === "";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {isNew ? "Add Railing Product" : "Edit Railing Product"}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID (slug)
            </label>
            <input
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              disabled={!isNew}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
              placeholder="e.g. westbury-glass"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="wood">Wood</option>
              <option value="cedar">Cedar</option>
              <option value="metal">Metal</option>
              <option value="glass">Glass</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost per linear ft ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.cost_per_lf}
                onChange={(e) =>
                  setForm({ ...form, cost_per_lf: Number(e.target.value) })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active === 1}
              onChange={(e) =>
                setForm({ ...form, active: e.target.checked ? 1 : 0 })
              }
            />
            Active (visible to customers)
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.id || !form.label}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings table ──────────────────────────────────────────────────────────

function SettingsTable({
  settings,
  onSave,
}: {
  settings: Setting[];
  onSave: (key: string, value: string) => void;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Estimate Settings
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        These values control how the material estimator calculates quantities and costs.
        Changes take effect immediately for new estimates.
      </p>

      <div className="bg-white rounded-lg border border-gray-200">
        {settings.map((s) => (
          <div
            key={s.key}
            className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0"
          >
            <div className="flex-1">
              <div className="font-medium text-gray-900 text-sm">{s.label}</div>
              <div className="text-xs text-gray-400">{s.description}</div>
            </div>

            {editingKey === s.key ? (
              <div className="flex items-center gap-2 ml-4">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onSave(s.key, editValue);
                      setEditingKey(null);
                    }
                    if (e.key === "Escape") setEditingKey(null);
                  }}
                />
                <button
                  onClick={() => {
                    onSave(s.key, editValue);
                    setEditingKey(null);
                  }}
                  className="text-blue-600 text-xs font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingKey(null)}
                  className="text-gray-400 text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-4">
                <span className="font-mono text-sm text-gray-700 bg-gray-50 px-2 py-0.5 rounded">
                  {s.value}
                </span>
                <button
                  onClick={() => {
                    setEditingKey(s.key);
                    setEditValue(s.value);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
