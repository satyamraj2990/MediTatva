// Smart Scoring, Concern Mapping, and Report Generation Engine
// Rule-based scoring without requiring ML model training
// Optional hook for future emotion-emotion_69k dataset integration

import { SCREENING_QUESTIONS } from './screeningConfig';
import type { MentalWellnessReport } from './emotionClassifierClient';

// Import ML classifier implementation
import { mlEmotionClassifier, enrichScreeningReportWithML } from './mlEmotionClassifier';

export interface ScreeningResult {
  totalScore: number;
  maxScore: number;
  severity: 'low_concern' | 'mild_concern' | 'moderate_concern' | 'high_concern';
  concerns: string[];
  concernsDetailed: Record<string, number>; // concern -> prevalence score
  emotionalPattern: string;
  recommendationLevel: 'self_care' | 'counselor' | 'professional';
  supportSeeking: number; // 0-3 from q7
  detailedReport?: MentalWellnessReport;
}

export interface ReportRecommendation {
  title: string;
  description: string;
  actions: string[];
  ctaLabel: string;
  ctaAction: string;
}

// CONCERN MAPPING RULES
// Maps questions and scores to specific concerns
const CONCERN_MAPPING: Record<string, { questionIds: string[]; threshold: number }> = {
  low_mood: { questionIds: ['q1_mood', 'q2_interest', 'q12_hope'], threshold: 5 },
  anxiety: { questionIds: ['q3_anxiety', 'q11_tension'], threshold: 4 },
  sleep_issues: { questionIds: ['q4_sleep'], threshold: 2 },
  fatigue: { questionIds: ['q5_energy', 'q4_sleep', 'q9_appetite'], threshold: 5 },
  overwhelm: { questionIds: ['q7_overwhelm', 'q3_anxiety', 'q5_energy'], threshold: 6 },
  focus_issues: { questionIds: ['q6_focus', 'q7_overwhelm'], threshold: 4 },
  burnout: { questionIds: ['q5_energy', 'q2_interest', 'q6_focus', 'q7_overwhelm'], threshold: 8 },
  academic_stress: { questionIds: ['q6_focus', 'q3_anxiety', 'q7_overwhelm'], threshold: 6 },
  social_withdrawal: { questionIds: ['q8_social', 'q1_mood'], threshold: 4 },
  low_self_worth: { questionIds: ['q10_selfworth', 'q12_hope'], threshold: 4 },
};

// Crisis keywords detection
export const CRISIS_KEYWORDS = [
  'hurt myself',
  'kill myself',
  'suicide',
  'end it all',
  'want to die',
  'harm myself',
  'no point',
  'better off dead',
  'can\'t take it',
  'give up',
];

export function detectCrisis(text: string): boolean {
  const lowerText = text.toLowerCase();
  return CRISIS_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

// CALCULATE SCREENING RESULT
export function calculateScreeningResult(answers: Record<string, number>): ScreeningResult {
  // Calculate total score based on core screening questions.
  const coreQuestionIds = SCREENING_QUESTIONS
    .filter(question => question.isCoreScreening)
    .map(question => question.id);
  const totalScore = Object.values(answers).reduce((sum, val) => sum + (val || 0), 0);
  const maxScore = coreQuestionIds.length * 3;
  const severityRatio = maxScore > 0 ? totalScore / maxScore : 0;
  
  // Determine severity using ratio bands so it scales with question count.
  let severity: 'low_concern' | 'mild_concern' | 'moderate_concern' | 'high_concern';
  if (severityRatio <= 0.25) severity = 'low_concern';
  else if (severityRatio <= 0.5) severity = 'mild_concern';
  else if (severityRatio <= 0.75) severity = 'moderate_concern';
  else severity = 'high_concern';

  // Map concerns based on rules
  const concerns = identifyConcerns(answers);
  const concernsDetailed = calculateConcernScores(answers);

  // Determine recommendation level
  const supportSeeking = 0;
  let recommendationLevel: 'self_care' | 'counselor' | 'professional' = 'self_care';
  
  if (severity === 'high_concern' || severityRatio >= 0.75) {
    recommendationLevel = 'professional';
  } else if (severity === 'moderate_concern' || severityRatio >= 0.5 || supportSeeking >= 2) {
    recommendationLevel = 'counselor';
  }

  // Generate emotional pattern summary
  const emotionalPattern = generateEmotionalPattern(answers, concerns);

  return {
    totalScore,
    maxScore,
    severity,
    concerns,
    concernsDetailed,
    emotionalPattern,
    recommendationLevel,
    supportSeeking,
  };
}

// Identify specific concerns based on answer patterns
function identifyConcerns(answers: Record<string, number>): string[] {
  const detectedConcerns: string[] = [];

  for (const [concern, mapping] of Object.entries(CONCERN_MAPPING)) {
    const relevantScores = mapping.questionIds
      .map(id => answers[id] || 0)
      .reduce((sum, score) => sum + score, 0);

    if (relevantScores >= mapping.threshold) {
      detectedConcerns.push(concern);
    }
  }

  return [...new Set(detectedConcerns)];
}

// Calculate concern severity scores (0-1 scale)
function calculateConcernScores(answers: Record<string, number>): Record<string, number> {
  const scores: Record<string, number> = {};

  for (const [concern, mapping] of Object.entries(CONCERN_MAPPING)) {
    const relevantScores = mapping.questionIds.map(id => answers[id] || 0);
    const avgScore = relevantScores.reduce((sum, score) => sum + score, 0) / relevantScores.length;
    scores[concern] = Math.min(avgScore / 3, 1); // Normalize to 0-1
  }

  return scores;
}

// Generate emotional pattern narrative
function generateEmotionalPattern(answers: Record<string, number>, concerns: string[]): string {
  const mood = answers['q1_mood'] || 0;
  const anxiety = answers['q3_anxiety'] || 0;
  const energy = answers['q5_energy'] || 0;
  const focus = answers['q6_focus'] || 0;
  const overwhelm = answers['q7_overwhelm'] || 0;
  const hope = answers['q12_hope'] || 0;

  if ((mood >= 2 || hope >= 2) && anxiety >= 2) {
    return 'You seem to be experiencing both low mood and anxiety, which often occur together. This can feel overwhelming.';
  } else if ((mood >= 2 || hope >= 2) && energy >= 2) {
    return 'You\'re feeling down and low on energy, which might indicate depression or burnout. Rest and support can help.';
  } else if (overwhelm >= 2 && focus >= 2) {
    return 'You\'re carrying a heavy mental load that is making focus and daily functioning harder right now.';
  } else if (anxiety >= 2 && focus >= 2) {
    return 'You\'re experiencing worry that\'s affecting your ability to concentrate. This is a common stress response.';
  } else if (energy >= 2) {
    return 'You\'re feeling tired and overwhelmed. Taking care of basic needs like sleep can help.';
  } else if (anxiety >= 2) {
    return 'You\'re experiencing some anxiety. Grounding techniques and talking about your worries can help.';
  } else if (mood >= 2) {
    return 'Your mood has been low lately. This is a sign to reach out for support and practice self-care.';
  }

  return 'You\'re managing well overall. Building a routine of self-care can help maintain your wellbeing.';
}

// Generate personalized recommendations
export function generateRecommendations(result: ScreeningResult): Record<string, ReportRecommendation> {
  const recs: Record<string, ReportRecommendation> = {};

  // Self-care recommendations
  recs.selfCare = {
    title: '💪 Self-Care Suggestions',
    description: 'Small daily practices can support your wellbeing.',
    actions: [
      '🚶 Take 10-minute walks when you feel stressed',
      '😴 Aim for 7-8 hours of consistent sleep',
      '🧘 Try 2-minute breathing exercises daily',
      '📱 Limit phone use before bedtime',
      '🤝 Connect with someone you trust',
      '📝 Write three things you\'re grateful for daily',
    ],
    ctaLabel: 'Try Breathing',
    ctaAction: 'breathing',
  };

  // Breathing exercises
  recs.breathing = {
    title: '🌬️ Breathing Exercises',
    description: 'Calm your mind and body in minutes.',
    actions: [
      '4-7-8 Breathing: Inhale (4s) → Hold (7s) → Exhale (8s)',
      'Box Breathing: 4 seconds for each phase',
      'Grounding: 5-4-3-2-1 sensory technique',
    ],
    ctaLabel: 'Try Now',
    ctaAction: 'breathing',
  };

  // Counselor support
  recs.counselor = {
    title: '💬 Talk to a Counselor',
    description: 'Professional support tailored for you.',
    actions: [
      '👥 Speak with a trained counselor',
      '💡 Learn evidence-based coping skills',
      '🎯 Develop a personalized support plan',
      '📞 Flexible scheduling - online or in-person',
    ],
    ctaLabel: 'Book Counselor',
    ctaAction: 'counselor',
  };

  // Professional help
  recs.professional = {
    title: '👨‍⚕️ Professional Mental Health Care',
    description: 'Consider speaking with a mental health professional.',
    actions: [
      'Connect with a psychiatrist or psychologist',
      'Get professional assessment and diagnosis if needed',
      'Explore therapy or other evidence-based treatments',
      'Develop a comprehensive wellness plan',
    ],
    ctaLabel: 'Find Professional Help',
    ctaAction: 'counselor',
  };

  return recs;
}

// Severity color mapping for UI
export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    low_concern: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    mild_concern: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    moderate_concern: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    high_concern: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[severity] || colors.mild_concern;
}

// Severity label mapping
export function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    low_concern: 'Low Concern',
    mild_concern: 'Mild Concern',
    moderate_concern: 'Moderate Concern',
    high_concern: 'High Concern',
  };
  return labels[severity] || 'Unknown';
}

// Optional hook for future emotion-emotion_69k dataset integration
// This allows adding ML-based emotion classification later without breaking the app
export interface EmotionClassifierService {
  classifyEmotion(text: string): Promise<{
    emotion: string;
    confidence: number;
  }>;
  enrichConcernAnalysis(
    concerns: string[],
    userTexts: string[]
  ): Promise<string[]>;
}

// Placeholder for dataset integration
export const emotionClassifierHook: EmotionClassifierService | null = mlEmotionClassifier;

export async function enrichReportWithDataset(
  result: ScreeningResult,
  userTexts: string[]
): Promise<ScreeningResult> {
  // Use ML enrichment if available
  return enrichScreeningReportWithML(result, userTexts);
}
