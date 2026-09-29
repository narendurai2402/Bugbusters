"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/store/session";
import { STUDENTS, CONCEPTS, TOP_MISCONCEPTIONS } from "@/lib/mock";
import { getTeacherData, type TeacherData } from "@/lib/api";
import {
  UsersIcon,
  ShieldAlertIcon,
  TrendingUpIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  SparklesIcon,
} from "@/components/Icons";

const getMasteryColor = (v: number) => {
  if (v >= 0.75) return { bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", label: "Mastered" };
  if (v >= 0.45) return { bg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", label: "Developing" };
  return { bg: "bg-rose-500/20 text-rose-300 border-rose-500/30", label: "Needs Help" };
};

export default function Dashboard() {
  const { mastery } = useSession();
  const [data, setData] = useState<TeacherData | null>(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    getTeacherData()
      .then((d) => {
        setData(d);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 4000); // Live polling during demo
    return () => clearInterval(t);
  }, []);

  const students = data?.students ?? STUDENTS;
  const mis = data?.misconceptions ?? TOP_MISCONCEPTIONS;
  const rows = data ? students : [...students, { name: "You (Live Session)", mastery: CONCEPTS.map((c) => mastery[c]) }];
  
  const filteredRows = rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  const risk = rows.filter((r) => r.mastery.some((v) => v < 0.35));
  const avg = Math.round(
    (rows.flatMap((r) => r.mastery).reduce((a, b) => a + b, 0) / (rows.length * CONCEPTS.length || 1)) * 100
  );
  const maxMisCount = Math.max(...mis.map((m) => m[1]), 1);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-white tracking-tight">Teacher Analytics</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Live Live Refresh
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time classroom misconception diagnostic matrix &amp; mastery heatmaps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-200 transition-colors hover:bg-slate-700"
          >
            <RefreshCwIcon className={`h-4 w-4 text-teal-400 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Live Data</span>
          </button>
        </div>
      </div>

      {/* Backend API Error Banner if any */}
      {error && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-200 flex items-center gap-3">
          <AlertTriangleIcon className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <div>
            <strong>Backend API notice:</strong> Could not connect to FastAPI server at process.env.NEXT_PUBLIC_API_URL.
            Operating in fallback mock mode. Start backend or set <code className="text-amber-300 font-mono">NEXT_PUBLIC_USE_MOCK=true</code>.
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Enrolled Students</span>
            <UsersIcon className="h-5 w-5 text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{rows.length}</span>
            <span className="text-xs text-slate-400">active learners</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Students At Risk</span>
            <ShieldAlertIcon className="h-5 w-5 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-black text-rose-400">{risk.length}</span>
            <span className="text-xs text-slate-400">&lt; 35% concept mastery</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Class Average Mastery</span>
            <TrendingUpIcon className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-black text-indigo-300">{avg}%</span>
            <span className="text-xs text-slate-400">overall comprehension</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Heatmap + Misconception & Risk Panel */}
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* Class Heatmap Matrix */}
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Classroom Mastery Heatmap</h2>
              <p className="text-xs text-slate-400 mt-0.5">Live student concept mastery ratings</p>
            </div>

            {/* Filter Input */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student..."
              className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 font-semibold">Student Name</th>
                  {CONCEPTS.map((c) => (
                    <th key={c} className="py-3 px-2 text-center font-semibold">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRows.map((r) => {
                  const isLiveUser = r.name.includes("You");
                  return (
                    <tr key={r.name} className={`hover:bg-slate-800/40 transition-colors ${isLiveUser ? "bg-teal-500/5" : ""}`}>
                      <td className="py-3 font-medium text-slate-200 flex items-center gap-2">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${isLiveUser ? "bg-teal-500/20 text-teal-300 font-bold" : "bg-slate-800 text-slate-400"}`}>
                          <UserIcon className="h-3.5 w-3.5" />
                        </div>
                        <span>{r.name}</span>
                        {isLiveUser && (
                          <span className="rounded bg-teal-500/20 border border-teal-500/30 px-1.5 py-0.5 text-[9px] font-bold text-teal-300">
                            LIVE
                          </span>
                        )}
                      </td>

                      {r.mastery.map((v, i) => {
                        const pct = Math.round(v * 100);
                        const style = getMasteryColor(v);

                        return (
                          <td key={i} className="p-1 text-center">
                            <div className={`rounded-xl border px-2 py-1.5 font-extrabold text-xs transition-transform hover:scale-105 ${style.bg}`}>
                              {pct}%
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Misconceptions Distribution & At-Risk Panel */}
        <div className="space-y-6">
          {/* Top Misconceptions */}
          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Top Recurring Misconceptions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Most common diagnosed error patterns</p>
            </div>

            <div className="space-y-4">
              {mis.map(([label, count]) => {
                const pct = Math.round((count / maxMisCount) * 100);
                return (
                  <div key={label} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-200">{label}</span>
                      <span className="text-rose-400 font-bold">{count} occurrences</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* At-Risk Spotlight Panel */}
          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlertIcon className="h-5 w-5 text-rose-400" />
                <h3 className="font-bold text-white text-base">At-Risk Intervention Alert</h3>
              </div>
              <span className="text-xs text-rose-400 font-bold">{risk.length} Flagged</span>
            </div>

            {risk.length ? (
              <div className="flex flex-wrap gap-2">
                {risk.map((r) => (
                  <div
                    key={r.name}
                    className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300"
                  >
                    <UserIcon className="h-3.5 w-3.5" />
                    <span>{r.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">All students are above the 35% mastery threshold.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
