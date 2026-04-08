// 12-Question Conversational Mental Health Screening Configuration
// Inspired by PHQ-9 and GAD-7 signals for a richer wellbeing snapshot

export interface ScreeningQuestion {
  id: string;
  category: 'context' | 'core' | 'support';
  order: number;
  text: string;
  subtext?: string;
  concernTags: string[];
  isCoreScreening: boolean;
}

export interface ScreeningAnswer {
  questionId: string;
  score: 0 | 1 | 2 | 3;
  emoji: string;
  label: string;
}

// 12-QUESTION CORE SCREENING FLOW
// Max 12 core questions, each scored on a 0-3 emoji scale
export const SCREENING_QUESTIONS: ScreeningQuestion[] = [
  {
    id: 'q1_mood',
    category: 'core',
    order: 1,
    text: 'How have you been feeling emotionally lately?',
    subtext: 'Your overall mood and emotional state',
    concernTags: ['low_mood', 'depression'],
    isCoreScreening: true,
  },
  {
    id: 'q2_interest',
    category: 'core',
    order: 2,
    text: 'Have you lost interest in activities you usually enjoy?',
    subtext: 'Hobbies, studies, socializing, or things you love',
    concernTags: ['loss_of_interest', 'depression', 'burnout'],
    isCoreScreening: true,
  },
  {
    id: 'q3_anxiety',
    category: 'core',
    order: 3,
    text: 'How often do you feel nervous, worried, or anxious?',
    subtext: 'General feelings of worry or nervousness',
    concernTags: ['anxiety', 'worry', 'stress'],
    isCoreScreening: true,
  },
  {
    id: 'q4_sleep',
    category: 'core',
    order: 4,
    text: 'How is your sleep quality these days?',
    subtext: 'Falling asleep, staying asleep, or oversleeping',
    concernTags: ['sleep_issues', 'fatigue'],
    isCoreScreening: true,
  },
  {
    id: 'q5_energy',
    category: 'core',
    order: 5,
    text: 'How\'s your energy level and motivation?',
    subtext: 'Feeling tired, energized, or overwhelmed',
    concernTags: ['fatigue', 'overwhelm', 'burnout'],
    isCoreScreening: true,
  },
  {
    id: 'q6_focus',
    category: 'core',
    order: 6,
    text: 'Is it hard to concentrate on tasks or studies?',
    subtext: 'Focusing, completing work, or decision-making',
    concernTags: ['focus_issues', 'academic_stress'],
    isCoreScreening: true,
  },
  {
    id: 'q7_overwhelm',
    category: 'core',
    order: 7,
    text: 'Do daily responsibilities feel too heavy to handle right now?',
    subtext: 'Workload, expectations, and mental load',
    concernTags: ['overwhelm', 'stress', 'burnout'],
    isCoreScreening: true,
  },
  {
    id: 'q8_social',
    category: 'core',
    order: 8,
    text: 'Have you been avoiding people or withdrawing socially?',
    subtext: 'Friends, family, classmates, or colleagues',
    concernTags: ['social_withdrawal', 'low_mood', 'anxiety'],
    isCoreScreening: true,
  },
  {
    id: 'q9_appetite',
    category: 'core',
    order: 9,
    text: 'Have you noticed changes in your appetite or eating routine?',
    subtext: 'Eating much less or more than usual',
    concernTags: ['appetite_change', 'stress', 'depression'],
    isCoreScreening: true,
  },
  {
    id: 'q10_selfworth',
    category: 'core',
    order: 10,
    text: 'How often have you been hard on yourself or feeling like a failure?',
    subtext: 'Self-criticism, guilt, or low self-worth',
    concernTags: ['low_self_worth', 'depression', 'anxiety'],
    isCoreScreening: true,
  },
  {
    id: 'q11_tension',
    category: 'core',
    order: 11,
    text: 'Do you feel physical tension, restlessness, or uneasiness in your body?',
    subtext: 'Racing heart, body tension, or inability to relax',
    concernTags: ['anxiety', 'somatic_stress'],
    isCoreScreening: true,
  },
  {
    id: 'q12_hope',
    category: 'core',
    order: 12,
    text: 'How hopeful do you feel about the next few weeks?',
    subtext: 'Sense of optimism and emotional resilience',
    concernTags: ['hopelessness', 'low_mood', 'depression'],
    isCoreScreening: true,
  },
];

// Emoji Scale Answer Options
export const EMOJI_SCALE_OPTIONS: ScreeningAnswer[] = [
  {
    questionId: 'scale',
    score: 0,
    emoji: '😀',
    label: 'Not at all',
  },
  {
    questionId: 'scale',
    score: 1,
    emoji: '🙂',
    label: 'Several days',
  },
  {
    questionId: 'scale',
    score: 2,
    emoji: '😐',
    label: 'More than half',
  },
  {
    questionId: 'scale',
    score: 3,
    emoji: '😞',
    label: 'Nearly every day',
  },
];

// Welcome flow
export const WELCOME_MESSAGES = {
  greeting:
    "Hi there 👋 I'm here to help you check in on how you've been feeling lately.",
  disclaimer:
    '⚠️ This is a supportive mental health screening tool, not a medical diagnosis. Please consult a healthcare professional for diagnosis or prescription.',
  consent:
    'Would you like to continue with a quick mental health check-in?',
  reason:
    'What brings you here today?',
};

export const REASON_OPTIONS = [
  { label: 'Stress', emoji: '😰' },
  { label: 'Anxiety', emoji: '😟' },
  { label: 'Low mood', emoji: '😢' },
  { label: 'Sleep issues', emoji: '😴' },
  { label: 'Academic pressure', emoji: '📚' },
  { label: 'Just checking in', emoji: '🤔' },
];
