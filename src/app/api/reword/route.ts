import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const genAI = process.env.GOOGLE_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
  : null;

export async function POST(req: NextRequest) {
  try {
    const {
      text,
      roleFocus = "Data Analyst",              // "Data Analyst" | "Business Analyst" | "QA"
      style = "Persuasive recruiter",          // e.g., "Executive concise", "Friendly and warm"
      length = "medium",                       // "short" | "medium" | "long"
      jd = ""                                  // optional pasted job description to tailor to
    } = await req.json();

    if (!text || typeof text !== "string")
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    if (!genAI)
      return NextResponse.json({ error: "GOOGLE_API_KEY not set" }, { status: 500 });

    const targetLen =
      length === "short" ? "3–4 sentences"
      : length === "long" ? "120–180 words"
      : "60–100 words";

    const persona = "Write in first person as Samyam Dhamala (she/her).";
    const guardrails = [
      "Keep facts consistent with the original; do not invent achievements, numbers, or tools not present.",
      "No citations, file names, or labels.",
      "Vary sentence openings; avoid starting every sentence with 'I'."
    ].join(" ");

    const tailoring = jd
      ? `Tailor the rewrite to this job description by emphasizing directly relevant tools, responsibilities, and results:\n${jd}\n`
      : "";

    const prompt = [
      persona,
      `Audience: a ${roleFocus} recruiter.`,
      `Desired style: ${style}. Target length: ${targetLen}.`,
      guardrails,
      tailoring,
      "Rewrite the following text smoothly and naturally:",
      text
    ].join("\n\n");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const out = await model.generateContent(prompt);
    const rewritten = out.response.text();

    return NextResponse.json({ text: rewritten });
  } catch (e: any) {
    console.error("[REWORD ERROR]", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
