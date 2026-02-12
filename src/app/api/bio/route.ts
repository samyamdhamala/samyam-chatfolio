import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  try {
    const contentDir = path.join(process.cwd(), "content");
    const bioPath = path.join(contentDir, "bio.json");
    const resumePath = path.join(contentDir, "resume.json");
    const faqPath = path.join(contentDir, "recruiter_faq.json");

    let bio: Record<string, unknown> = {};
    let skills: string[] = [];
    let pronouns: string | null = null;

    if (fs.existsSync(bioPath)) {
      bio = JSON.parse(fs.readFileSync(bioPath, "utf8")) as Record<string, unknown>;
    }
    if (fs.existsSync(resumePath)) {
      const resume = JSON.parse(fs.readFileSync(resumePath, "utf8")) as { skills?: Record<string, string[]> };
      const s = resume.skills;
      if (s) {
        skills = [
          ...(s.languages_frameworks || []).slice(0, 4),
          ...(s.data_viz || []).slice(0, 2),
          ...(s.testing_tools || []).slice(0, 2),
        ].filter(Boolean);
      }
    }
    if (fs.existsSync(faqPath)) {
      const faq = JSON.parse(fs.readFileSync(faqPath, "utf8")) as { items?: Array<{ q: string; a: string }> };
      const pronounsItem = faq.items?.find((i) => i.q === "Pronouns");
      if (pronounsItem?.a) pronouns = pronounsItem.a.trim();
    }

    const tags = Array.isArray(bio.interests) && (bio.interests as string[]).length > 0
      ? (bio.interests as string[]).slice(0, 5)
      : skills.slice(0, 6);

    return NextResponse.json({
      name: bio.name ?? "Samyam Dhamala",
      headline: bio.headline ?? "",
      about: bio.about ?? "",
      pronouns,
      tags,
    });
  } catch (e: unknown) {
    console.error("[/api/bio] error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
