"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type RoleFocus = "Data Analyst" | "Business Analyst" | "QA" | "IT Support";
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
  roleFocus = "QA",
  tone = "Detailed",
  suggestedQuestions,
}: {
  roleFocus?: RoleFocus;
  tone?: Tone;
  suggestedQuestions?: string[];
}) {
  const chips = (suggestedQuestions?.length ? suggestedQuestions : SUGGESTED).slice(0, 5);
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

  async function shorten(i: number) {
    const m = messages[i];
    if (!m || m.role !== "assistant") return;

    try {
      const res = await fetch("/api/reword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: m.content,
          style: "Same facts, shorter.",
          length: "short",
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
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-[var(--card-shadow)] p-5">
      {/* Suggested chips */}
      <div className="flex flex-wrap gap-2 mb-4" aria-label="Suggested questions">
        {chips.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => ask(s)}
            disabled={loading}
            className="rounded-full border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-50 transition-colors"
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
                m.role === "user" ? "bg-sky-600 text-white" : "bg-[var(--card)] border border-[var(--card-border)] shadow-sm"
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

              {m.role === "assistant" && (
                <>
                  {typeof m.confidence === "number" && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
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
                          className="text-xs rounded-lg px-2.5 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium"
                          title={href}
                        >
                          {labelForLink(href)}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Shorten */}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => shorten(i)}
                      className="text-xs rounded-lg px-3 py-1.5 border border-slate-200 dark:border-slate-600 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                    >
                      Shorten
                    </button>
                  </div>

                  {/* DM handoff */}
                  {m.canDM && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setDmOpen(true)}
                        className="inline-flex items-center rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 text-sm font-medium"
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
            <div className="inline-block rounded-2xl px-4 py-3 bg-[var(--card)] border border-[var(--card-border)]">
              <div className="animate-pulse w-64 h-4 bg-slate-200 dark:bg-slate-600 rounded mb-2" />
              <div className="animate-pulse w-48 h-4 bg-slate-200 dark:bg-slate-600 rounded" />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-[var(--card)] px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          placeholder="e.g., Give me your 60-second pitch."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          aria-label="Ask a question"
        />
        <button
          type="submit"
          className="rounded-xl bg-sky-600 text-white px-5 py-3 font-medium hover:bg-sky-700 disabled:opacity-60 transition-colors"
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
        className="bg-[var(--card)] rounded-2xl shadow-xl w-full max-w-md p-6 border border-[var(--card-border)]"
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ask me directly</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          I’ll receive your question by email.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-[var(--card)] text-slate-900 dark:text-slate-100"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-[var(--card)] text-slate-900 dark:text-slate-100"
            placeholder="Your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <textarea
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-[var(--card)] text-slate-900 dark:text-slate-100"
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
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              Open email app
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm disabled:opacity-50"
              disabled={status === "sending"}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium disabled:opacity-60"
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
