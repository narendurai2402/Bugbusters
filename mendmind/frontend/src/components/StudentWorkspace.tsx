"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getQuestionsByCategory } from "@/lib/mock";
import type { PracticeCategory } from "@/lib/types";
import { useSession } from "@/store/session";
import MasteryBars from "@/components/MasteryBars";
import {
  ActivityIcon,
  ArrowRightIcon,
  BookOpenIcon,
  BrainIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  NotebookIcon,
  SparklesIcon,
  TargetIcon,
  TrashIcon,
  TrendingUpIcon,
} from "@/components/Icons";

type MainSection = "dashboard" | "learnings";
type LearningTab = "Practice" | "Quizzes" | "Progress" | "Notes" | "Calendar";
type StudyNote = { id: string; title: string; subject: string; body: string; createdAt: string };
type StudyEvent = { id: string; title: string; date: string; kind: string };

const tabs: { label: LearningTab; icon: typeof BookOpenIcon }[] = [
  { label: "Practice", icon: BookOpenIcon },
  { label: "Quizzes", icon: ClipboardListIcon },
  { label: "Progress", icon: TrendingUpIcon },
  { label: "Notes", icon: NotebookIcon },
  { label: "Calendar", icon: CalendarIcon },
];
const subjects: { category: PracticeCategory; description: string; icon: typeof BrainIcon; color: string }[] = [
  { category: "Math", description: "Fractions, equations, and percentages", icon: BrainIcon, color: "emerald" },
  { category: "DSA", description: "Algorithms and data structures", icon: ActivityIcon, color: "amber" },
  { category: "Science", description: "Build confidence with core concepts", icon: SparklesIcon, color: "sky" },
  { category: "Python", description: "Practice Python programming basics", icon: BrainIcon, color: "cyan" },
  { category: "Java", description: "Learn Java syntax and objects", icon: BrainIcon, color: "rose" },
];
const tones: Record<string, string> = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  sky: "border-sky-200 bg-sky-50 text-sky-800",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-800",
  rose: "border-rose-200 bg-rose-50 text-rose-800",
};
const notesKey = "reasonxStudentNotes";
const eventsKey = "reasonxStudentCalendarEvents";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function StudentWorkspace() {
  const session = useSession();
  const router = useRouter();
  const [section, setSection] = useState<MainSection>("dashboard");
  const [learningTab, setLearningTab] = useState<LearningTab>("Practice");

  useEffect(() => {
    const syncHash = () => setSection(window.location.hash === "#learnings" ? "learnings" : "dashboard");
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const showSection = (next: MainSection) => {
    setSection(next);
    window.location.hash = next === "learnings" ? "learnings" : "dashboard";
  };
  const openTab = (tab: LearningTab) => {
    const routes: Record<LearningTab, string> = {
      Practice: "/student/practice",
      Quizzes: "/student/quizzes",
      Progress: "/student/progress",
      Notes: "/student/notes",
      Calendar: "/student/learnings",
    };
    router.push(routes[tab]);
  };
  const masteryValues = Object.values(session.mastery);
  const mastery = Math.round(masteryValues.reduce((sum, value) => sum + value, 0) / (masteryValues.length || 1) * 100);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      {section === "dashboard" ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-emerald-700">Student dashboard</p>
              <h1 className="mt-2 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">Welcome back, {session.user?.name?.split(" ")[0] ?? "Learner"}.</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Pick a subject, check your progress, or plan your next study session.</p>
            </div>
            <button type="button" onClick={() => openTab("Practice")} className="inline-flex items-center gap-2 bg-indigo-700 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-indigo-800">My Learnings <ArrowRightIcon className="h-4 w-4" /></button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Metric icon={TargetIcon} label="Overall mastery" value={`${mastery}%`} detail="Across learning concepts" />
            <Metric icon={ActivityIcon} label="Questions attempted" value={`${session.history.length}`} detail="Keep building your practice" />
            <Metric icon={CheckCircleIcon} label="Concepts recovered" value={`${session.history.filter((item) => item.recovered).length}`} detail="Misconceptions repaired" />
          </div>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-indigo-700">Continue learning</p><h2 className="mt-1 text-2xl font-black text-slate-950">Choose your next step</h2></div>
            <button type="button" onClick={() => openTab("Practice")} className="text-sm font-bold text-indigo-700 hover:text-indigo-900">View My Learnings <ArrowRightIcon className="ml-1 inline h-4 w-4" /></button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {subjects.map(({ category, description, icon: Icon, color }) => (
              <button key={category} type="button" onClick={() => { session.setCategory(category); openTab("Practice"); }} className="group flex min-h-48 flex-col border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                <span className={`grid h-12 w-12 place-items-center border ${tones[color]}`}><Icon className="h-6 w-6" /></span>
                <span className="mt-4 text-lg font-black text-slate-950">{category === "DSA" ? "Data Structures & Algorithms" : category === "Math" ? "Mathematics" : category}</span>
                <span className="mt-1 text-sm text-slate-600">{description}</span>
                <span className="mt-auto flex items-center gap-2 pt-4 text-sm font-extrabold text-indigo-700">Continue <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mb-7"><p className="text-sm font-extrabold uppercase tracking-[0.16em] text-indigo-700">My Learnings</p><h1 className="mt-2 text-4xl font-black text-slate-950 sm:text-5xl">Your learning tools</h1></div>
          <div className="mb-7 flex gap-2 overflow-x-auto border-b border-slate-200" role="tablist" aria-label="Learning tools">
            {tabs.map(({ label, icon: Icon }) => <button key={label} type="button" role="tab" aria-selected={learningTab === label} onClick={() => setLearningTab(label)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${learningTab === label ? "border-indigo-700 text-indigo-800" : "border-transparent text-slate-500 hover:text-slate-900"}`}><Icon className="h-4 w-4" />{label}</button>)}
          </div>
          {learningTab === "Practice" && <PracticePanel />}
          {learningTab === "Quizzes" && <QuizPanel onStart={(category) => { session.setCategory(category); setLearningTab("Practice"); }} />}
          {learningTab === "Progress" && <ProgressPanel />}
          {learningTab === "Notes" && <NotesPanel />}
          {learningTab === "Calendar" && <CalendarPanel />}
        </>
      )}
    </section>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof TargetIcon; label: string; value: string; detail: string }) {
  return <div className="border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{label}</span><span className="grid h-9 w-9 place-items-center bg-indigo-50 text-indigo-700"><Icon className="h-4 w-4" /></span></div><p className="mt-3 text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
}

function PracticePanel() {
  const session = useSession();
  const [answer, setAnswer] = useState("");
  const bank = getQuestionsByCategory(session.category);
  const question = bank[session.qi] ?? bank[0];
  const recovery = session.phase === "recovery";
  const send = async () => { if (!answer.trim() || session.busy) return; const submitted = answer; setAnswer(""); await session.submit(submitted); };
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_0.8fr]">
      <div>
        <div className="mb-4 flex flex-wrap gap-2">{subjects.map(({ category, icon: Icon, color }) => <button key={category} type="button" onClick={() => session.setCategory(category)} aria-pressed={session.category === category} className={`inline-flex items-center gap-2 border px-3 py-2 text-sm font-bold ${session.category === category ? tones[color] : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}><Icon className="h-4 w-4" />{category}</button>)}</div>
        <div className="border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4"><div><p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">{recovery ? "Recovery question" : question.concept}</p><h2 className="mt-1 text-xl font-black text-slate-950">{recovery ? "Try a fresh example" : `${session.category} practice`}</h2></div><span className="bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-800">Question {session.qi + 1} of {bank.length}</span></div>
          <p className="py-7 text-lg font-bold leading-8 text-slate-900">{recovery ? question.recovery.text : question.text}</p>
          <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="flex flex-col gap-3 sm:flex-row"><input value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={session.busy} aria-label="Your answer" placeholder="Type your answer" className="min-w-0 flex-1 border border-slate-300 px-4 py-3 text-base outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" /><button disabled={session.busy || !answer.trim()} className="bg-indigo-700 px-5 py-3 text-sm font-extrabold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50">{session.busy ? "Checking..." : "Submit answer"}</button></form>
          {session.note && <p role="status" className={`mt-4 border-l-4 p-3 text-sm font-semibold ${session.note.kind === "good" ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-amber-500 bg-amber-50 text-amber-900"}`}>{session.note.text}</p>}
          {session.last?.intervention && <div className="mt-4 border border-indigo-100 bg-indigo-50 p-4"><p className="text-sm font-bold text-indigo-950">{session.last.intervention.type}</p><p className="mt-1 text-sm leading-6 text-indigo-900">{session.last.intervention.message}</p><button type="button" onClick={session.startRecovery} className="mt-3 text-sm font-extrabold text-indigo-800 underline">Try a similar question</button></div>}
          <button type="button" onClick={session.skip} className="mt-4 text-sm font-bold text-slate-500 hover:text-slate-800">Skip question</button>
        </div>
      </div>
      <aside className="border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><TargetIcon className="h-5 w-5 text-emerald-700" /><h2 className="font-black text-slate-950">Concept mastery</h2></div><MasteryBars variant="light" /></aside>
    </div>
  );
}

export function QuizPanel({ onStart }: { onStart: (category: PracticeCategory) => void }) {
  return <div><h2 className="text-2xl font-black text-slate-950">Quick knowledge checks</h2><p className="mt-1 text-sm text-slate-600">Choose a subject set to review questions with adaptive guidance.</p><div className="mt-5 grid gap-4 md:grid-cols-3">{subjects.map(({ category, description, icon: Icon, color }) => <article key={category} className="border border-slate-200 bg-white p-5 shadow-sm"><span className={`grid h-12 w-12 place-items-center border ${tones[color]}`}><Icon className="h-6 w-6" /></span><h3 className="mt-4 text-lg font-black text-slate-950">{category === "DSA" ? "Algorithms & logic" : category === "Math" ? "Math foundations" : "Science check-in"}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-slate-600">{description}</p><button type="button" onClick={() => onStart(category)} className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-indigo-700">Start quiz <ArrowRightIcon className="h-4 w-4" /></button></article>)}</div></div>;
}

function ProgressPanel() {
  const { mastery, history } = useSession();
  const entries = Object.entries(mastery);
  const average = Math.round(entries.reduce((sum, [, value]) => sum + value, 0) / (entries.length || 1) * 100);
  return <div><div className="mb-5 grid gap-4 sm:grid-cols-3"><Metric icon={TrendingUpIcon} label="Overall mastery" value={`${average}%`} detail="Average concept confidence" /><Metric icon={ActivityIcon} label="Practice activity" value={`${history.length}`} detail="Questions attempted" /><Metric icon={SparklesIcon} label="Recovered" value={`${history.filter((item) => item.recovered).length}`} detail="Concepts strengthened" /></div><div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]"><section className="border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 font-black text-slate-950">Skill mastery</h2><MasteryBars variant="light" /></section><section className="border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 font-black text-slate-950">Recent activity</h2>{history.length ? <ul className="space-y-3">{[...history].slice(-6).reverse().map((item, index) => <li key={`${item.text}-${index}`} className="border-l-2 border-emerald-500 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">{item.text}</li>)}</ul> : <p className="text-sm leading-6 text-slate-500">Your practice activity will appear here.</p>}</section></div></div>;
}

export function NotesPanel() {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => { try { const saved = localStorage.getItem(notesKey); if (saved) setNotes(JSON.parse(saved) as StudyNote[]); } catch { setNotes([]); } setReady(true); }, []);
  useEffect(() => { if (ready) localStorage.setItem(notesKey, JSON.stringify(notes)); }, [notes, ready]);
  const saveNote = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!title.trim() || !body.trim()) return; setNotes((current) => [{ id: crypto.randomUUID(), title: title.trim(), subject, body: body.trim(), createdAt: new Date().toISOString() }, ...current]); setTitle(""); setBody(""); };
  const visible = notes.filter((note) => `${note.title} ${note.subject} ${note.body}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="grid items-start gap-5 lg:grid-cols-[0.8fr_1.2fr]"><form onSubmit={saveNote} className="border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-black text-slate-950">Add a note</h2><label htmlFor="learning-note-title" className="mb-1 block text-xs font-bold text-slate-700">Title</label><input id="learning-note-title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={80} className="mb-3 w-full border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-600" placeholder="A key idea to remember" /><label htmlFor="learning-note-subject" className="mb-1 block text-xs font-bold text-slate-700">Subject</label><select id="learning-note-subject" value={subject} onChange={(event) => setSubject(event.target.value)} className="mb-3 w-full border border-slate-300 bg-white px-3 py-2.5 text-sm"><option>Mathematics</option><option>Data Structures &amp; Algorithms</option><option>Science</option><option>General</option></select><label htmlFor="learning-note-body" className="mb-1 block text-xs font-bold text-slate-700">Note</label><textarea id="learning-note-body" value={body} onChange={(event) => setBody(event.target.value)} required rows={5} className="w-full border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-indigo-600" placeholder="Write an explanation, example, or reminder..." /><button className="mt-3 w-full bg-indigo-700 px-4 py-3 text-sm font-extrabold text-white hover:bg-indigo-800">Save note</button></form><div><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-black text-slate-950">Your notes <span className="text-sm text-slate-500">{notes.length}</span></h2><input aria-label="Search notes" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notes" className="w-full max-w-xs border border-slate-300 bg-white px-3 py-2.5 text-sm" /></div>{visible.length ? <div className="space-y-3">{visible.map((note) => <article key={note.id} className="border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-wide text-emerald-700">{note.subject}</p><h3 className="mt-1 font-black text-slate-950">{note.title}</h3></div><button type="button" onClick={() => setNotes((current) => current.filter((item) => item.id !== note.id))} aria-label={`Delete ${note.title}`} className="grid h-8 w-8 place-items-center text-slate-500 hover:bg-rose-50 hover:text-rose-700"><TrashIcon className="h-4 w-4" /></button></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{note.body}</p></article>)}</div> : <EmptyState icon={NotebookIcon} title={search ? "No matching notes" : "Your notebook is ready"} detail={search ? "Try a different search." : "Add a note to keep a useful idea close."} />}</div></div>;
}

function CalendarPanel() {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("Study session");
  const [ready, setReady] = useState(false);
  useEffect(() => { try { const saved = localStorage.getItem(eventsKey); if (saved) setEvents(JSON.parse(saved) as StudyEvent[]); } catch { setEvents([]); } setReady(true); }, []);
  useEffect(() => { if (ready) localStorage.setItem(eventsKey, JSON.stringify(events)); }, [events, ready]);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const offset = new Date(year, month, 1).getDay();
  const dayCount = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((offset + dayCount) / 7) * 7 }, (_, index) => { const day = index - offset + 1; return day > 0 && day <= dayCount ? new Date(year, month, day) : null; });
  const selectedEvents = events.filter((event) => event.date === selectedDate);
  const selectedLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const saveEvent = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!title.trim()) return; setEvents((current) => [...current, { id: crypto.randomUUID(), title: title.trim(), date: selectedDate, kind }]); setTitle(""); };
  return <div className="grid items-start gap-5 lg:grid-cols-[1.5fr_0.8fr]"><section className="border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Monthly study calendar"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-black text-slate-950">{monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2><div className="flex gap-1"><button type="button" aria-label="Previous month" onClick={() => setMonthDate(new Date(year, month - 1, 1))} className="h-9 w-9 border border-slate-200 font-bold">‹</button><button type="button" onClick={() => { const now = new Date(); setMonthDate(now); setSelectedDate(dateKey(now)); }} className="border border-slate-200 px-3 text-xs font-bold">Today</button><button type="button" aria-label="Next month" onClick={() => setMonthDate(new Date(year, month + 1, 1))} className="h-9 w-9 border border-slate-200 font-bold">›</button></div></div><div className="grid grid-cols-7 border-b border-slate-200 pb-2">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day} className="text-center text-xs font-bold text-slate-500">{day}</span>)}</div><div className="grid grid-cols-7">{cells.map((date, index) => { if (!date) return <div key={`blank-${index}`} className="min-h-14 border-b border-r border-slate-100 sm:min-h-20" />; const key = dateKey(date); const count = events.filter((event) => event.date === key).length; return <button key={key} type="button" onClick={() => setSelectedDate(key)} aria-pressed={selectedDate === key} className={`min-h-14 border-b border-r border-slate-100 p-1 text-sm sm:min-h-20 sm:p-2 ${selectedDate === key ? "bg-indigo-50" : "hover:bg-slate-50"}`}><span className={`mx-auto grid h-7 w-7 place-items-center rounded-full text-xs font-bold sm:mx-0 ${key === dateKey(new Date()) ? "bg-indigo-700 text-white" : "text-slate-800"}`}>{date.getDate()}</span>{count > 0 && <span className="mt-1 block text-[10px] font-bold text-emerald-700">{count} plan{count === 1 ? "" : "s"}</span>}</button>; })}</div></section><aside className="border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">Selected day</p><h2 className="mt-1 text-lg font-black text-slate-950">{selectedLabel}</h2><form onSubmit={saveEvent} className="mt-4 space-y-2"><label htmlFor="calendar-event" className="block text-xs font-bold text-slate-700">Reminder</label><input id="calendar-event" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={80} placeholder="Plan a study session" className="w-full border border-slate-300 px-3 py-2.5 text-sm" /><select value={kind} onChange={(event) => setKind(event.target.value)} aria-label="Reminder type" className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm"><option>Study session</option><option>Quiz</option><option>Review</option></select><button className="w-full bg-indigo-700 px-3 py-2.5 text-sm font-extrabold text-white hover:bg-indigo-800">Add reminder</button></form><div className="mt-4 space-y-2">{selectedEvents.map((item) => <div key={item.id} className="flex items-center justify-between gap-2 border border-slate-200 p-3"><span><strong className="block text-xs text-emerald-700">{item.kind}</strong><span className="text-sm font-semibold text-slate-800">{item.title}</span></span><button type="button" aria-label={`Delete ${item.title}`} onClick={() => setEvents((current) => current.filter((event) => event.id !== item.id))} className="text-slate-500 hover:text-rose-700"><TrashIcon className="h-4 w-4" /></button></div>)}</div></aside></div>;
}

function EmptyState({ icon: Icon, title, detail }: { icon: typeof NotebookIcon; title: string; detail: string }) {
  return <div className="border border-dashed border-slate-300 bg-white px-5 py-10 text-center"><Icon className="mx-auto h-7 w-7 text-slate-400" /><p className="mt-2 text-sm font-bold text-slate-800">{title}</p><p className="mt-1 text-sm text-slate-500">{detail}</p></div>;
}