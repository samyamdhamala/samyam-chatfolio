import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const genAI = process.env.GOOGLE_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
  : null;

// Try an env override first, then a list of broadly available models
const CHAT_MODEL_CANDIDATES = [
  ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []),
   "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash-lite-001"
];

// Map legacy 1.5 names to current 2.x names
const LEGACY_MAP: Record<string, string> = {
  "gemini-1.5-flash": "gemini-2.5-flash",
  "gemini-1.5-pro": "gemini-2.5-pro",
  "gemini-1.5-flash-001": "gemini-2.5-flash",
  "gemini-1.5-flash-latest": "gemini-2.5-flash",
  "gemini-1.5-flash-8b": "gemini-2.5-flash",
};

// Accept GEMINI_MODEL or (older) GEMINI_MODE and normalize
const RAW_ENV_MODEL = process.env.GEMINI_MODEL || process.env.GEMINI_MODE || "";
const ENV_MODEL = RAW_ENV_MODEL ? (LEGACY_MAP[RAW_ENV_MODEL] || RAW_ENV_MODEL) : "";
async function generateWithFallback(prompt: string) {
  const errors: string[] = [];
  for (const modelName of CHAT_MODEL_CANDIDATES) {
    try {
      const m = genAI!.getGenerativeModel({ model: modelName });
      const out = await m.generateContent(prompt);
      return out.response.text();
    } catch (e: any) {
      errors.push(`${modelName}: ${e?.message || String(e)}`);
      console.error("[REWORD MODEL ERROR]", { modelName, message: e?.message || String(e) });

    }
  }
  throw new Error(
    `All reword models failed.\nTried: ${CHAT_MODEL_CANDIDATES.join(", ")}\nErrors:\n${errors.join("\n")}`
  );
}

export async function POST(req: NextRequest) {
  try {
    const {
      text,
      roleFocus = "QA",
      style = "Same facts, shorter.",
      length = "short",               // "short" for shorten; "medium" | "long" if needed later
      jd = ""
    } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }
    if (!genAI) {
      return NextResponse.json({ error: "GOOGLE_API_KEY not set" }, { status: 500 });
    }

    const targetLen =
      length === "short" ? "3–4 sentences" :
      length === "long"  ? "120–180 words"  :
                           "60–100 words";

    const persona = "Write in first person as Samyam Dhamala (she/her).";
    const guardrails = [
      "Keep facts consistent with the original; do not invent achievements, numbers, or tools not present.",
      "Include what, when, where, and key numbers (percentages, timeframes). No citations or file names."
    ].join(" ");

    const SOURCE_MAX = 12000;
    const safeText = text.slice(0, SOURCE_MAX);
    const safeJD = jd ? String(jd).slice(0, SOURCE_MAX) : "";

    const tailoring = safeJD
      ? `Tailor the rewrite to this job description:\n${safeJD}\n`
      : "";

    const prompt = [
      persona,
      `Audience: a ${roleFocus} recruiter.`,
      `Task: ${style} Target length: ${targetLen}.`,
      guardrails,
      tailoring,
      "Shorten the following text while keeping the same facts and key numbers:",
      safeText
    ].join("\n\n");

    const rewritten = await generateWithFallback(prompt);
    return NextResponse.json({ text: rewritten });
  } catch (e: any) {
    console.error("[REWORD ERROR]", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
