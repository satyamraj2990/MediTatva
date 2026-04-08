/**
 * Frontend API client for emotion classifier backend service
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface EmotionClassification {
  emotion: string;
  confidence: number;
  concerns: string[];
  concernScore: number;
  modelAvailable: boolean;
}

export interface EnrichedAnalysis {
  primaryEmotion: string;
  concerns: string[];
  emotionCounts: Record<string, number>;
  averageConfidence: number;
  textCount: number;
  modelAvailable: boolean;
}

export interface MentalWellnessReport {
  report_id?: string;
  timestamp?: string;
  overall_mental_state?: {
    narrative?: string;
    emotional_quality?: string;
    primary_emotional_tone?: string;
    pattern_summary?: string;
  };
  emotional_breakdown?: {
    detected_emotions?: Array<{
      emotion: string;
      intensity: string;
      score: number;
      description?: string;
    }>;
    concern_interconnections?: Array<{
      concern: string;
      intensity: string;
      score: number;
      flag?: boolean;
    }>;
  };
  behavioral_patterns?: {
    identified_patterns?: Array<{
      name: string;
      description: string;
      behavioral_sign?: string;
    }>;
    behavioral_indicators?: string[];
    cognitive_style?: string;
  };
  key_concerns?: {
    primary_concerns?: Array<{ concern: string; indicator?: string; intensity?: string }>;
    emerging_concerns?: Array<{ concern: string; indicator?: string; intensity?: string }>;
    protective_elements?: Array<{ strength: string; intensity?: string }>;
  };
  psychological_insight?: {
    primary_insight?: string;
    dynamic_explanation?: string;
    system_perspective?: string;
  };
  severity_risk?: {
    severity_level?: string;
    risk_classification?: string;
    severity_score?: number;
    reasoning?: string;
    warning_signs?: string[];
    buffer_factors?: string[];
  };
  recommendations?: {
    immediate_strategies?: string[];
    daily_practices?: string[];
    relational_supports?: string[];
  };
  micro_actions?: Array<{
    action: string;
    why_it_helps?: string;
    timeframe?: string;
  }>;
  support_recommendation?: {
    support_level?: string;
    message?: string;
    next_steps?: string[];
    red_flags_requiring_immediate_help?: string[];
    urgent_message?: string;
  };
  closing_note?: string;
}

/**
 * Classify a single emotion from text
 */
export const classifyEmotionText = async (
  text: string
): Promise<EmotionClassification | null> => {
  try {
    if (!text || text.trim().length < 3) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/emotion/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: text.trim() })
    });

    if (!response.ok) {
      console.warn(
        `Emotion classification failed (${response.status}):`,
        response.statusText
      );
      return null;
    }

    const data = await response.json();
    return data as EmotionClassification;
  } catch (error) {
    console.error('Error classifying emotion:', error);
    return null;
  }
};

/**
 * Enrich screening result with emotion analysis from multiple texts
 */
export const enrichReportWithEmotionAnalysis = async (
  userTexts: string[]
): Promise<EnrichedAnalysis | null> => {
  try {
    if (!Array.isArray(userTexts) || userTexts.length === 0) {
      return null;
    }

    const validTexts = userTexts.filter(
      (t) => typeof t === 'string' && t.trim().length > 5
    );

    if (validTexts.length === 0) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/emotion/enrich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ texts: validTexts })
    });

    if (!response.ok) {
      console.warn(
        `Emotion enrichment failed (${response.status}):`,
        response.statusText
      );
      return null;
    }

    const data = await response.json();
    return data as EnrichedAnalysis;
  } catch (error) {
    console.error('Error enriching emotion analysis:', error);
    return null;
  }
};

/**
 * Generate the detailed, model-driven mental wellness report
 */
export const generateMentalWellnessReport = async (payload: {
  screeningResponses: Record<string, number>;
  emotionalProfile: Record<string, unknown>;
  concernProfile: Record<string, unknown>;
  riskAssessment: Record<string, unknown>;
  userScore: number;
}): Promise<MentalWellnessReport | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/emotion/wellness-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn(
        `Mental wellness report failed (${response.status}):`,
        response.statusText
      );
      return null;
    }

    const data = await response.json();
    return data as MentalWellnessReport;
  } catch (error) {
    console.error('Error generating mental wellness report:', error);
    return null;
  }
};

/**
 * Check if emotion classifier backend is available
 */
export const checkEmotionClassifierHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/emotion/health`);
    return response.ok;
  } catch (error) {
    console.warn('Emotion classifier health check failed:', error);
    return false;
  }
};
