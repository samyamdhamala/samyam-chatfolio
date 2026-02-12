"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Bio = {
  name: string;
  headline: string;
  about: string;
  pronouns: string | null;
  tags: string[];
};

export default function ProfileHeader() {
  const [bio, setBio] = useState<Bio | null>(null);

  useEffect(() => {
    fetch("/api/bio")
      .then((r) => r.json())
      .then((data) => setBio(data))
      .catch(() => setBio(null));
  }, []);

  const name = bio?.name ?? "Samyam Dhamala";
  const about = bio?.about ?? "Data Analyst and QA Engineer with experience in analytics, test automation, and IT support.";
  const tags = bio?.tags ?? ["SQL", "Python", "Power BI", "Tableau", "QA Automation"];
  const pronounLine = bio?.pronouns ? ` (${bio.pronouns})` : "";

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-[var(--card-shadow)] p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
      <div className="shrink-0">
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-700 ring-1 ring-slate-200/50 dark:ring-slate-600">
          <Image src="/samyam.jpg" alt={name} fill className="object-cover" priority />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Hi, I&apos;m {name.split(" ")[0]}.{pronounLine}
        </h1>
        {bio?.headline && (
          <p className="mt-1.5 text-sm font-medium text-sky-600 dark:text-sky-400">
            {bio.headline}
          </p>
        )}
        <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed text-[15px]">
          {about}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 px-3 py-1 text-xs font-medium"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/Samyam_Dhamala_Resume.pdf"
            download
            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Download PDF
          </a>
          <a
            href="/Samyam_Dhamala_Resume.docx"
            download
            className="inline-flex items-center px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            Download DOCX
          </a>
          <a
            href="https://github.com/samyamdhamala"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
