"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type RoleFocus = "Data Analyst" | "Business Analyst" | "QA";
type Tone = "Concise" | "Detailed";

type Msg = {
  role: "user" | "assistant";
  content: string;
  canDM?: boolean;
  confidence?: number;
  links?: string[];
};

const SUGGESTED: string[] = [
  "Give me your 60-second pitch.",
  "What are your top skills?",
  "Walk me through the Chat-First Portfolio (RAG) project.",
  "Which QA tools have you used?",
  "Summarize your education."
];

export default function AskPanel({
  roleFocus = "Data Analyst",
  tone = "Concise"
}: {
  roleFocus?: RoleFocus;
  tone?: Tone;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // DM modal state
  const [dmOpen, setDmOpen] = useState(false);
  const [pendingQ, setPendingQ] = useState("");

  // scroll only this container (prevents page jump)
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // optional prefill (e.g., from a project card)
  useEffect(() => {
    const q = sessionStorage.getItem("prefillQuestion");
    if (q) {
      sessionStorage.removeItem("prefillQuestion");
      setInput(q);
      // fire-and-forget, no need to await
      setTimeout(() => {
        void ask(q);
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-scroll INSIDE the chat box
  useEffect(() => {
    const el = chatBoxRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, loading]);

  const labelForLink = useCallback((href: string) => {
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
  }, []);

  const ask = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || loading) return;

      const userMsg: Msg = { role: "user", content: trimmed };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: trimmed, roleFocus, tone, sell: true })
        });

        const data = await res.json();

        const assistant: Msg = {
          role: "assistant",
          content: data.answer || data.error || "Sorry, something went wrong.",
          canDM: data.canDM,
          confidence: typeof data.confidence === "number" ? data.confidence : undefined,
          links: Array.isArray(data.links) ? data.links : undefined
        };

        setMessages((m) => [...m, assistant]);

        if (data.canDM) {
          setPendingQ(trimmed);
          setDmOpen(true);
        }
      } catch {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: "Sorry, I couldn’t reply right now. Please try again in a moment."
          }
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, roleFocus, tone]
  );

  async function reword(i: number, style: string) {
    const m = messages[i];
    if (!m || m.role !== "assistant") return;

    try {
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
        setMessages((arr) =>
          arr.map((x, idx) => (idx === i ? { ...x, content: data.text } : x))
        );
      }
    } catch {
      // optional: show a toast or inline error here
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    await ask(trimmed);
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm p-4">
      {/* Suggested chips */}
      <div className="flex flex-wrap gap-2 mb-3" aria-label="Suggested questions">
        {SUGGESTED.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => ask(s)}
            disabled={loading}
            className="rounded-full border px-3 py-1 text-sm bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chat messages — scrollable container */}
      <div
        ref={chatBoxRef}
        className="space-y-4 max-h-[60vh] overflow-y-auto pr-1"
        aria-label="Chat history"
      >
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <div
              className={`inline-block max-w-[90%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
                m.role === "user" ? "bg-blue-600 text-white" : "bg-white shadow"
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

              {m.role === "assistant" && (
                <>
                  {typeof m.confidence === "number" && (
                    <div className="mt-2 text-xs text-gray-500">
                      confidence: {m.confidence.toFixed(2)}
                    </div>
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
                      type="button"
                      onClick={() => reword(i, "Persuasive recruiter")}
                      className="text-xs rounded-full px-3 py-1 border bg-white hover:bg-gray-100"
                    >
                      Rephrase: Persuasive
                    </button>
                    <button
                      type="button"
                      onClick={() => reword(i, "Friendly and warm")}
                      className="text-xs rounded-full px-3 py-1 border bg-white hover:bg-gray-100"
                    >
                      Rephrase: Friendly
                    </button>
                    <button
                      type="button"
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
                        type="button"
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
      </div>

      {/* Composer */}
      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-xl border px-4 py-3"
          placeholder="e.g., Give me your 60-second pitch."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          aria-label="Ask a question"
        />
        <button
          type="submit"
          className="rounded-xl bg-blue-600 text-white px-5 disabled:opacity-60"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </form>

      {/* DM modal */}
      {dmOpen && (
        <DMModal onClose={() => setDmOpen(false)} originalQuestion={pendingQ} />
      )}
    </div>
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

  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Focus trap entry: focus the first input when the modal opens
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setStatus("sending");
    setErrMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim(), originalQuestion })
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

  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL ?? "you@example.com";
  const mailtoHref = `mailto:${ownerEmail}?subject=Portfolio%20inquiry&body=${encodeURIComponent(
    `Question: ${originalQuestion}\n\n`
  )}`;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Contact form"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
      >
        <h2 className="text-lg font-semibold">Ask me directly</h2>
        <p className="text-sm text-gray-600 mb-4">
          I’ll receive your question by email.
        </p>

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
            rows={4}
          />

          {status === "err" && (
            <div className="text-sm text-red-600">{errMsg}</div>
          )}
          {status === "ok" && (
            <div className="text-sm text-green-600">Sent!</div>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <a
              href={mailtoHref}
              className="px-4 py-2 rounded-lg border text-sm"
            >
              Open email app
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-sm"
              disabled={status === "sending"}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-60"
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
