import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  try {
    const p = path.join(process.cwd(), "content", "roles.json");
    if (!fs.existsSync(p))
      return NextResponse.json({ roles: [] });
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    return NextResponse.json({ roles: data.roles ?? [] });
  } catch (e: unknown) {
    console.error("[/api/roles] error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
