"use client";

export default function ChatAbout() {
  return (
    <div className="rounded-2xl border bg-white shadow-sm p-6">
      <h2 className="text-xl font-semibold">About the Chatbot</h2>
      <p className="mt-2 text-gray-700">
        This portfolio is chat-first. Ask me about my experience, skills, or any project — the assistant answers strictly
        from my resume and project files using a Retrieval-Augmented Generation (RAG) pipeline. If it’s unsure, it says
        “I’m not sure” and offers to message me directly.
      </p>
      <ul className="mt-3 list-disc list-inside text-gray-700 space-y-1">
        <li>Grounded answers (no hallucinations): resume/projects ➜ embeddings ➜ top-K context</li>
        <li>Confidence gating: low confidence ➜ polite handoff to direct message</li>
        <li>Role-aware tone (Data Analyst / Business Analyst / QA)</li>
        <li>Optional rephrase to match recruiter style (persuasive / executive concise / friendly)</li>
      </ul>
    </div>
  );
}
