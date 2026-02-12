"use client";

export default function ChatAbout() {
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-[var(--card-shadow)] p-6">
      <h2 className="section-title">About this chatbot</h2>
      <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
        This portfolio is chat-first. Ask about my experience, skills, or any project — the assistant answers
        only from my resume and project files using a Retrieval-Augmented Generation (RAG) pipeline. If it&apos;s
        unsure, it suggests messaging me directly.
      </p>
      <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
        <li className="flex gap-2">
          <span className="text-sky-500 dark:text-sky-400 shrink-0">•</span>
          Grounded answers: resume & projects → embeddings → top-K context
        </li>
        <li className="flex gap-2">
          <span className="text-sky-500 dark:text-sky-400 shrink-0">•</span>
          Low confidence → polite handoff to direct message
        </li>
        <li className="flex gap-2">
          <span className="text-sky-500 dark:text-sky-400 shrink-0">•</span>
          Optional rephrase: persuasive, executive, or friendly tone
        </li>
      </ul>
    </div>
  );
}
