import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, updateSetting } from "@/lib/db";

/** GET all estimate settings */
export async function GET() {
  const settings = getAllSettings();
  return NextResponse.json({ settings });
}

/** PUT to update a single setting by key */
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { key, value } = body;

  if (!key || value === undefined) {
    return NextResponse.json(
      { error: "key and value required" },
      { status: 400 },
    );
  }

  updateSetting(key, String(value));
  return NextResponse.json({ ok: true });
}
