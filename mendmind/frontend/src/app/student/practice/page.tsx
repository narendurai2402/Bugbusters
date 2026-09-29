"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/store/session";
import { getQuestionsByCategory } from "@/lib/mock";
import MasteryBars from "@/components/MasteryBars";
import InterventionPanel from "@/components/InterventionPanel";
import {
  BrainIcon,
  SparklesIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  LightbulbIcon,
  HelpCircleIcon,
  ArrowRightIcon,
  RefreshCwIcon,
  TargetIcon,
} from "@/components/Icons";

function PracticeContent() {
  const params = useSearchParams();
  const s = useSession();
  const category = params.get("category") === "dsa" ? "DSA" : "Math";
  const questionBank = getQuestionsByCategory(category);
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (s.category !== category) {
      s.setCategory(category);
    }
  }, [category, s]);

  const q = questionBank[s.qi] ?? questionBank[0];
  const rec = s.phase === "recovery";
  const level = s.last?.intervention?.level ?? 0;

  const send = async () => {
    if (!answer.trim() || s.busy) return;
    const a = answer;
    setAnswer("");
    await s.submit(a);
  };

  const demoWrong = () => {
    const wrongVal = rec ? q.recovery.wrong : Object.keys(q.wrong)[0];
    setAnswer(wrongVal);
  };

  const demoCorrect = () => {
    const correctVal = rec ? q.recovery.answers[0] : q.answers[0];
    setAnswer(correctVal);
  };

  const rungs = [
    { num: 1, name: "Probe", desc: "Diagnostic Walkthrough" },
    { num: 2, name: "Hint", desc: "Guided Direction" },
    { num: 3, name: "Explanation", desc: "Conceptual Breakdown" },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      {/* Main Practice Canvas */}
      <section className="space-y-6 rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        {/* Question Header & Progress Info */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <BrainIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-teal-400">Target Concept</span>
              <div className="font-bold text-slate-100 text-sm">{q.concept}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {rec ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300 animate-pulse">
                <SparklesIcon className="h-3.5 w-3.5 text-amber-400" />
                <span>Recovery Confirmation</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                <span>Question {s.qi + 1} of {questionBank.length}</span>
              </span>
            )}
          </div>
        </div>

        {/* Question Prompt Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 sm:p-8 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {rec ? "Fresh Recovery Question (No Hints)" : "Practice Problem"}
          </div>
          <div className="text-base font-extrabold tracking-tight text-white font-mono">
            {rec ? q.recovery.text : q.text}
          </div>
        </div>

        {/* Answer Input & Controls */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                disabled={s.busy}
                placeholder="Type your answer"
                className="w-full rounded-xl border-2 border-slate-700/80 bg-slate-950 px-4 py-3.5 text-lg font-medium text-white placeholder-slate-500 transition-colors focus:border-teal-500 focus:outline-none disabled:opacity-50"
              />
            </div>
            <button
              onClick={send}
              disabled={s.busy || !answer.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-teal-500/20 transition-all hover:shadow-teal-500/35 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              {s.busy ? (
                <>
                  <RefreshCwIcon className="h-5 w-5 animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <span>Submit Answer</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* Quick Demo Toolbar & Keyboard Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Demo Actions:</span>
              <button
                onClick={demoWrong}
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 font-semibold text-rose-300 transition-colors hover:bg-rose-500/20"
              >
                Fill Wrong Answer
              </button>
              <button
                onClick={demoCorrect}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
              >
                Fill Correct Answer
              </button>
            </div>

            <button
              onClick={s.skip}
              className="rounded-lg border border-slate-800 bg-slate-800/60 px-3 py-1.5 font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            >
              Skip Question
            </button>
          </div>
        </div>

        {/* 3-Rung Socratic Ladder Visual Tracker */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Socratic Intervention Ladder</span>
            <span>{level > 0 ? `Level ${level} Active` : "Awaiting Answer"}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {rungs.map((r, i) => {
              const active = level === r.num && !rec && s.last;
              const passed = level > r.num;

              return (
                <div
                  key={r.num}
                  className={`relative flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all duration-300 ${
                    passed
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                      : active
                      ? "border-teal-500/60 bg-teal-500/20 text-teal-300 shadow-lg shadow-teal-500/20 scale-[1.02]"
                      : "border-slate-800 bg-slate-950/40 text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-extrabold">
                    <span>{r.num}.</span>
                    <span>{r.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">{r.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notification Banner */}
        {s.note && (
          <div
            className={`rounded-xl border-l-4 p-4 text-sm font-medium shadow-md transition-all animate-fadeIn ${
              s.note.kind === "good"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                : "border-amber-500 bg-amber-500/10 text-amber-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {s.note.kind === "good" ? (
                <CheckCircleIcon className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangleIcon className="h-5 w-5 text-amber-400 flex-shrink-0" />
              )}
              <span>{s.note.text}</span>
            </div>
          </div>
        )}

        {/* Intervention Panel (Diagnosis + Hint) */}
        {s.last && !rec && <InterventionPanel result={s.last} onRecover={s.startRecovery} />}
      </section>

      {/* Sidebar: Live Mastery Insights */}
      <aside className="space-y-6 rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl h-fit">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <TargetIcon className="h-5 w-5 text-teal-400" />
            <h3 className="font-bold text-slate-100 text-base">Concept Mastery</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Live Adaptive</span>
        </div>

        <MasteryBars />

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 text-xs text-slate-400 space-y-2">
          <div className="font-bold text-slate-300">How Reason x works:</div>
          <p className="leading-relaxed">
            Correct answers increase mastery score. Incorrect answers trigger Socratic hints targeted at your exact misconception, followed by a fresh recovery test to ensure long-term retention.
          </p>
        </div>
      </aside>
    </div>
  );
}

export default function Practice() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-300">Loading practice...</div>}>
      <PracticeContent />
    </Suspense>
  );
}
