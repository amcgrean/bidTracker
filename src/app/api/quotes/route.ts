import { NextRequest, NextResponse } from "next/server";
import { getQuote, listQuotes, saveQuote } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const quote = getQuote(Number(id));
    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ quote });
  }

  return NextResponse.json({ quotes: listQuotes() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, quoteName, notes, config, quoteNumber } = body;
  if (!config) return NextResponse.json({ error: "config required" }, { status: 400 });

  const result = saveQuote({
    id,
    quoteName: quoteName || "Untitled Quote",
    notes: notes || "",
    configJson: JSON.stringify(config),
    quoteNumber,
  });

  return NextResponse.json({ ok: true, ...result });
}
