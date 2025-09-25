"use client";

import { useEffect, useRef, useState } from "react";
import Hero from "@/components/Hero";
import ProjectRail from "@/components/ProjectRail";


type Msg = {
  role: "user" | "assistant";
  content: string;
  canDM?: boolean;
  confidence?: number;
  links?: string[];
};

const SUGGESTED = [
  "Give me your 60-second pitch.",
  "What are your top skills?",
  "Walk me through the Chat-First Portfolio (RAG) project.",
  "Which QA tools have you used?",
  "Summarize your education."
];

export default function Page() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [roleFocus, setRoleFocus] = useState<"Data Analyst" | "Business Analyst" | "QA">("Data Analyst");
  const [tone, setTone] = useState<"Concise" | "Detailed">("Concise");
  const [loading, setLoading] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
      .catch(() => setProjects([]));
  }, []);


  // DM modal state
  const [dmOpen, setDmOpen] = useState(false);
  const [pendingQ, setPendingQ] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  function labelForLink(href: string) {
    try {
      const u = new URL(href);
      if (u.hostname.includes("github")) {
        const parts = u.pathname.split("/").filter(Boolean);
        if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
      }
      return u.hostname.replace(/^www\./, "");
    } catch {
      return "Link";
    }
  }

  async function ask(question: string) {
    const userMsg: Msg = { role: "user", content: question };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, roleFocus, tone, sell: true })
    });
    const data = await res.json();
    setLoading(false);

    const assistant: Msg = {
      role: "assistant",
      content: data.answer || data.error || "Sorry, something went wrong.",
      canDM: data.canDM,
      confidence: data.confidence,
      links: data.links
    };
    setMessages((m) => [...m, assistant]);

    // Open DM modal on low-confidence answers
    if (data.canDM) {
      setPendingQ(question);
      setDmOpen(true);
    }
  }

  async function reword(i: number, style: string) {
    const m = messages[i];
    if (m.role !== "assistant") return;
    const res = await fetch("/api/reword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: m.content,
        style,
        length: "medium",
        roleFocus
      })
    });
    const data = await res.json();
    if (data.text) {
      setMessages((arr) => arr.map((x, idx) => (idx === i ? { ...x, content: data.text } : x)));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) await ask(input.trim());
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-semibold">Samyam Dhamala — Chat Portfolio</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Tone</span>
            <button
              onClick={() => setTone(tone === "Concise" ? "Detailed" : "Concise")}
              className="px-3 py-2 rounded-full border bg-white hover:bg-gray-100"
            >
              {tone}
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Hero with role selector + resume downloads */}
        <Hero role={roleFocus} onRoleChange={setRoleFocus} />

        {/* Suggested prompts */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((s, i) => (
            <button
              key={i}
              onClick={() => ask(s)}
              className="rounded-full border px-3 py-2 text-sm bg-white hover:bg-gray-100"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Project rail */}
        <ProjectRail projects={projects} />

        {/* Chat */}
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <div
                className={`inline-block max-w-[90%] md:max-w-[75%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-blue-600 text-white" : "bg-white shadow"
                  }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

                {m.role === "assistant" && (
                  <>
                    {typeof m.confidence === "number" && (
                      <div className="mt-2 text-xs text-gray-500">confidence: {m.confidence}</div>
                    )}

                    {/* Related links */}
                    {m.links && m.links.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {m.links.map((href, idx) => (
                          <a
                            key={idx}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs rounded-full px-2 py-1 bg-gray-900 text-white"
                            title={href}
                          >
                            {labelForLink(href)}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Rephrase */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => reword(i, "Persuasive recruiter")}
                        className="text-xs rounded-full px-3 py-1 border bg-white hover:bg-gray-100"
                      >
                        Rephrase: Persuasive
                      </button>
                      <button
                        onClick={() => reword(i, "Friendly and warm")}
                        className="text-xs rounded-full px-3 py-1 border bg-white hover:bg-gray-100"
                      >
                        Rephrase: Friendly
                      </button>
                      <button
                        onClick={() => reword(i, "Executive concise")}
                        className="text-xs rounded-full px-3 py-1 border bg-white hover:bg-gray-100"
                      >
                        Rephrase: Executive
                      </button>
                    </div>

                    {/* DM handoff */}
                    {m.canDM && (
                      <div className="mt-3">
                        <button
                          onClick={() => setDmOpen(true)}
                          className="inline-flex items-center rounded-full bg-gray-900 text-white px-4 py-2 text-sm"
                        >
                          Message me directly
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-left">
              <div className="inline-block rounded-2xl px-4 py-3 bg-white shadow">
                <div className="animate-pulse w-64 h-4 bg-gray-200 rounded mb-2" />
                <div className="animate-pulse w-48 h-4 bg-gray-200 rounded" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <form onSubmit={onSubmit} className="sticky bottom-4 bg-white/70 backdrop-blur rounded-2xl border shadow-sm p-3 flex gap-2">
          <input
            className="flex-1 rounded-xl border px-4 py-3"
            placeholder="e.g., Give me your 60-second pitch."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="rounded-xl bg-blue-600 text-white px-5 disabled:opacity-60" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>

        {/* DM modal */}
        {dmOpen && <DMModal onClose={() => setDmOpen(false)} originalQuestion={pendingQ} />}
      </section>
    </main>
  );
}

/* ---------- DM Modal ---------- */

function DMModal({
  onClose,
  originalQuestion
}: {
  onClose: () => void;
  originalQuestion: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, originalQuestion })
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("err");
        setErrMsg(data.error || "Failed to send");
        return;
      }

      setStatus("ok");
      setTimeout(onClose, 1200);
    } catch (err: any) {
      setStatus("err");
      setErrMsg(err?.message || "Network error");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold">Ask me directly</h2>
        <p className="text-sm text-gray-600 mb-4">I’ll receive your question by email.</p>

        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />

          {status === "err" && <div className="text-sm text-red-600">{errMsg}</div>}
          {status === "ok" && <div className="text-sm text-green-600">Sent! 🎉</div>}

          <div className="flex flex-wrap justify-end gap-2">
            {/* mailto fallback so users can still contact you if backend is down */}
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_OWNER_EMAIL ?? "you@example.com"}?subject=Portfolio%20inquiry&body=${encodeURIComponent(
                `Question: ${originalQuestion}\n\n`
              )}`}
              className="px-4 py-2 rounded-lg border"
            >
              Open email app
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border"
              disabled={status === "sending"}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-gray-900 text-white disabled:opacity-60"
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
