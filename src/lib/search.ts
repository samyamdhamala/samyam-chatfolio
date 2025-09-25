// src/lib/search.ts
import fs from "fs";
import path from "path";

type Meta = { source: string; label?: string; section?: string; links?: string[] };
export type Row = {
  id: string;
  text: string;
  metadata: Meta;
  embedding: number[];
};

let KB: Row[] | null = null;

export function loadKB() {
  if (!KB) {
    const p = path.join(process.cwd(), "data", "kb.json");
    const raw = fs.readFileSync(p, "utf8");
    KB = JSON.parse(raw);
  }
  return KB!;
}

function dot(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
function norm(a: number[]) { return Math.sqrt(dot(a, a)); }
function cosine(a: number[], b: number[]) { return dot(a, b) / (norm(a) * norm(b) + 1e-8); }

export function topK(queryEmb: number[], k = 6) {
  const kb = loadKB();
  const scored = kb.map((r) => ({ r, score: cosine(queryEmb, r.embedding) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

export function confidence(scores: number[]) {
  const mean = scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1);
  return Math.round(mean * 100) / 100;
}
