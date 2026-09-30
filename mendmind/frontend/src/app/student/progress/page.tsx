"use client";
import { useSession } from "@/store/session";
import MasteryBars from "@/components/MasteryBars";
import StudentDashboardSidebar from "@/components/StudentDashboardSidebar";
import {
  TrendingUpIcon,
  ActivityIcon,
  CheckCircleIcon,
  SparklesIcon,
  TargetIcon,
  AlertTriangleIcon,
  BookOpenIcon,
} from "@/components/Icons";

export default function Progress() {
  const { mastery, history } = useSession();
  const vals = Object.values(mastery);
  const avg = Math.round((vals.reduce((a, b) => a + b, 0) / (vals.length || 1)) * 100);
  const totalAttempts = history.length;
  const recoveredCount = history.filter((h) => h.recovered).length;

  const stats = [
    { label: "Overall Mastery", val: `${avg}%`, icon: TrendingUpIcon, color: "from-teal-500 to-emerald-400", sub: "Average across concepts" },
    { label: "Practice Activity", val: totalAttempts, icon: ActivityIcon, color: "from-indigo-500 to-purple-400", sub: "Total questions attempted" },
    { label: "Concepts Recovered", val: recoveredCount, icon: SparklesIcon, color: "from-amber-500 to-rose-400", sub: "Successful misconception repairs" },
  ];

  return (
    <div className="flex flex-col gap-8 xl:flex-row">
      <StudentDashboardSidebar />

      <div className="flex-1 space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">My Learning Progress</h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time breakdown of conceptual mastery and misconception recovery trajectory.
            </p>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map(({ label, val, icon: Icon, color, sub }) => (
            <div
              key={label}
              className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl transition-all hover:border-slate-700/80"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80 text-teal-400 group-hover:text-teal-300 transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className={`text-4xl font-black tracking-tight text-gradient bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                  {val}
                </span>
                <p className="text-xs text-slate-500 mt-1">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Grid: Concept Mastery & Activity Feed */}
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Left: Concept Mastery Bars */}
          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <TargetIcon className="h-5 w-5 text-teal-400" />
                <h2 className="text-xl font-bold text-white">Skill Mastery Matrix</h2>
              </div>
              <span className="text-xs text-slate-400">Target: 80%+ Mastery</span>
            </div>

            <MasteryBars />
          </section>

          {/* Right: Activity Log Timeline */}
          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl space-y-5 h-fit">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ActivityIcon className="h-5 w-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-base">Recent Activity Log</h3>
              </div>
              <span className="text-xs text-slate-400">{history.length} events</span>
            </div>

            {history.length ? (
              <div className="relative space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {[...history].slice(-8).reverse().map((item, idx) => {
                  const isRecovery = item.recovered;
                  const isMiss = item.text.includes("Miss");

                  return (
                    <div key={idx} className="relative flex items-start gap-3.5 pl-1 text-xs">
                      <div
                        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border ${
                          isRecovery
                            ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                            : isMiss
                            ? "border-rose-500/40 bg-rose-500/20 text-rose-400"
                            : "border-teal-500/40 bg-teal-500/20 text-teal-400"
                        }`}
                      >
                        {isRecovery ? (
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                        ) : isMiss ? (
                          <AlertTriangleIcon className="h-3.5 w-3.5" />
                        ) : (
                          <BookOpenIcon className="h-3.5 w-3.5" />
                        )}
                      </div>

                      <div className="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                        <p className="font-semibold text-slate-200">{item.text}</p>
                        <span className="text-[10px] text-slate-500">Attempt {history.length - idx}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-8 text-center space-y-2">
                <BookOpenIcon className="mx-auto h-8 w-8 text-slate-600" />
                <p className="text-sm font-medium text-slate-400">No practice activity logged yet.</p>
                <p className="text-xs text-slate-500">Answer questions on the Practice Canvas to populate your learning history.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
