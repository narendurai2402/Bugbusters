import { QUESTIONS } from "./mock";
import type { SubmitAnswerResponse } from "./types";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const norm = (s: string) => s.replace(/\s/g, "").toLowerCase();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const DISALLOWED_DOMAINS = new Set([
  "test.com", "example.com", "fake.com", "foo.com", "bar.com",
  "asdf.com", "abc.com", "temp.com", "mailinator.com", "guerrillamail.com",
  "throwam.com", "yopmail.com", "trashmail.com",
]);

export function isValidEmailFormat(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const clean = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(clean)) return false;
  const parts = clean.split("@");
  if (parts.length !== 2 || !parts[1]) return false;
  if (DISALLOWED_DOMAINS.has(parts[1])) return false;
  return true;
}

/** Generic POST helper — throws Error with the backend's detail message on failure. */
async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new Error("Network error: could not reach the server. Make sure the backend is running.");
  }
  if (!res.ok) {
    let detail = `Server error (HTTP ${res.status})`;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      // Response body was not JSON — keep default message
    }
    throw new Error(detail);
  }
  try {
    return await res.json();
  } catch {
    throw new Error("Server returned an invalid response. Please try again.");
  }
}

export interface LoginResponse {
  success: boolean;
  user: { name: string; email: string; role: "student" | "teacher" };
}

export async function loginUser(
  email: string,
  password: string,
  role: "student" | "teacher"
): Promise<LoginResponse> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    throw new Error("Email address is required.");
  }
  if (!isValidEmailFormat(cleanEmail)) {
    throw new Error("Invalid email format. Fake or malformed email addresses are not allowed.");
  }
  if (!password || password.trim().length < 4) {
    throw new Error("Password must be at least 4 characters long.");
  }

  if (!USE_MOCK) {
    return post<LoginResponse>("/api/login", { email: cleanEmail, password, role });
  }

  // Mock fallback
  await wait(600);
  const name = role === "student"
    ? (cleanEmail.startsWith("aarav") ? "Aarav" : "Demo Student")
    : "Prof. Sharma";
  return { success: true, user: { name, email: cleanEmail, role } };
}

export async function signUpUser(
  name: string,
  email: string,
  password: string,
  role: "student" | "teacher"
): Promise<LoginResponse> {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName) {
    throw new Error("Your full name is required to create an account.");
  }
  if (!cleanEmail) {
    throw new Error("Email address is required.");
  }
  if (!isValidEmailFormat(cleanEmail)) {
    throw new Error("Invalid email format. Fake or malformed email addresses are not allowed.");
  }
  if (!password || password.trim().length < 4) {
    throw new Error("Password must be at least 4 characters long.");
  }

  if (!USE_MOCK) {
    return post<LoginResponse>("/api/login", { email: cleanEmail, password, role, name: cleanName });
  }

  await wait(600);
  return { success: true, user: { name: cleanName, email: cleanEmail, role } };
}

export async function submitAnswer(
  questionId: string,
  answer: string,
  attempt: number
): Promise<SubmitAnswerResponse> {
  if (!USE_MOCK) return post("/api/answer", { questionId, answer, attempt });

  await wait(800);
  const q = QUESTIONS.find((x) => x.id === questionId);
  if (!q) throw new Error(`Unknown question id: ${questionId}`);

  const a = norm(answer);
  if (q.answers.includes(a)) return { correct: true };
  const m = q.wrong[a];
  const level = Math.min(Math.max(attempt, 1), 3) as 1 | 2 | 3;
  return {
    correct: false,
    misconception: { label: m ? m[0] : "Unclassified error", confidence: m ? m[1] : 0.4 },
    intervention: {
      level,
      type: (["probe", "hint", "explanation"] as const)[level - 1],
      message: q.ladder[level - 1] ?? "Review your working.",
    },
  };
}

export async function checkRecovery(
  questionId: string,
  answer: string
): Promise<{ recovered: boolean; mastery?: Record<string, number> }> {
  if (!USE_MOCK) return post("/api/recovery", { questionId, answer });

  await wait(700);
  const q = QUESTIONS.find((x) => x.id === questionId);
  if (!q) throw new Error(`Unknown question id: ${questionId}`);
  return { recovered: q.recovery.answers.includes(norm(answer)) };
}

export interface TeacherData {
  students: { name: string; mastery: number[] }[];
  misconceptions: [string, number][];
}

export async function getTeacherData(): Promise<TeacherData | null> {
  if (USE_MOCK) return null;

  let res: Response;
  try {
    res = await fetch(`${BASE}/api/teacher`);
  } catch {
    throw new Error("Network error: could not reach the teacher data endpoint.");
  }
  if (!res.ok) {
    throw new Error(`Teacher data unavailable (HTTP ${res.status})`);
  }
  try {
    return await res.json();
  } catch {
    throw new Error("Teacher data response was malformed.");
  }
}
