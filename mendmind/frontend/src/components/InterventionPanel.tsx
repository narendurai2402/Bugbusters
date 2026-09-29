"use client";
import type { SubmitAnswerResponse } from "@/lib/types";
import { AlertTriangleIcon, LightbulbIcon, ArrowRightIcon, SparklesIcon, ShieldAlertIcon } from "@/components/Icons";

export default function InterventionPanel({
  result,
  onRecover,
}: {
  result: SubmitAnswerResponse;
  onRecover: () => void;
}) {
  if (result.correct || !result.intervention || !result.misconception) return null;

  const { type, level, message } = result.intervention;
  const confPct = Math.round(result.misconception.confidence * 100);

  const levelBadges = {
    probe: { bg: "bg-teal-500/10 border-teal-500/30 text-teal-300", label: "Rung 1: Probe Question", icon: LightbulbIcon },
    hint: { bg: "bg-amber-500/10 border-amber-500/30 text-amber-300", label: "Rung 2: Guided Hint", icon: LightbulbIcon },
    explanation: { bg: "bg-indigo-500/10 border-indigo-500/30 text-indigo-300", label: "Rung 3: Structural Explanation", icon: SparklesIcon },
  };

  const currentLevelBadge = levelBadges[type] || levelBadges.probe;
  const BadgeIcon = currentLevelBadge.icon;

  return (
    <div className="mt-5 space-y-3.5 animate-fadeIn">
      {/* Diagnosed Misconception Header Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 text-rose-300">
            <ShieldAlertIcon className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-rose-400">Diagnosed Misconception</span>
            <div className="font-bold text-slate-100 text-sm">{result.misconception.label}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-rose-950/80 border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-300">
          <span>{confPct}% Confidence</span>
        </div>
      </div>

      {/* Socratic Ladder Step Callout */}
      <div className={`rounded-xl border p-4 shadow-lg backdrop-blur-md ${currentLevelBadge.bg}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <BadgeIcon className="h-4 w-4" />
            <span>{currentLevelBadge.label}</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Step {level} of 3</span>
        </div>
        <p className="text-sm font-medium text-slate-100 leading-relaxed pl-1 border-l-2 border-current">
          {message}
        </p>
      </div>

      {/* Level 3 Recovery CTA */}
      {level === 3 && (
        <div className="pt-2">
          <button
            onClick={onRecover}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-indigo-600 to-purple-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-500/25 transition-all hover:shadow-teal-500/40 hover:scale-[1.01] active:scale-[0.99]"
          >
            <SparklesIcon className="h-5 w-5 text-teal-300 animate-pulse" />
            <span>Try a Fresh Question to Confirm Recovery</span>
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}
    </div>
  );
}
