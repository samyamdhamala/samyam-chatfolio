"use client";

import { useEffect, useState } from "react";

export type ViewerRole = "Data Analyst" | "QA" | "IT Support";

export type RoleOption = {
  id: string;
  label: string;
  shortLabel: string;
  pitch: string;
  skills: string[];
  suggestedQuestions: string[];
};

const ROLE_TO_FOCUS: Record<string, ViewerRole> = {
  data_analyst: "Data Analyst",
  qa: "QA",
  it_support: "IT Support",
};

export function getSuggestedQuestionsForRole(
  roles: RoleOption[],
  focus: ViewerRole | null
): string[] {
  if (!focus || !roles.length) return [];
  const id = Object.entries(ROLE_TO_FOCUS).find(([, v]) => v === focus)?.[0];
  const r = roles.find((x) => x.id === id);
  return r?.suggestedQuestions ?? [];
}

export default function RoleSelector({
  selectedRole,
  onSelectRole,
  roles: rolesProp,
}: {
  selectedRole: ViewerRole | null;
  onSelectRole: (role: ViewerRole | null) => void;
  roles?: RoleOption[];
}) {
  const [rolesFetched, setRolesFetched] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(!rolesProp?.length);

  const roles = rolesProp?.length ? rolesProp : rolesFetched;

  useEffect(() => {
    if (rolesProp?.length) return;
    fetch("/api/roles")
      .then((r) => r.json())
      .then((data) => setRolesFetched(data.roles ?? []))
      .catch(() => setRolesFetched([]))
      .finally(() => setLoading(false));
  }, [rolesProp?.length]);

  const selectedOption = roles.find(
    (r) => ROLE_TO_FOCUS[r.id] === selectedRole
  );
  const selectedFocus = selectedRole ? ROLE_TO_FOCUS[selectedOption?.id ?? ""] ?? selectedRole : null;

  if (loading || roles.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-[var(--card-shadow)] p-6">
      <h2 className="section-title">I&apos;m recruiting for</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Select a role to see relevant experience and skills. The chatbot will tailor answers for that role.
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Recruiting role">
        {roles.map((r) => {
          const focus = ROLE_TO_FOCUS[r.id];
          const isSelected = selectedRole === focus;
          return (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectRole(isSelected ? null : focus)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-sky-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              {r.shortLabel}
            </button>
          );
        })}
        {selectedRole && (
          <button
            type="button"
            onClick={() => onSelectRole(null)}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Clear
          </button>
        )}
      </div>

      {selectedOption && selectedFocus && (
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/50">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {selectedOption.pitch}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedOption.skills.map((s) => (
              <span
                key={s}
                className="rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-2.5 py-1 text-xs font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

