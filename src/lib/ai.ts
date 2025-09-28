// src/lib/ai.ts
const LIST_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(key)}`;

const RANKED_PREFERENCES = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-2.0-flash-lite",
];

const LEGACY_MAP: Record<string, string> = {
  // normalize anything 1.5-ish to a safe, current default
  "gemini-1.5-flash": "gemini-2.5-flash",
  "gemini-1.5-pro": "gemini-2.5-pro",
  "gemini-1.5-flash-001": "gemini-2.5-flash",
  "gemini-1.5-flash-latest": "gemini-2.5-flash",
  "gemini-1.5-flash-8b": "gemini-2.5-flash",
};

// simple in-memory cache across requests
type Cache = { picked?: string; at?: number; available?: Set<string> };
const g = globalThis as any;
g.__modelCache = (g.__modelCache || {}) as Cache;

const TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function pickModel(): Promise<string> {
  const env = process.env.GEMINI_MODEL || process.env.GEMINI_MODE;
  const normalized = env ? LEGACY_MAP[env] || env : undefined;

  const now = Date.now();
  const cache = g.__modelCache as Cache;

  // fresh enough?
  if (cache.picked && cache.at && now - cache.at < TTL_MS) {
    // if env forces a specific model and it's available, honor it
    if (normalized && cache.available?.has(`models/${normalized}`)) return normalized;
    return cache.picked;
  }

  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("Missing GOOGLE_API_KEY");

  // list models your key can actually use
  const resp = await fetch(LIST_URL(key));
  if (!resp.ok) throw new Error(`List models failed: ${resp.status} ${resp.statusText}`);
  const data = await resp.json();

  const names: string[] = (data.models || []).map((m: any) => m.name);
  const available = new Set(names); // e.g., "models/gemini-2.5-flash"

  // Try env first (normalized), then ranked prefs
  let picked: string | undefined;

  const tryPick = (m: string) => {
    if (available.has(`models/${m}`)) {
      picked = m;
      return true;
    }
    return false;
  };

  if (normalized && tryPick(normalized)) {
    // ok
  } else {
    for (const m of RANKED_PREFERENCES) {
      if (tryPick(m)) break;
    }
  }

  if (!picked) {
    throw new Error("No supported Gemini model found for this API key/project.");
  }

  // cache result
  cache.picked = picked;
  cache.at = now;
  cache.available = available;

  return picked;
}

export async function generateText(prompt: string): Promise<{ model: string; text: string }> {
  const key = process.env.GOOGLE_API_KEY!;
  const model = await pickModel();

  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${encodeURIComponent(
    key
  )}`;
  const body = { contents: [{ role: "user", parts: [{ text: prompt }]}] };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    // On a model-specific failure, invalidate cache so the next call can re-pick
    (g.__modelCache as Cache).at = 0;
    throw new Error(`Gemini error: ${resp.status} ${resp.statusText} :: ${txt}`);
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text.trim()) throw new Error("Empty response");
  return { model, text };
}
