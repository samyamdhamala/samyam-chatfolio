"use client";
import { useEffect, useRef } from "react";

type Project = {
  title: string;
  summary: string;
  dates?: string;
  role?: string;
  tools?: string[];
  links?: string[];
};

export default function ProjectRail({ projects = [] as Project[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // optional: arrow key horizontal scroll
    function onKey(e: KeyboardEvent) {
      if (!scroller.current) return;
      if (e.key === "ArrowRight") scroller.current.scrollBy({ left: 320, behavior: "smooth" });
      if (e.key === "ArrowLeft") scroller.current.scrollBy({ left: -320, behavior: "smooth" });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const labelForLink = (href: string) => {
    try {
      const u = new URL(href);
      if (u.hostname.includes("github")) {
        const parts = u.pathname.split("/").filter(Boolean);
        if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
      }
      return u.hostname.replace(/^www\./,"");
    } catch { return "Link"; }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">Projects</h2>
        <div className="text-sm text-gray-500">Scroll →</div>
      </div>

      <div ref={scroller} className="flex gap-4 overflow-x-auto pb-2 snap-x">
        {projects.map((p, idx) => (
          <article
            key={idx}
            className="min-w-[320px] max-w-[320px] snap-start rounded-2xl border bg-white shadow-sm p-4 flex flex-col"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">{p.title}</h3>
                <div className="text-xs text-gray-500">
                  {[p.role, p.dates].filter(Boolean).join(" • ")}
                </div>
              </div>
            </div>

            {p.summary && <p className="mt-2 text-sm text-gray-700 line-clamp-4">{p.summary}</p>}

            {p.tools && p.tools.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {p.tools.slice(0, 6).map((t, i) => (
                  <span key={i} className="text-[11px] rounded-full bg-gray-100 px-2 py-0.5">{t}</span>
                ))}
              </div>
            )}

            {p.links && p.links.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {p.links.slice(0, 3).map((href, i) => (
                  <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                     className="text-xs rounded-full px-2 py-1 bg-gray-900 text-white">
                    {labelForLink(href)}
                  </a>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
