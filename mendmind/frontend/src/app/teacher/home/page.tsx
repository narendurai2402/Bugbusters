"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  createAssignment,
  getTeacherData,
  listAssignments,
  type AssignTarget,
  type Assignment,
  type TeacherData,
} from "@/lib/api";
import { CATEGORIES, CONCEPTS, QUESTION_BANKS } from "@/lib/mock";
import { CheckCircleIcon, RefreshCwIcon, ShieldAlertIcon, TrendingUpIcon, UsersIcon } from "@/components/Icons";

type Subject = (typeof CATEGORIES)[number];

const panelClass = "rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl";
const fieldClass = "w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none";

function summarize(mastery: number[]) {
  const average = mastery.reduce((sum, value) => sum + value, 0) / (mastery.length || 1);
  const weakest = mastery.indexOf(Math.min(...mastery));
  return {
    average,
    weakest: CONCEPTS[weakest] ?? "-",
    atRisk: average < 0.45 || Math.min(...mastery) < 0.3,
  };
}

export default function TeacherHome() {
  const [data, setData] = useState<TeacherData | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<Subject>("Math");
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [mode, setMode] = useState<AssignTarget>("all");
  const [due, setDue] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [teacherData, savedAssignments] = await Promise.all([getTeacherData(), listAssignments()]);
      setData(teacherData);
      setAssignments(savedAssignments);
      setLoadError(null);
    } catch {
      setLoadError("Could not refresh teacher data. Please try again.");
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(timer);
  }, []);

  const rows = (data?.students ?? []).map((student) => ({
    name: student.name,
    ...summarize(student.mastery),
  }));
  const visibleRows = rows.filter((student) => student.name.toLowerCase().includes(search.toLowerCase()));
  const atRiskCount = rows.filter((student) => student.atRisk).length;
  const classAverage = Math.round(
    rows.reduce((sum, student) => sum + student.average, 0) / (rows.length || 1) * 100,
  );
  const questionBank = QUESTION_BANKS[subject];
  const targetCount = mode === "all" ? rows.length : mode === "at_risk" ? atRiskCount : selected.length;

  const toggle = (values: string[], value: string) =>
    values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

  const submitAssignment = async () => {
    setMessage(null);
    if (!title.trim()) {
      setMessage({ ok: false, text: "Give the activity a title." });
      return;
    }
    if (!questionIds.length) {
      setMessage({ ok: false, text: "Pick at least one question." });
      return;
    }
    if (mode === "selected" && !selected.length) {
      setMessage({ ok: false, text: "Select at least one student." });
      return;
    }

    setBusy(true);
    try {
      await createAssignment({
        title: title.trim(),
        subject,
        questionIds,
        mode,
        students: selected,
        due: due || undefined,
        note: note.trim(),
      });
      setMessage({ ok: true, text: `Assigned "${title.trim()}" to ${targetCount} student${targetCount === 1 ? "" : "s"}.` });
      setTitle("");
      setQuestionIds([]);
      setDue("");
      setNote("");
      await load();
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Could not save the assignment." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Teacher Home</h1>
          <p className="mt-1 text-sm text-slate-400">Review student progress and assign focused practice.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => void load()} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700">
            <RefreshCwIcon className="h-4 w-4 text-teal-400" /> Refresh
          </button>
          <Link href="/teacher/dashboard" className="rounded-xl border border-teal-500/40 bg-teal-500/10 px-4 py-2.5 text-xs font-bold text-teal-300 hover:bg-teal-500/20">
            Full analytics
          </Link>
        </div>
      </header>

      {loadError && <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">{loadError}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Students", value: rows.length, icon: <UsersIcon className="h-5 w-5 text-teal-400" />, color: "text-white" },
          { label: "Class mastery", value: `${classAverage}%`, icon: <TrendingUpIcon className="h-5 w-5 text-indigo-400" />, color: "text-indigo-300" },
          { label: "Need help", value: atRiskCount, icon: <ShieldAlertIcon className="h-5 w-5 text-rose-400" />, color: "text-rose-400" },
        ].map((metric) => (
          <section key={metric.label} className={panelClass}>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">{metric.label}{metric.icon}</div>
            <p className={`mt-2 text-4xl font-black ${metric.color}`}>{metric.value}</p>
          </section>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <section className={`${panelClass} space-y-4`}>
          <div className="flex flex-col justify-between gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Student performance</h2>
              <p className="mt-0.5 text-xs text-slate-400">Select learners when assigning an activity.</p>
            </div>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students..." className={`${fieldClass} sm:max-w-56`} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead><tr className="border-b border-slate-800 text-slate-400"><th className="py-2" /><th className="py-2">Student</th><th className="py-2">Mastery</th><th className="py-2">Weakest concept</th><th className="py-2">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-800/60">
                {visibleRows.map((student) => (
                  <tr key={student.name} className="hover:bg-slate-800/40">
                    <td className="py-2.5"><input type="checkbox" checked={selected.includes(student.name)} onChange={() => { setSelected((values) => toggle(values, student.name)); setMode("selected"); }} aria-label={`Select ${student.name}`} className="h-4 w-4 accent-teal-500" /></td>
                    <td className="py-2.5 font-medium text-slate-200">{student.name}</td>
                    <td className="py-2.5 font-bold text-slate-300">{Math.round(student.average * 100)}%</td>
                    <td className="py-2.5 text-slate-400">{student.weakest}</td>
                    <td className={`py-2.5 font-bold ${student.atRisk ? "text-rose-300" : "text-emerald-300"}`}>{student.atRisk ? "Needs help" : "On track"}</td>
                  </tr>
                ))}
                {!visibleRows.length && <tr><td colSpan={5} className="py-6 text-center text-slate-500">No students match that search.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <section className={`${panelClass} space-y-4`}>
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xl font-bold text-white">Assign an activity</h2>
              <p className="mt-0.5 text-xs text-slate-400">Choose practice questions and recipients.</p>
            </div>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Activity title" maxLength={120} className={fieldClass} />
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((item) => (
                <button key={item} type="button" onClick={() => { setSubject(item); setQuestionIds([]); }} className={`rounded-full border px-3 py-1 text-xs font-bold ${subject === item ? "border-teal-500/40 bg-teal-500/20 text-teal-300" : "border-slate-700 bg-slate-800/60 text-slate-400"}`}>{item}</button>
              ))}
            </div>
            <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 p-2">
              <button type="button" onClick={() => setQuestionIds(questionIds.length === questionBank.length ? [] : questionBank.map((question) => question.id))} className="px-2 py-1 text-xs font-bold text-teal-400">
                {questionIds.length === questionBank.length ? "Clear selection" : `Select all ${questionBank.length}`}
              </button>
              {questionBank.map((question) => (
                <label key={question.id} className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-slate-800/60">
                  <input type="checkbox" checked={questionIds.includes(question.id)} onChange={() => setQuestionIds((values) => toggle(values, question.id))} className="mt-0.5 h-4 w-4 accent-teal-500" />
                  <span className="text-slate-200">{question.text}<span className="block text-[11px] text-slate-500">{question.concept}</span></span>
                </label>
              ))}
            </div>
            <fieldset className="space-y-2">
              <legend className="mb-1 text-xs font-semibold text-slate-400">Assign to</legend>
              {([
                ["all", `Whole class (${rows.length})`],
                ["at_risk", `Students who need help (${atRiskCount})`],
                ["selected", `Selected students (${selected.length})`],
              ] as [AssignTarget, string][]).map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-2 text-xs text-slate-200">
                  <input type="radio" name="assignment-target" checked={mode === value} onChange={() => setMode(value)} className="accent-teal-500" /> {label}
                </label>
              ))}
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-400">Due date<input type="date" value={due} onChange={(event) => setDue(event.target.value)} className={`${fieldClass} mt-1`} /></label>
              <label className="text-xs font-semibold text-slate-400">Note<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional" maxLength={500} className={`${fieldClass} mt-1`} /></label>
            </div>
            {message && <p role="status" className={`rounded-xl border px-3 py-2 text-xs font-medium ${message.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}`}>{message.text}</p>}
            <button type="button" onClick={() => void submitAssignment()} disabled={busy} className="w-full rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-teal-400 disabled:opacity-60">
              {busy ? "Assigning..." : `Assign to ${targetCount} student${targetCount === 1 ? "" : "s"}`}
            </button>
          </section>

          <section className={`${panelClass} space-y-3`}>
            <h2 className="text-base font-bold text-white">Recent activities</h2>
            {assignments.slice(0, 5).map((assignment) => (
              <article key={assignment.id} className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5 text-xs">
                <div className="flex justify-between gap-2 font-semibold text-slate-200"><span>{assignment.title}</span><span className="text-slate-500">{assignment.subject}</span></div>
                <p className="mt-0.5 text-slate-400">{assignment.questionIds.length} questions · {assignment.mode === "all" ? "Whole class" : assignment.mode === "at_risk" ? "At-risk students" : `${assignment.students.length} selected`}{assignment.due ? ` · due ${assignment.due}` : ""}</p>
              </article>
            ))}
            {!assignments.length && <p className="text-xs text-slate-400">Nothing assigned yet.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
