"use client";
import { useSession } from "@/store/session";
import { AlertTriangleIcon, CheckCircleIcon, TargetIcon, SparklesIcon } from "@/components/Icons";

export default function MasteryBars() {
  const { mastery, misconceptions } = useSession();

  const getTier = (val: number) => {
    if (val >= 0.75) return { label: "Mastered", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", bar: "from-teal-500 to-emerald-400" };
    if (val >= 0.45) return { label: "Developing", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", bar: "from-indigo-500 to-teal-400" };
    return { label: "Needs Practice", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", bar: "from-amber-500 to-rose-400" };
  };

  return (
    <div className="space-y-5">
      {Object.entries(mastery).map(([concept, value]) => {
        const pct = Math.round(value * 100);
        const tier = getTier(value);
        const conceptMisconceptions = misconceptions[concept] ?? [];

        return (
          <div key={concept} className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 transition-all hover:border-slate-700/80">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TargetIcon className="h-4 w-4 text-teal-400" />
                <span className="font-bold text-slate-100 text-sm">{concept}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tier.color}`}>
                  {tier.label}
                </span>
                <span className="text-sm font-black text-slate-200">{pct}%</span>
              </div>
            </div>

            {/* Progress Track */}
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${tier.bar} transition-all duration-700 ease-out`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Diagnosed Misconceptions */}
            {conceptMisconceptions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 pt-1">
                {conceptMisconceptions.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-300"
                  >
                    <AlertTriangleIcon className="h-3.5 w-3.5 text-rose-400 flex-shrink-0" />
                    <span>{m}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
