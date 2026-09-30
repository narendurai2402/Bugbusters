export type InterventionType = "probe" | "hint" | "explanation";

export interface SubmitAnswerResponse {
  correct: boolean;
  misconception?: { label: string; confidence: number };
  intervention?: { type: InterventionType; level: 1 | 2 | 3; message: string };
  mastery?: Record<string, number>; // present when the backend is live
}

export type PracticeCategory = "Math" | "DSA" | "Science" | "Python" | "Java";

export interface QuestionDef {
  id: string;
  category: PracticeCategory;
  concept: string;
  text: string;
  answers: string[];
  wrong: Record<string, [string, number]>; // wrong answer -> [misconception, confidence]
  recovery: { text: string; answers: string[]; wrong: string };
  ladder: [string, string, string];
  difficulty?: 1 | 2 | 3; // 1 = easy, 3 = hard
}
