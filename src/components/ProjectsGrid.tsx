"use client";

import { useEffect, useState } from "react";

type Project = {
  title: string;
  summary?: string;
  dates?: string;
  role?: string;
  tools?: string[];
  links?: string[];
};

export default function ProjectsGrid() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        setProjects(data.projects || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5"
          >
            <div className="animate-pulse h-4 w-2/3 bg-slate-200 dark:bg-slate-600 rounded mb-3" />
            <div className="animate-pulse h-3 w-1/2 bg-slate-100 dark:bg-slate-700 rounded mb-3" />
            <div className="animate-pulse h-20 w-full bg-slate-100 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!projects.length) {
    return (
      <p className="text-slate-600 dark:text-slate-400 text-sm">No projects yet.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {projects.map((p, idx) => (
        <article
          key={idx}
          className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-[var(--card-shadow)] p-5 flex flex-col hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
        >
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {p.title}
            </h3>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {[p.role, p.dates].filter(Boolean).join(" · ")}
            </div>
          </div>

          {p.summary && (
            <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
              {p.summary}
            </p>
          )}

          {p.tools && p.tools.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.tools.slice(0, 6).map((t, i) => (
                <span
                  key={i}
                  className="text-[11px] rounded-full bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-400 px-2 py-0.5"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {p.links && p.links.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {p.links.slice(0, 2).map((href, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs rounded-lg px-2.5 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium hover:opacity-90 transition-opacity"
                >
                  {labelForLink(href)}
                </a>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
            <a
              href="#ask"
              className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
              onClick={() => {
                sessionStorage.setItem(
                  "prefillQuestion",
                  getSuggestedProjectQuestion(p)
                );
              }}
            >
              Ask about this project →
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}

function getSuggestedProjectQuestion(p: Project): string {
  const title = p.title;
  const role = (p.role || "").toLowerCase();
  if (role.includes("qa") || role.includes("engineer")) {
    return `What did you test and automate in the ${title} project? What tools did you use and what impact did it have?`;
  }
  if (role.includes("data") || role.includes("analyst")) {
    return `What did you build and analyze in the ${title} project? What tools and insights did you deliver?`;
  }
  if (role.includes("full-stack") || role.includes("developer")) {
    return `Walk me through the ${title} project: what you built, what tools and tech you used, and what impact it had.`;
  }
  return `Walk me through the ${title} project—what you did, what tools you used, and what impact it had.`;
}

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
