import { NextRequest, NextResponse } from "next/server";
import {
  getAllDeckingProducts,
  getAllRailingProducts,
  upsertDeckingProduct,
  upsertRailingProduct,
  deleteDeckingProduct,
  deleteRailingProduct,
} from "@/lib/db";

/** GET all products (including inactive) for admin management */
export async function GET() {
  const decking = getAllDeckingProducts();
  const railing = getAllRailingProducts();
  return NextResponse.json({ decking, railing });
}

/** POST to create or update a product */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { table, ...product } = body;

  if (table === "decking") {
    upsertDeckingProduct(product);
  } else if (table === "railing") {
    upsertRailingProduct(product);
  } else {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

/** DELETE a product by id */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table");
  const id = searchParams.get("id");

  if (!table || !id) {
    return NextResponse.json(
      { error: "table and id required" },
      { status: 400 },
    );
  }

  if (table === "decking") {
    deleteDeckingProduct(id);
  } else if (table === "railing") {
    deleteRailingProduct(id);
  } else {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
