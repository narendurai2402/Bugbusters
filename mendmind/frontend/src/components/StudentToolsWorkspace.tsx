"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StudentDashboardSidebar from "@/components/StudentDashboardSidebar";
import { ArrowRightIcon, BookOpenIcon, BrainIcon, ClipboardListIcon, NotebookIcon, TargetIcon, TrendingUpIcon, UserIcon } from "@/components/Icons";
import { NotesPanel, QuizPanel } from "@/components/StudentWorkspace";
import type { PracticeCategory } from "@/lib/types";
import { useSession } from "@/store/session";

type StudentTool = "learnings" | "quizzes" | "notes" | "settings";
type Preferences = { defaultSubject: PracticeCategory; dailyGoal: number; reminders: boolean };

const pages: Record<StudentTool, { title: string; eyebrow: string; description: string }> = {
  learnings: { title: "Your learning tools", eyebrow: "My Learnings", description: "Pick up where you left off or choose a focused way to study." },
  quizzes: { title: "Knowledge checks", eyebrow: "Quizzes", description: "Review a subject with a focused set of adaptive questions." },
  notes: { title: "Study notes", eyebrow: "Notes", description: "Keep useful explanations, examples, and reminders close at hand." },
  settings: { title: "Study preferences", eyebrow: "Settings", description: "Personalize your study routine and default practice subject." },
};

const tools = [
  { href: "/student/practice", label: "Practice", description: "Work through adaptive questions and build concept mastery.", icon: BrainIcon, tone: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { href: "/student/quizzes", label: "Quizzes", description: "Check your understanding with a focused subject review.", icon: ClipboardListIcon, tone: "text-amber-800 bg-amber-50 border-amber-200" },
  { href: "/student/progress", label: "Progress", description: "Review your mastery and recent practice activity.", icon: TrendingUpIcon, tone: "text-sky-800 bg-sky-50 border-sky-200" },
  { href: "/student/notes", label: "Notes", description: "Save and search the ideas you want to remember.", icon: NotebookIcon, tone: "text-rose-800 bg-rose-50 border-rose-200" },
];

const settingsKey = "reasonxStudentPreferences";

export default function StudentToolsWorkspace({ tool }: { tool: StudentTool }) {
  const router = useRouter();
  const session = useSession();
  const page = pages[tool];

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:px-10 lg:py-12">
      <StudentDashboardSidebar />
      <div className="min-w-0 flex-1">
        <header className="mb-7 border-b border-slate-200 pb-5">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-emerald-700">{page.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{page.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{page.description}</p>
        </header>

        {tool === "learnings" && (
          <div>
            <div className="mb-5 flex items-center gap-2"><BookOpenIcon className="h-5 w-5 text-indigo-700" /><h2 className="text-lg font-black text-slate-950">Choose a learning tool</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {tools.map(({ href, label, description, icon: Icon, tone }) => (
                <Link key={href} href={href} className="group flex min-h-44 flex-col border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                  <span className={`grid h-11 w-11 place-items-center border ${tone}`}><Icon className="h-5 w-5" /></span>
                  <span className="mt-4 flex items-center justify-between gap-3 text-lg font-black text-slate-950">{label}<ArrowRightIcon className="h-4 w-4 text-indigo-700 transition-transform group-hover:translate-x-1" /></span>
                  <span className="mt-1 text-sm leading-6 text-slate-600">{description}</span>
                </Link>
              ))}
            </div>
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h2 className="text-lg font-black text-slate-950">Continue by subject</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["Math", "DSA", "Science", "Python", "Java"] as PracticeCategory[]).map((category) => (
                  <button key={category} type="button" onClick={() => { session.setCategory(category); router.push(`/student/practice?category=${category.toLowerCase()}`); }} className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-800">{category === "Math" ? "Mathematics" : category === "DSA" ? "Data Structures & Algorithms" : category}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tool === "quizzes" && <QuizPanel onStart={(category) => { session.setCategory(category); router.push(`/student/practice?category=${category.toLowerCase()}`); }} />}
        {tool === "notes" && <NotesPanel />}
        {tool === "settings" && <SettingsPanel />}
      </div>
    </section>
  );
}

function SettingsPanel() {
  const { user, category, setCategory } = useSession();
  const [preferences, setPreferences] = useState<Preferences>({ defaultSubject: category, dailyGoal: 10, reminders: true });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(settingsKey);
      if (stored) setPreferences((current) => ({ ...current, ...JSON.parse(stored) as Partial<Preferences> }));
    } catch {
      localStorage.removeItem(settingsKey);
    }
  }, []);

  const savePreferences = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    localStorage.setItem(settingsKey, JSON.stringify(preferences));
    setCategory(preferences.defaultSubject);
    setSaved(true);
  };

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="grid h-11 w-11 place-items-center bg-indigo-50 text-indigo-700"><UserIcon className="h-5 w-5" /></span>
          <div><h2 className="font-black text-slate-950">Account</h2><p className="text-xs text-slate-500">Your signed-in profile</p></div>
        </div>
        <dl className="mt-4 space-y-4">
          <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Name</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{user?.name ?? "Learner"}</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</dt><dd className="mt-1 break-all text-sm font-semibold text-slate-800">{user?.email ?? "Not available"}</dd></div>
        </dl>
      </section>

      <form onSubmit={savePreferences} className="border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2"><TargetIcon className="h-5 w-5 text-emerald-700" /><h2 className="font-black text-slate-950">Learning routine</h2></div>
        <label htmlFor="default-subject" className="mb-1 block text-xs font-bold text-slate-700">Default practice subject</label>
        <select id="default-subject" value={preferences.defaultSubject} onChange={(event) => { setPreferences({ ...preferences, defaultSubject: event.target.value as PracticeCategory }); setSaved(false); }} className="mb-4 w-full border border-slate-300 bg-white px-3 py-2.5 text-sm">
          <option value="Math">Mathematics</option><option value="DSA">Data Structures &amp; Algorithms</option><option value="Science">Science</option><option value="Python">Python</option><option value="Java">Java</option>
        </select>
        <label htmlFor="daily-goal" className="mb-1 block text-xs font-bold text-slate-700">Daily question goal</label>
        <select id="daily-goal" value={preferences.dailyGoal} onChange={(event) => { setPreferences({ ...preferences, dailyGoal: Number(event.target.value) }); setSaved(false); }} className="mb-4 w-full border border-slate-300 bg-white px-3 py-2.5 text-sm">
          <option value={5}>5 questions</option><option value={10}>10 questions</option><option value={15}>15 questions</option><option value={20}>20 questions</option>
        </select>
        <label className="flex items-center gap-3 border-t border-slate-100 py-4 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={preferences.reminders} onChange={(event) => { setPreferences({ ...preferences, reminders: event.target.checked }); setSaved(false); }} className="h-4 w-4 accent-indigo-700" />Study reminders enabled
        </label>
        <button type="submit" className="w-full bg-indigo-700 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-indigo-800">Save preferences</button>
        {saved && <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">Preferences saved.</p>}
      </form>
    </div>
  );
}