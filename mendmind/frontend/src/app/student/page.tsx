import Link from "next/link";
import { ArrowRightIcon, BrainIcon, LayersIcon } from "@/components/Icons";

export default function StudentHome() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="max-w-3xl">
        <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-emerald-700">Your learning space</p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">What would you like to practice?</h1>
        <p className="mt-4 max-w-2xl text-lg leading-7 text-slate-600">Choose a subject to start. Reason X will help you work through each problem and understand the ideas behind your answers.</p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <Link
          href="/student/practice?category=math"
          className="group flex min-h-80 flex-col border border-emerald-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-emerald-500"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="grid h-20 w-20 place-items-center bg-emerald-100 text-emerald-800">
              <BrainIcon className="h-11 w-11" />
            </div>
            <span className="bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-800">3 guided problems</span>
          </div>
          <div className="mt-8 flex flex-1 flex-col">
            <h2 className="text-3xl font-black text-slate-950">Mathematics</h2>
            <p className="mt-2 text-base leading-6 text-slate-600">Practice fractions, compare values, and build confidence with step-by-step guidance.</p>
            <span className="mt-6 inline-flex items-center gap-2 font-extrabold text-emerald-800">
              Start Math practice <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>

        <Link
          href="/student/practice?category=dsa"
          className="group flex min-h-80 flex-col border border-amber-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-amber-400 hover:shadow-xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-amber-500"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="grid h-20 w-20 place-items-center bg-amber-100 text-amber-800">
              <LayersIcon className="h-11 w-11" />
            </div>
            <span className="bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-900">3 guided problems</span>
          </div>
          <div className="mt-8 flex flex-1 flex-col">
            <h2 className="text-3xl font-black text-slate-950">Data Structures &amp; Algorithms</h2>
            <p className="mt-2 text-base leading-6 text-slate-600">Explore binary search, queues, and time complexity with targeted hints and recovery practice.</p>
            <span className="mt-6 inline-flex items-center gap-2 font-extrabold text-amber-900">
              Start DSA practice <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}