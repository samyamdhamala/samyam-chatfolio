import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { topK } from "@/lib/search";

export const runtime = "nodejs";

const genAI = process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null;
const TOPK = 10;
const LOW_CONF = 0.40;

export async function POST(req: NextRequest) {
  try {
    const { question, roleFocus = "Data Analyst", tone = "Concise" } = await req.json();
    if (!question) return NextResponse.json({ error: "Missing question" }, { status: 400 });
    if (!genAI)   return NextResponse.json({ error: "GOOGLE_API_KEY not set" }, { status: 500 });

    // 1) Embed query & retrieve
    const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const q = await embedModel.embedContent(question);
    const results = topK(q.embedding.values, TOPK);
    const top1 = results[0]?.score ?? 0;
    const conf = Math.round((top1 + Number.EPSILON) * 100) / 100;

    // 2) Low confidence → polite handoff
    if (conf < LOW_CONF) {
      return NextResponse.json({
        answer: "I’m not sure about that. Want to message me directly?",
        confidence: conf,
        sources: [],   // hidden in UI anyway
        canDM: true
      });
    }

    // 3) Build context (labels only for grounding, never shown)
    const context = results.map(({ r }) => `Label: ${r.metadata.label ?? r.metadata.source}\n${r.text}`).join("\n---\n");

    // 4) Style & persona hints
    const askIsSkillsy = /skills?|tools?|tech( stack)?|kpi|impact|achieve|experience summary|responsibilit/i.test(question);
    const styleHint = askIsSkillsy || tone === "Concise"
      ? "Write compact, high-signal bullets. Avoid decorative symbols. Vary openings; do not start every line with 'I'."
      : "Write 1–2 short paragraphs with smooth transitions and no bullet symbols unless asked.";
    const personaHint = "Speak in first person as Samyam Dhamala (she/her).";
    const recruiterHint = `Answer as if to a ${roleFocus} recruiter. Be confident, warm, and professional. Prefer measurable outcomes and tools when available.`;
    const noCitationsHint = "Do NOT include file names, labels, or bracketed citations in the output. No 'According to my resume'.";
    const boundaries = "Use ONLY the provided context. If information isn’t present, say: 'I’m not sure about that. Want to message me directly?'";

    const chatModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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

    const out = await chatModel.generateContent(prompt);
    const answer = out.response.text();

    return NextResponse.json({
      answer,
      confidence: conf,
      sources: [],  // keep empty so UI never shows chips
      canDM: false
    });
  } catch (err: any) {
    console.error("answer error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
