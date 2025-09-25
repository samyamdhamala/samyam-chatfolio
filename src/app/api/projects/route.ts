import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  try {
    const base = path.join(process.cwd(), "content", "projects");
    if (!fs.existsSync(base)) return NextResponse.json({ projects: [] });

    const files = fs.readdirSync(base).filter(f => f.endsWith(".json"));
    const projects = files.map((f) => {
      const raw = JSON.parse(fs.readFileSync(path.join(base, f), "utf8"));
      return {
        title: raw.title || f.replace(/\.json$/,""),
        summary: raw.summary || "",
        dates: raw.dates || "",
        role: raw.role || "",
        tools: Array.isArray(raw.tools) ? raw.tools : [],
        topics: Array.isArray(raw.topics) ? raw.topics : [],
        links: Array.isArray(raw.links) ? raw.links : [],
      };
    });

    // sort: most recent first (by dates string if present)
    projects.sort((a,b) => (b.dates||"").localeCompare(a.dates||""));
    return NextResponse.json({ projects });
  } catch (e: any) {
    console.error("[/api/projects] error", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
