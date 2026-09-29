"use client";
import { create } from "zustand";
import { getQuestionsByCategory, CONCEPTS } from "@/lib/mock";
import { submitAnswer, checkRecovery } from "@/lib/api";
import type { PracticeCategory, SubmitAnswerResponse } from "@/lib/types";

export interface UserProfile {
  name: string;
  email: string;
  role: "student" | "teacher";
}

type Note = { kind: "good" | "rec"; text: string } | null;

interface State {
  user: UserProfile | null;
  category: PracticeCategory;
  qi: number;
  attempt: number;
  phase: "answer" | "recovery";
  busy: boolean;
  last: SubmitAnswerResponse | null;
  note: Note;
  mastery: Record<string, number>;
  misconceptions: Record<string, string[]>;
  history: { text: string; recovered?: boolean }[];
  login: (name: string, email: string, role: "student" | "teacher") => void;
  logout: () => void;
  setCategory: (category: PracticeCategory) => void;
  submit: (answer: string) => Promise<void>;
  startRecovery: () => void;
  skip: () => void;
}

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const questionBank = (category: PracticeCategory) => getQuestionsByCategory(category);
const nextQ = (qi: number, total: number) => (qi + 1) % total;

export const useSession = create<State>((set, get) => ({
  user: null,
  category: "Math",
  qi: 0,
  attempt: 0,
  phase: "answer",
  busy: false,
  last: null,
  note: null,
  mastery: Object.fromEntries(CONCEPTS.map((c, i) => [c, [0.35, 0.4, 0.5][i % 3]])),
  misconceptions: {},
  history: [],

  login: (name, email, role) =>
    set({
      user: { name, email, role },
    }),

  logout: () => set({ user: null }),

  setCategory: (category) =>
    set({
      category,
      qi: 0,
      attempt: 0,
      phase: "answer",
      busy: false,
      last: null,
      note: null,
    }),

  submit: async (answer) => {
    const s = get();
    const qBank = questionBank(s.category);
    const q = qBank[s.qi] ?? qBank[0];
    const c = q.concept;
    set({ busy: true, note: null });
    try {
      if (s.phase === "recovery") {
        const { recovered, mastery: bm } = await checkRecovery(q.id, answer);
        set((st) => {
          const bank = questionBank(st.category);
          const total = bank.length || 1;
          return {
            busy: false,
            phase: "answer",
            last: null,
            attempt: 0,
            qi: nextQ(st.qi, total),
            mastery: bm ?? { ...st.mastery, [c]: clamp(st.mastery[c] + (recovered ? 0.22 : 0.03)) },
            misconceptions: recovered ? { ...st.misconceptions, [c]: [] } : st.misconceptions,
            note: recovered
              ? { kind: "good", text: "Recovered. The misconception did not come back, so mastery went up." }
              : { kind: "rec", text: "Not quite yet. This concept is flagged for your teacher." },
            history: [
              ...st.history,
              { recovered, text: recovered ? `Recovered on "${c}"` : `Recovery check missed on "${c}"` },
            ],
          };
        });
        return;
      }
      const attempt = s.attempt + 1;
      const r = await submitAnswer(q.id, answer, attempt);
      if (r.correct) {
        set((st) => {
          const bank = questionBank(st.category);
          const total = bank.length || 1;
          return attempt === 1
            ? {
                busy: false,
                attempt: 0,
                last: null,
                qi: nextQ(st.qi, total),
                mastery: r.mastery ?? { ...st.mastery, [c]: clamp(st.mastery[c] + 0.12) },
                note: { kind: "good", text: "Correct on the first try. Next question." },
                history: [...st.history, { text: `Correct on "${c}"` }],
              }
            : {
                busy: false,
                attempt,
                last: null,
                phase: "recovery",
                note: { kind: "good", text: "Correct. Let's confirm it with a fresh question." },
              };
        });
      } else {
        const m = r.misconception!.label;
        set((st) => ({
          busy: false,
          attempt,
          last: r,
          mastery: r.mastery ?? { ...st.mastery, [c]: clamp(st.mastery[c] - 0.04) },
          misconceptions: { ...st.misconceptions, [c]: Array.from(new Set([...(st.misconceptions[c] ?? []), m])) },
          history: [...st.history, { text: `Miss on "${c}": ${m}` }],
        }));
      }
    } catch {
      set({ busy: false, note: { kind: "rec", text: "Could not reach the server. Check that the API is running, then try again." } });
    }
  },
  startRecovery: () => set({ phase: "recovery", last: null, note: { kind: "rec", text: "Same idea, new numbers. Try it without help." } }),
  skip: () => set((st) => {
    const bank = questionBank(st.category);
    const total = bank.length || 1;
    return { qi: nextQ(st.qi, total), attempt: 0, phase: "answer", last: null, note: null };
  }),
}));
