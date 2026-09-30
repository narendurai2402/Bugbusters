"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/store/session";
import type { PracticeCategory } from "@/lib/types";
import {
  BookOpenIcon,
  BrainIcon,
  ClipboardListIcon,
  LayersIcon,
  NotebookIcon,
  TargetIcon,
  TrendingUpIcon,
} from "@/components/Icons";

const navItems = [
  { href: "/student", label: "Dashboard", icon: TargetIcon },
  { href: "/student/learnings", label: "My Learnings", icon: BookOpenIcon },
  { href: "/student/practice", label: "Practice", icon: BrainIcon },
  { href: "/student/quizzes", label: "Quizzes", icon: ClipboardListIcon },
  { href: "/student/progress", label: "Progress", icon: TrendingUpIcon },
  { href: "/student/notes", label: "Notes", icon: NotebookIcon },
  { href: "/student/settings", label: "Settings", icon: TargetIcon },
];

export default function StudentDashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, category, setCategory } = useSession();

  const initials = (user?.name ?? "Learner")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const selectSubject = (next: PracticeCategory) => {
    setCategory(next);
    router.push("/student/practice");
  };
  const subjects: {
    key: PracticeCategory;
    label: string;
    detail: string;
    icon: typeof BrainIcon;
    color: string;
  }[] = [
    { key: "Math", label: "Mathematics", detail: "Fractions & equations", icon: BrainIcon, color: "text-emerald-300" },
    { key: "DSA", label: "DSA", detail: "Algorithms & logic", icon: LayersIcon, color: "text-amber-300" },
    { key: "Science", label: "Science", detail: "Explore core concepts", icon: BrainIcon, color: "text-sky-300" },
    { key: "Python", label: "Python", detail: "Programming fundamentals", icon: BrainIcon, color: "text-cyan-300" },
    { key: "Java", label: "Java", detail: "Object-oriented programming", icon: BrainIcon, color: "text-rose-300" },
  ];

  return (
    <aside className="w-full max-w-[280px] shrink-0 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-indigo-500 text-base font-black text-slate-950">
          {initials || "L"}
        </div>
        <div>
          <h2 className="text-lg font-black text-white">{user?.name ?? "Learner"}</h2>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/student"
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-sm font-semibold transition-all ${
                active
                  ? "border-teal-500/40 bg-teal-500/10 text-teal-200"
                  : "border-transparent bg-slate-950/30 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 border-t border-slate-800 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Subjects</p>
        <div className="mt-3 space-y-3">
          {subjects.map(({ key, label, detail, icon: Icon, color }) => {
            const active = category === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectSubject(key)}
                className={`w-full rounded-2xl border p-3 text-left transition-all ${
                  active
                    ? "border-teal-500/40 bg-teal-500/10"
                    : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <span className={`rounded-lg bg-slate-800 p-2 ${color}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-white">{label}</span>
                      <span className="block text-[11px] text-slate-400">{detail}</span>
                    </span>
                  </span>
                  {active && <span className="text-xs font-bold text-teal-300">Active</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Quick note</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Switch subjects anytime from this dashboard without leaving the learning flow.
        </p>
      </div>
    </aside>
  );
}
