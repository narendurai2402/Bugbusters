import { QUESTIONS } from "./mock";
import type { SubmitAnswerResponse } from "./types";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
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

  // Mock behavior is available only when explicitly enabled for local development.
  await wait(600);
  const name = cleanEmail.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
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
  attempt: number,
  studentId: string
): Promise<SubmitAnswerResponse> {
  if (!USE_MOCK) return post("/api/answer", { questionId, answer, attempt, studentId });

  await wait(800);
  const q = QUESTIONS.find((x) => x.id === questionId);
  if (!q) throw new Error(`Unknown question id: ${questionId}`);

  const a = norm(answer);
  if (q.answers.some((x) => norm(x) === a)) return { correct: true };
  const m = Object.entries(q.wrong).find(([k]) => norm(k) === a)?.[1];
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
  answer: string,
  studentId: string
): Promise<{ recovered: boolean; mastery?: Record<string, number> }> {
  if (!USE_MOCK) return post("/api/recovery", { questionId, answer, studentId });

  await wait(700);
  const q = QUESTIONS.find((x) => x.id === questionId);
  if (!q) throw new Error(`Unknown question id: ${questionId}`);
  return { recovered: q.recovery.answers.some((x) => norm(x) === norm(answer)) };
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

/** Generic GET helper — returns null on any failure so analytics never break the UI. */
async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function getRequired<T>(path: string, errorPrefix: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`);
  } catch {
    throw new Error(`Network error: could not reach ${errorPrefix}.`);
  }
  if (!res.ok) {
    let detail = `${errorPrefix} unavailable (HTTP ${res.status})`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      // Keep the HTTP status message when the response is not JSON.
    }
    throw new Error(detail);
  }
  try {
    return await res.json() as T;
  } catch {
    throw new Error(`${errorPrefix} response was malformed.`);
  }
}

// ── Analytics (backend mode only; mock mode returns null) ───────────────────
export interface ClassAnalytics {
  students: number;
  totalAttempts: number;
  subjectAverages: Record<string, number>;
  conceptAverages: { concept: string; subject: string; mastery: number }[];
  atRisk: { name: string; average: number; weakestConcept: string; weakestMastery: number }[];
  topMisconceptions: [string, number][];
  hardestQuestions: { id: string; subject: string; concept: string; text: string; attempts: number; firstTryAccuracy: number }[];
  activity: { date: string; attempts: number }[];
  includesDemoData: boolean;
}

export interface StudentAnalytics {
  student: string;
  totalAttempts: number;
  firstTryAccuracy: number | null;
  currentStreak: number;
  bestStreak: number;
  recoveriesCompleted: number;
  bySubject: Record<string, { attempted: number; correct: number; accuracy: number | null }>;
  subjectMastery: Record<string, number>;
  weakestConcepts: { concept: string; mastery: number }[];
  misconceptions: [string, number][];
  masteryTrend: { ts: string; overall: number }[];
}

export interface NextQuestion {
  question: { id: string; subject: string; concept: string; text: string; difficulty: 1 | 2 | 3 };
  reason: string;
}

export const getClassAnalytics = async () => (USE_MOCK ? null : get<ClassAnalytics>("/api/analytics/class"));

export const getStudentAnalytics = async (studentId: string) =>
  USE_MOCK ? null : get<StudentAnalytics>(`/api/analytics/student/${encodeURIComponent(studentId)}`);

export const getNextQuestion = async (studentId: string, subject?: string) =>
  USE_MOCK
    ? null
    : get<NextQuestion>(`/api/questions/next?studentId=${encodeURIComponent(studentId)}${subject ? `&subject=${encodeURIComponent(subject)}` : ""}`);

export type AssignTarget = "all" | "selected" | "at_risk";

export interface NewAssignment {
  title: string;
  subject: string;
  questionIds: string[];
  mode: AssignTarget;
  students: string[];
  due?: string;
  note?: string;
}

export interface Assignment extends Omit<NewAssignment, "due" | "note"> {
  id: number;
  due: string | null;
  note: string;
  created: string;
}

let mockAssignments: Assignment[] = [];

export async function createAssignment(assignment: NewAssignment): Promise<Assignment> {
  if (!USE_MOCK) return post<Assignment>("/api/assignments", assignment);

  await wait(400);
  const created: Assignment = {
    ...assignment,
    id: mockAssignments.length ? Math.max(...mockAssignments.map(({ id }) => id)) + 1 : 1,
    due: assignment.due || null,
    note: assignment.note ?? "",
    created: new Date().toISOString(),
  };
  mockAssignments = [created, ...mockAssignments];
  return created;
}

export async function listAssignments(): Promise<Assignment[]> {
  if (USE_MOCK) return [...mockAssignments];
  return (await getRequired<{ assignments: Assignment[] }>("/api/assignments", "Assignments")).assignments;
}

export async function getStudentAssignments(
  studentId: string,
  isAtRisk = false,
): Promise<Assignment[]> {
  if (USE_MOCK) {
    return mockAssignments.filter((assignment) =>
      assignment.mode === "all" ||
      (assignment.mode === "selected" && assignment.students.includes(studentId)) ||
      (assignment.mode === "at_risk" && isAtRisk)
    );
  }

  return (await getRequired<{ assignments: Assignment[] }>(
    `/api/assignments/student/${encodeURIComponent(studentId)}`,
    "Student assignments",
  )).assignments;
}
