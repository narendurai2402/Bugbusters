import Link from "next/link";

const highlights = [
  { icon: "▤", title: "Smart Learning", text: "Personalized learning with AI assistance", tone: "bg-indigo-50 text-indigo-600" },
  { icon: "↗", title: "AI Assistance", text: "Get instant explanations and hints", tone: "bg-teal-50 text-teal-600" },
  { icon: "?", title: "Practice & Solve", text: "Solve problems and take quizzes", tone: "bg-amber-50 text-amber-600" },
  { icon: "◎", title: "Track Progress", text: "Monitor your growth and achievements", tone: "bg-rose-50 text-rose-600" },
];

const steps = [
  { icon: "↥", title: "Ask or Upload", text: "Type your question or upload a problem image directly", tone: "bg-purple-50 text-indigo-600" },
  { icon: "✦", title: "Get AI Help", text: "Receive clear step-by-step solutions and conceptual breakdowns", tone: "bg-indigo-50 text-indigo-600" },
  { icon: "☑", title: "Practice More", text: "Solve similar recommended problems and take targeted quizzes", tone: "bg-teal-50 text-teal-600" },
  { icon: "▥", title: "Track Progress", text: "See your learning speed and score improvement over time", tone: "bg-blue-50 text-blue-600" },
];

const impact = [
  { value: "24/7", title: "Instant AI Support", text: "Step-by-step guidance whenever you get stuck on any problem.", tone: "bg-indigo-50/70 text-indigo-600" },
  { value: "100k+", title: "Practice Questions", text: "Adaptive problem sets tailored directly to your syllabus.", tone: "bg-teal-50 text-teal-600" },
  { value: "3x Faster", title: "Concept Mastery", text: "Accelerate learning retention with targeted explanations.", tone: "bg-amber-50 text-amber-500" },
  { value: "99.8%", title: "Accuracy Rate", text: "Verified answers powered by high-precision learning models.", tone: "bg-rose-50 text-rose-500" },
];

function ArrowIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function RobotIllustration() {
  return (
    <div className="relative mx-auto flex aspect-[4/3] w-full max-w-[530px] items-center justify-center" aria-hidden="true">
      <div className="absolute inset-4 rounded-full border border-indigo-200/60" />
      <div className="absolute inset-12 rounded-full border border-dashed border-purple-200/80" />
      <div className="absolute bottom-3 h-16 w-80 rounded-full bg-gradient-to-t from-indigo-100/70 to-transparent blur-xl" />

      <div className="absolute left-4 top-24 z-20 rounded-2xl border border-white bg-white/90 px-3.5 py-3 font-mono text-lg font-bold text-indigo-700 shadow-xl shadow-purple-200/50 backdrop-blur-md">&lt;/&gt;</div>
      <div className="absolute left-28 top-3 z-20 grid h-14 w-14 place-items-center rounded-2xl border border-white bg-white/90 text-2xl shadow-xl shadow-purple-200/50 backdrop-blur-md">💡</div>
      <div className="absolute right-12 top-8 z-20 grid h-14 w-14 place-items-center rounded-2xl border border-white bg-white/90 text-2xl shadow-xl shadow-purple-200/50 backdrop-blur-md">▤</div>
      <div className="absolute right-3 top-1/2 z-20 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-2xl border border-white bg-white/90 text-2xl shadow-xl shadow-purple-200/50 backdrop-blur-md">✦</div>
      <div className="absolute bottom-8 right-16 z-20 grid h-14 w-14 place-items-center rounded-2xl border border-white bg-white/90 text-2xl shadow-xl shadow-purple-200/50 backdrop-blur-md">🎓</div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="z-10 -mb-2 flex flex-col items-center">
          <div className="h-4 w-4 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 shadow-md shadow-indigo-500/40" />
          <div className="h-3 w-1.5 rounded-full bg-slate-300" />
        </div>
        <div className="relative flex h-32 w-44 items-center justify-center rounded-[2.5rem] border-4 border-white bg-gradient-to-b from-white via-slate-50 to-slate-200 p-3 shadow-xl">
          <div className="absolute -left-3.5 h-9 w-4 rounded-full bg-indigo-600 shadow-md" />
          <div className="absolute -right-3.5 h-9 w-4 rounded-full bg-indigo-600 shadow-md" />
          <div className="relative flex h-full w-full items-center justify-center gap-5 overflow-hidden rounded-[1.8rem] bg-[#1e1b4b] shadow-inner">
            <div className="h-4 w-5 rounded-b-full border-b-4 border-cyan-300" />
            <div className="h-4 w-5 rounded-b-full border-b-4 border-cyan-300" />
            <div className="absolute bottom-3 left-6 h-1.5 w-3 rounded-full bg-pink-400/40 blur-[1px]" />
            <div className="absolute bottom-3 right-6 h-1.5 w-3 rounded-full bg-pink-400/40 blur-[1px]" />
          </div>
        </div>
        <div className="relative -mt-3 flex flex-col items-center">
          <div className="h-24 w-28 rounded-3xl border-2 border-white bg-gradient-to-b from-white to-slate-200 shadow-lg" />
          <div className="absolute -left-5 top-2 h-16 w-7 rotate-45 rounded-full border border-white bg-slate-100 shadow-sm" />
          <div className="absolute -right-5 top-2 h-16 w-7 -rotate-45 rounded-full border border-white bg-slate-100 shadow-sm" />
          <div className="absolute top-2 z-20 flex h-16 w-28 -rotate-2 items-center rounded-md bg-gradient-to-r from-[#4f3ff0] to-[#6d4efb] p-2 text-white shadow-2xl">
            <div className="w-1/2 space-y-1 border-r border-indigo-300/40 pr-1 opacity-70">
              <div className="h-1 rounded bg-white/70" /><div className="h-1 w-3/4 rounded bg-white/50" /><div className="h-1 rounded bg-white/60" />
            </div>
            <div className="w-1/2 space-y-1 pl-1 opacity-70">
              <div className="h-1 rounded bg-white/70" /><div className="h-1 rounded bg-white/50" /><div className="h-1 w-2/3 rounded bg-white/60" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-5 left-16 z-20 flex flex-col items-center">
        <div className="relative flex h-12 w-14 justify-center">
          <div className="absolute bottom-0 h-10 w-4 -rotate-[25deg] rounded-full bg-indigo-600 shadow-sm" />
          <div className="absolute bottom-0 h-11 w-4 rounded-full bg-indigo-700 shadow-sm" />
          <div className="absolute bottom-0 h-10 w-4 rotate-[25deg] rounded-full bg-indigo-500 shadow-sm" />
          <div className="absolute bottom-0 -left-1 h-8 w-3 -rotate-45 rounded-full bg-indigo-800" />
          <div className="absolute bottom-0 -right-1 h-8 w-3 rotate-45 rounded-full bg-indigo-800" />
        </div>
        <div className="h-10 w-11 rounded-b-xl border border-slate-200 bg-white shadow-md" />
      </div>
      <div className="absolute bottom-3 left-32 z-10 flex flex-col items-center">
        <div className="flex h-6 w-32 items-center rounded-md border-b-2 border-indigo-700 bg-[#4e3dee] px-3 shadow-md"><div className="h-1 w-full rounded bg-indigo-300/30" /></div>
        <div className="-mt-1 flex h-7 w-36 items-center rounded-md border-b-2 border-indigo-900 bg-[#3c2ecd] px-3 shadow-lg"><div className="h-1 w-full rounded bg-indigo-300/20" /></div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfcff] text-slate-800">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_85%_20%,rgba(216,180,254,0.45)_0%,rgba(238,242,255,0.3)_40%,transparent_70%),radial-gradient(circle_at_10%_25%,rgba(224,231,255,0.5)_0%,transparent_50%)] pb-12 pt-4">
        <div className="pointer-events-none absolute -right-20 -top-24 -z-0 h-[580px] w-[580px] rounded-full bg-purple-200/40 blur-3xl" />
        <div className="pointer-events-none absolute left-0 top-1/2 -z-0 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-6 pt-4 lg:grid-cols-12 lg:px-12">
          <div className="z-10 lg:col-span-6">
            <div className="space-y-4">
              <h1 className="flex items-center gap-3 text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                Reason <span className="text-[#4338ca]">X</span>
              </h1>
              <p className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">Your Smart AI Learning Assistant</p>
              <p className="max-w-lg pt-1 text-base leading-relaxed text-slate-500 sm:text-lg">
                Learn smarter, practice better, solve faster and grow with AI.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-5 text-sm font-semibold text-slate-800 sm:text-base">
              {["Learn", "Practice", "Solve", "Grow"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#5d3bf6]" />{item}</span>
              ))}
            </div>
            <div className="pt-8">
              <Link href="/login" className="group inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#5345f0] to-[#3e32e4] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/40 transition hover:opacity-95">
                Get Started Free <ArrowIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          <div className="relative lg:col-span-6">
            <RobotIllustration />
          </div>
        </div>
      </section>

      <section id="features" aria-label="Reason X features" className="relative z-20 mx-auto -mt-4 mb-16 max-w-7xl px-6 lg:px-12">
        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/50 lg:p-6">
          <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
            {highlights.map((item) => (
              <div key={item.title} className="flex items-center gap-4 px-3 py-4 sm:py-0">
                <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl ${item.tone}`}>{item.icon}</div>
                <div><h2 className="text-base font-bold text-slate-900">{item.title}</h2><p className="mt-0.5 text-xs leading-snug text-slate-500">{item.text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl scroll-mt-32 px-6 py-12 lg:px-12">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 lg:p-12">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-4 lg:col-span-6">
              <div>
                <span className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-indigo-600">About</span>
                <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Why Reason <span className="text-[#4338ca]">X</span>?</h2>
              </div>
              <p className="pt-1 text-base leading-relaxed text-slate-600">
                Reason X helps students learn, practice and solve problems with the power of AI. Whether it&apos;s concept clarification, doubt solving or exam practice — Reason X is your personal, round-the-clock learning partner.
              </p>
              <Link href="/login" className="group inline-flex items-center rounded-full bg-indigo-50/70 px-5 py-2.5 text-sm font-bold text-indigo-600 transition-colors hover:bg-indigo-100/70 hover:text-indigo-800">
                Learn More <ArrowIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-6">
              {impact.map((item) => (
                <div key={item.title} className={`rounded-2xl border border-slate-100 p-5 ${item.tone}`}>
                  <div className="mb-1 text-2xl font-black">{item.value}</div>
                  <h3 className="mb-1 text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs leading-snug text-slate-500">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-32 px-6 pb-24 pt-4 lg:px-12">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-indigo-600">How It Works</span>
          <h2 className="mb-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            How Reason <span className="text-[#4338ca]">X</span> Works in 4 Simple Steps
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">Master any topic seamlessly from question upload to progress analytics in just four guided steps.</p>
        </div>
        <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <article key={step.title} className="group relative flex h-full flex-col items-center rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md">
              <div className="absolute -top-3 left-6 grid h-7 w-7 place-items-center rounded-full bg-purple-200/80 text-xs font-bold text-indigo-900">{index + 1}</div>
              <div className={`mb-4 mt-1 grid h-14 w-14 place-items-center rounded-2xl text-2xl ${step.tone}`}>{step.icon}</div>
              <h3 className="mb-1 text-base font-bold text-slate-900">{step.title}</h3>
              <p className="text-xs leading-relaxed text-slate-500">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl scroll-mt-32 px-6 pb-24 pt-4 lg:px-12">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-indigo-600">Contact Us</span>
          <h2 className="mb-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Get in Touch with Reason <span className="text-[#4338ca]">X</span></h2>
          <p className="text-sm leading-relaxed text-slate-600">Have questions or need assistance? Reach out to our team anytime.</p>
        </div>
        <div className="grid items-stretch grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="flex flex-col justify-between gap-4 lg:col-span-5">
            <article className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-xl text-indigo-600">✉</div>
              <div><h3 className="mb-1 text-base font-bold text-slate-900">Email Support</h3><p className="mb-2 text-xs leading-snug text-slate-500">Round-the-clock responses for technical &amp; learning inquiries.</p><a href="mailto:support@reasonx.ai" className="text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-800">support@reasonx.ai</a></div>
            </article>
            <article className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-50 text-xl text-teal-600">☏</div>
              <div><h3 className="mb-1 text-base font-bold text-slate-900">Live Chat &amp; Community</h3><p className="mb-2 text-xs leading-snug text-slate-500">Chat directly with AI tutors or join our student community.</p><a href="mailto:support@reasonx.ai?subject=Student%20Forum" className="text-sm font-semibold text-teal-600 transition-colors hover:text-teal-700">Join Student Forum →</a></div>
            </article>
            <article className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-purple-50 text-xl text-indigo-600">⌖</div>
              <div><h3 className="mb-1 text-base font-bold text-slate-900">Headquarters &amp; Hub</h3><p className="text-xs leading-snug text-slate-500">548 Market Street, Suite 9200<br />San Francisco, CA 94104</p></div>
            </article>
          </div>
          <div className="flex flex-col justify-center rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 lg:col-span-7 lg:p-10">
            <h3 className="mb-2 text-xl font-bold text-slate-900">Send Us a Message</h3>
            <p className="mb-6 text-xs text-slate-500">Our education and support specialists are ready to help.</p>
            <form action="mailto:support@reasonx.ai" method="post" encType="text/plain" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700">Full Name<input name="name" type="text" placeholder="Alex Johnson" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#fbfcff] px-4 py-2.5 text-sm outline-none transition-colors focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" /></label>
                <label className="block text-xs font-semibold text-slate-700">Email Address<input name="email" type="email" placeholder="alex@example.com" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#fbfcff] px-4 py-2.5 text-sm outline-none transition-colors focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" /></label>
              </div>
              <label className="block text-xs font-semibold text-slate-700">Topic<select name="topic" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#fbfcff] px-4 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"><option>General Learning Inquiry</option><option>AI Model &amp; Solution Feedback</option><option>Classroom / Institution Plans</option><option>Account &amp; Billing Assistance</option></select></label>
              <label className="block text-xs font-semibold text-slate-700">Message<textarea name="message" rows={4} placeholder="How can we help your learning journey?" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#fbfcff] px-4 py-2.5 text-sm outline-none transition-colors focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" /></label>
              <button type="submit" className="inline-flex items-center justify-center rounded-full bg-[#3e35e6] px-8 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-[#342bc7] active:scale-95">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-white/60 py-8 text-center text-xs text-slate-400">
        © 2025 Reason X. All rights reserved. Your Smart AI Learning Assistant.
      </footer>
    </main>
  );
}
