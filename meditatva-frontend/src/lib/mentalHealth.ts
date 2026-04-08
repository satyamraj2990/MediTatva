export type ScreeningKind = "phq9" | "gad7" | "pss4";

export interface ScreeningQuestion {
  id: string;
  text: string;
}

export const RESPONSE_OPTIONS = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
] as const;

export const PHQ_9_QUESTIONS: ScreeningQuestion[] = [
  { id: "phq9-1", text: "Little interest or pleasure in doing things" },
  { id: "phq9-2", text: "Feeling down, depressed, or hopeless" },
  { id: "phq9-3", text: "Trouble falling or staying asleep, or sleeping too much" },
  { id: "phq9-4", text: "Feeling tired or having little energy" },
  { id: "phq9-5", text: "Poor appetite or overeating" },
  { id: "phq9-6", text: "Feeling bad about yourself or that you have let yourself or your family down" },
  { id: "phq9-7", text: "Trouble concentrating on things such as reading or watching something" },
  { id: "phq9-8", text: "Moving or speaking slowly or being fidgety/restless" },
  { id: "phq9-9", text: "Thoughts that you would be better off gone or of hurting yourself" },
];

export const GAD_7_QUESTIONS: ScreeningQuestion[] = [
  { id: "gad7-1", text: "Feeling nervous, anxious, or on edge" },
  { id: "gad7-2", text: "Not being able to stop or control worrying" },
  { id: "gad7-3", text: "Worrying too much about different things" },
  { id: "gad7-4", text: "Trouble relaxing" },
  { id: "gad7-5", text: "Being so restless that it is hard to sit still" },
  { id: "gad7-6", text: "Becoming easily annoyed or irritable" },
  { id: "gad7-7", text: "Feeling afraid as if something awful might happen" },
];

export const PSS_4_QUESTIONS: ScreeningQuestion[] = [
  { id: "pss4-1", text: "How often have you felt unable to control important things in your life?" },
  { id: "pss4-2", text: "How often have you felt confident about your ability to handle personal problems?" },
  { id: "pss4-3", text: "How often have you felt that things were going your way?" },
  { id: "pss4-4", text: "How often have you felt difficulties were piling up too high to overcome?" },
];

export function getQuestionsByKind(kind: ScreeningKind): ScreeningQuestion[] {
  if (kind === "phq9") return PHQ_9_QUESTIONS;
  if (kind === "gad7") return GAD_7_QUESTIONS;
  return PSS_4_QUESTIONS;
}

export function getScreeningTitle(kind: ScreeningKind): string {
  if (kind === "phq9") return "PHQ-9 Mood Screening";
  if (kind === "gad7") return "GAD-7 Anxiety Screening";
  return "PSS-4 Stress Snapshot";
}

export function getScreeningResult(kind: ScreeningKind, score: number): { severity: string; description: string } {
  if (kind === "phq9") {
    if (score <= 4) return { severity: "Minimal", description: "Low symptom burden right now." };
    if (score <= 9) return { severity: "Mild", description: "Some symptoms are present and worth monitoring." };
    if (score <= 14) return { severity: "Moderate", description: "Your responses suggest meaningful distress." };
    if (score <= 19) return { severity: "Moderately Severe", description: "Consider structured support and professional guidance." };
    return { severity: "Severe", description: "Please seek professional support soon." };
  }

  if (kind === "gad7") {
    if (score <= 4) return { severity: "Minimal", description: "Anxiety appears low currently." };
    if (score <= 9) return { severity: "Mild", description: "Some anxiety symptoms are present." };
    if (score <= 14) return { severity: "Moderate", description: "You may benefit from support strategies." };
    return { severity: "Severe", description: "Please consider timely professional support." };
  }

  if (score <= 4) return { severity: "Low Stress", description: "Perceived stress appears manageable." };
  if (score <= 8) return { severity: "Moderate Stress", description: "Stress is noticeable. Try regular check-ins." };
  return { severity: "High Stress", description: "Stress appears elevated and may need support." };
}

export interface ToneResult {
  tone: "calm" | "stressed" | "anxious" | "low" | "distressed";
  isCrisis: boolean;
}

const CRISIS_PATTERNS = [
  "hurt myself",
  "end my life",
  "suicide",
  "kill myself",
  "self harm",
  "can't go on",
  "cant go on",
  "want to die",
];

export function detectTone(input: string): ToneResult {
  const normalized = input.toLowerCase();

  if (CRISIS_PATTERNS.some((phrase) => normalized.includes(phrase))) {
    return { tone: "distressed", isCrisis: true };
  }

  if (/(anxious|panic|overthinking|worry|nervous)/.test(normalized)) {
    return { tone: "anxious", isCrisis: false };
  }

  if (/(stress|overwhelmed|burnout|pressure|exams)/.test(normalized)) {
    return { tone: "stressed", isCrisis: false };
  }

  if (/(lonely|empty|sad|down|hopeless|tired)/.test(normalized)) {
    return { tone: "low", isCrisis: false };
  }

  return { tone: "calm", isCrisis: false };
}

export function generateJournalTags(mood: number, text: string): string[] {
  const tags = new Set<string>();
  const normalized = text.toLowerCase();

  if (mood <= 2) tags.add("anxious");
  if (mood <= 3) tags.add("overwhelmed");
  if (mood >= 4) tags.add("calm");
  if (mood >= 5) tags.add("hopeful");

  if (/(stress|stressed|deadline|exam|pressure)/.test(normalized)) tags.add("stressed");
  if (/(anxious|panic|nervous|worry)/.test(normalized)) tags.add("anxious");
  if (/(calm|peace|relaxed|steady)/.test(normalized)) tags.add("calm");
  if (/(hope|grateful|better|progress)/.test(normalized)) tags.add("hopeful");

  return Array.from(tags).slice(0, 4);
}

export function getSupportiveResponseByTone(tone: ToneResult["tone"]): string {
  if (tone === "anxious") {
    return "I hear that anxiety is heavy right now. Let us slow it down together: inhale for 4, hold for 4, exhale for 6, and repeat 5 times.";
  }
  if (tone === "stressed") {
    return "That sounds like a lot to carry. Try a 10-minute reset: list 3 urgent tasks, 1 can wait, and take one small next step.";
  }
  if (tone === "low") {
    return "Thank you for sharing this. You are not alone. A gentle next step could be writing one sentence about what feels hardest right now.";
  }
  if (tone === "distressed") {
    return "Your safety matters most. Please reach out to emergency services or a trusted person right now. I can also guide you to counselor support immediately.";
  }
  return "I am here with you. If you want, we can do a breathing exercise, a quick check-in, or a short journal prompt.";
}
