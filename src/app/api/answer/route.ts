import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { topK } from "@/lib/search";

export const runtime = "nodejs";

const genAI = process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null;

const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || "text-embedding-004";
// Try env model first, then fallbacks that are broadly available
const CHAT_MODEL_CANDIDATES = [
  ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []),
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-001",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b"
];

const TOPK = 10;
const LOW_CONF = 0.40;

async function generateWithFallback(prompt: string) {
  const errors: string[] = [];
  for (const modelName of CHAT_MODEL_CANDIDATES) {
    try {
      const m = genAI!.getGenerativeModel({ model: modelName });
      const out = await m.generateContent(prompt);
      return { text: out.response.text(), model: modelName };
    } catch (e: any) {
      errors.push(`${modelName}: ${e?.message || e}`);
      // try next candidate
    }
  }
  throw new Error(`All chat models failed.\nTried: ${CHAT_MODEL_CANDIDATES.join(", ")}\nErrors:\n${errors.join("\n")}`);
}

export async function POST(req: NextRequest) {
  try {
    const { question, roleFocus = "Data Analyst", tone = "Concise" } = await req.json();
    if (!question) return NextResponse.json({ error: "Missing question" }, { status: 400 });
    if (!genAI)   return NextResponse.json({ error: "GOOGLE_API_KEY not set" }, { status: 500 });

    // 1) Embed query & retrieve
    const embedModel = genAI.getGenerativeModel({ model: EMBED_MODEL });
    const q = await embedModel.embedContent(question);
    const results = topK(q.embedding.values, TOPK);
    const top1 = results[0]?.score ?? 0;
    const conf = Math.round((top1 + Number.EPSILON) * 100) / 100;

    // 2) Low confidence → polite handoff
    if (conf < LOW_CONF) {
      return NextResponse.json({
        answer: "I’m not sure about that. Want to message me directly?",
        confidence: conf,
        sources: [],
        canDM: true
      });
    }

    // 3) Build context (labels only for grounding, never shown)
    const context = results
      .map(({ r }) => `Label: ${r.metadata.label ?? r.metadata.source}\n${r.text}`)
      .join("\n---\n");

    // 4) Persona & style
    const askIsSkillsy = /skills?|tools?|tech( stack)?|kpi|impact|achieve|experience summary|responsibilit/i.test(question);
    const styleHint = askIsSkillsy || tone === "Concise"
      ? "Write compact, high-signal bullets. Avoid decorative symbols. Vary openings; do not start every line with 'I'."
      : "Write 1–2 short paragraphs with smooth transitions and no bullet symbols unless asked.";
    const personaHint = "Speak in first person as Samyam Dhamala (she/her).";
    const recruiterHint = `Answer as if to a ${roleFocus} recruiter. Be confident, warm, and professional. Prefer measurable outcomes and tools when available.`;
    const noCitationsHint = "Do NOT include file names, labels, or bracketed citations in the output. No 'According to my resume'.";
    const boundaries = "Use ONLY the provided context. If information isn’t present, say: 'I’m not sure about that. Want to message me directly?'";

    const prompt = [
      personaHint,
      recruiterHint,
      boundaries,
      styleHint,
      noCitationsHint,
      "",
      `User question: ${question}`,
      "",
      "Context:",
      context
    ].join("\n");

    // 5) Generate with fallback models
    const { text: answer /*, model*/ } = await generateWithFallback(prompt);

    // gather related links if present in metadata
    const relatedLinks = Array.from(new Set(results.flatMap(({ r }) => r.metadata.links ?? []))).slice(0, 6);

    return NextResponse.json({
      answer,
      confidence: conf,
      sources: [],
      links: relatedLinks,
      canDM: false
    });
  } catch (err: any) {
    console.error("answer error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
