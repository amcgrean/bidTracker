import { NextResponse } from "next/server";
import { getActiveDeckingProducts, getActiveRailingProducts } from "@/lib/db";

/** Public API: returns active products for the configurator frontend */
export async function GET() {
  const decking = getActiveDeckingProducts();
  const railing = getActiveRailingProducts();
  return NextResponse.json({ decking, railing });
}
