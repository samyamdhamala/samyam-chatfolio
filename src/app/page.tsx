"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import ProfileHeader from "../components/ProfileHeader";
import ChatAbout from "../components/ChatAbout";
import ProjectsGrid from "../components/ProjectsGrid";
import AskPanel from "../components/AskPanel";
import RoleSelector, {
  getSuggestedQuestionsForRole,
  type ViewerRole,
  type RoleOption,
} from "../components/RoleSelector";

export default function Page() {
  const [selectedRole, setSelectedRole] = useState<ViewerRole | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  useEffect(() => {
    fetch("/api/roles")
      .then((r) => r.json())
      .then((data) => setRoles(data.roles ?? []))
      .catch(() => setRoles([]));
  }, []);

  const suggestedQuestions = useMemo(
    () =>
      selectedRole && roles.length
        ? getSuggestedQuestionsForRole(roles, selectedRole)
        : undefined,
    [roles, selectedRole]
  );

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-20 border-b border-[var(--card-border)] bg-[var(--card)]/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 overflow-hidden rounded-full ring-2 ring-slate-200 dark:ring-slate-600">
              <Image
                src="/samyam.jpg"
                alt="Samyam Dhamala"
                fill
                className="object-cover"
                priority
              />
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              Samyam Dhamala
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-sm">
            <Link
              href="#about"
              className="text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              About
            </Link>
            <Link
              href="#chatbot"
              className="text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              Chat
            </Link>
            <Link
              href="#role"
              className="text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              Role
            </Link>
            <Link
              href="#ask"
              className="text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              Ask
            </Link>
            <Link
              href="#projects"
              className="text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              Projects
            </Link>
            <a
              href="https://github.com/samyamdhamala"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <section id="about" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <ProfileHeader />
      </section>

      <section id="role" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <RoleSelector
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          roles={roles}
        />
      </section>

      <section id="chatbot" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <ChatAbout />
      </section>

      <section id="ask" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <h2 className="section-title">Ask me anything</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm max-w-xl">
          {selectedRole
            ? `Answers are tailored for ${selectedRole} recruiters. `
            : ""}
          Questions about my experience, skills, or projects. Answers are grounded in my resume and project data.
        </p>
        <div className="mt-6">
          <AskPanel
            roleFocus={selectedRole ?? "QA"}
            suggestedQuestions={suggestedQuestions}
          />
        </div>
      </section>

      <section id="projects" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <h2 className="section-title">Projects</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm max-w-xl">
          BI dashboards, data analysis, QA automation, and full-stack work.
        </p>
        <div className="mt-6">
          <ProjectsGrid />
        </div>
      </section>

      <footer className="border-t border-[var(--card-border)] mt-16 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        © {new Date().getFullYear()} Samyam Dhamala
      </footer>
    </main>
  );
}
