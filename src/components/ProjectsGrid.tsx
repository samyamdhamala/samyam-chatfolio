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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0,1,2,3].map(i => (
          <div key={i} className="rounded-2xl border bg-white p-4">
            <div className="animate-pulse h-4 w-1/2 bg-gray-200 rounded mb-2" />
            <div className="animate-pulse h-4 w-3/4 bg-gray-200 rounded mb-2" />
            <div className="animate-pulse h-24 w-full bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!projects.length) return <p className="text-gray-600">No projects yet.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.map((p, idx) => (
        <article key={idx} className="rounded-2xl border bg-white shadow-sm p-4 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">{p.title}</h3>
              <div className="text-xs text-gray-500">
                {[p.role, p.dates].filter(Boolean).join(" • ")}
              </div>
            </div>
          </div>

          {p.summary && <p className="mt-2 text-sm text-gray-700">{p.summary}</p>}

          {p.tools && p.tools.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {p.tools.slice(0, 6).map((t, i) => (
                <span key={i} className="text-[11px] rounded-full bg-gray-100 px-2 py-0.5">{t}</span>
              ))}
            </div>
          )}

          {(p.links && p.links.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {p.links.slice(0,2).map((href, i) => (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                   className="text-xs rounded-full px-2 py-1 bg-gray-900 text-white">
                  {labelForLink(href)}
                </a>
              ))}
            </div>
          )}

          <div className="mt-3">
            <a
              href="#ask"
              className="text-xs rounded-full px-3 py-1 border bg-white hover:bg-gray-100"
              onClick={() => {
                // Prefill a suggested question via sessionStorage for AskPanel to pick up
                sessionStorage.setItem("prefillQuestion", `Tell me about the ${p.title} project.`);
              }}
            >
              Ask about this project
            </a>
          </div>
        </article>
      ))}
    </div>
  );
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
