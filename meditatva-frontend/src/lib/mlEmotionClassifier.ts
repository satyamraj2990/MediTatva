/**
 * ML-based Emotion Classifier Service Implementation
 * Integrates trained Python emotion classifier from backend
 * Implements the EmotionClassifierService interface
 */

import {
  classifyEmotionText,
  enrichReportWithEmotionAnalysis,
  generateMentalWellnessReport,
  EmotionClassification,
  EnrichedAnalysis
} from './emotionClassifierClient';
import type {
  EmotionClassifierService,
  ScreeningResult
} from './screeningHelpers';

/**
 * Implementation of emotion classifier using backend ML model
 */
class MLEmotionClassifier implements EmotionClassifierService {
  /**
   * Classify emotion from a single text
   */
  async classifyEmotion(text: string): Promise<{
    emotion: string;
    confidence: number;
  }> {
    try {
      const result = await classifyEmotionText(text);
      if (result && result.modelAvailable) {
        return {
          emotion: result.emotion,
          confidence: result.confidence
        };
      }
      return { emotion: 'neutral', confidence: 0 };
    } catch (error) {
      console.error('Error classifying emotion:', error);
      return { emotion: 'neutral', confidence: 0 };
    }
  }

  /**
   * Enrich concerns with ML-based emotion analysis
   * Returns enhanced concern list based on detected emotions
   */
  async enrichConcernAnalysis(
    currentConcerns: string[],
    userTexts: string[]
  ): Promise<string[]> {
    try {
      const analysis = await enrichReportWithEmotionAnalysis(userTexts);

      if (!analysis || !analysis.modelAvailable) {
        return currentConcerns;
      }

      // Merge ML-detected concerns with rule-based concerns
      // Prioritize ML concerns if confidence is high
      const mlConcerns = analysis.concerns;

      if (analysis.averageConfidence > 0.5) {
        // High confidence: merge and deduplicate
        const merged = new Set([...currentConcerns, ...mlConcerns]);
        return Array.from(merged);
      } else {
        // Low confidence: keep rule-based only
        return currentConcerns;
      }
    } catch (error) {
      console.error('Error enriching concerns with ML:', error);
      return currentConcerns;
    }
  }
}

/**
 * Initialize ML emotion classifier
 * This gets wired into emotionClassifierHook
 */
export const mlEmotionClassifier = new MLEmotionClassifier();

/**
 * Enhanced Report Generation with ML Insights
 * Enriches screening result with ML-based emotion analysis
 */
export async function enrichScreeningReportWithML(
  result: ScreeningResult,
  userTexts: string[]
): Promise<ScreeningResult> {
  try {
    // Only enrich if we have user texts to analyze
    if (!userTexts || userTexts.length === 0) {
      return result;
    }

    const analysis = await enrichReportWithEmotionAnalysis(userTexts);

    if (!analysis || !analysis.modelAvailable) {
      console.warn('ML model not available, using rule-based analysis only');
      return result;
    }

    // Normalize backend response to prevent runtime failures when optional fields are absent
    const normalizedConcerns = Array.isArray(analysis.concerns) ? analysis.concerns : [];
    const normalizedEmotionCounts = analysis.emotionCounts && typeof analysis.emotionCounts === 'object'
      ? analysis.emotionCounts
      : {};
    const normalizedPrimaryEmotion = analysis.primaryEmotion || 'neutral';
    const normalizedConfidence = typeof analysis.averageConfidence === 'number' ? analysis.averageConfidence : 0;

    console.log('🤖 ML Enrichment:', {
      primaryEmotion: normalizedPrimaryEmotion,
      detectedConcerns: normalizedConcerns,
      confidence: normalizedConfidence
    });

    // Merge concerns - if ML confidence is good, add ML concerns
    let enrichedConcerns = result.concerns;

    if (normalizedConfidence > 0.4) {
      const mlConcerns = normalizedConcerns.filter(
        (c) => !result.concerns.includes(c)
      );
      enrichedConcerns = [...result.concerns, ...mlConcerns];
    }

    // Update recommendation level if ML suggests stronger concern
    let recommendationLevel = result.recommendationLevel;
    if (
      normalizedConcerns.includes('high_concern') ||
      normalizedConcerns.length > 3
    ) {
      recommendationLevel = 'professional';
    } else if (
      normalizedConcerns.includes('anxiety') ||
      normalizedConcerns.includes('low_mood')
    ) {
      recommendationLevel = 'counselor';
    }

    // Build payload for detailed model-generated report endpoint
    const totalEmotionCount = Object.values(normalizedEmotionCounts).reduce((sum, n) => sum + n, 0);
    const topEmotions = Object.entries(normalizedEmotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion, count]) => ({
        emotion,
        score: totalEmotionCount > 0 ? count / totalEmotionCount : 0
      }));

    const concernProfile = normalizedConcerns.reduce((acc, concern) => {
      const concernKey = concern.toLowerCase().replace(/\s+/g, '_');
      acc[concernKey] = {
        intensity: 'moderate',
        score: 0.08,
        is_risk_factor: true
      };
      return acc;
    }, {} as Record<string, unknown>);

    const riskScore = Math.min(1, Math.max(0, result.totalScore / result.maxScore));
    const detailedReport = await generateMentalWellnessReport({
      screeningResponses: {},
      emotionalProfile: {
        primary_emotion: normalizedPrimaryEmotion,
        emotional_diversity: Object.keys(normalizedEmotionCounts).length,
        top_5_emotions: topEmotions
      },
      concernProfile,
      riskAssessment: {
        overall_risk_score: riskScore,
        mental_health_status: recommendationLevel
      },
      userScore: result.totalScore
    });

    return {
      ...result,
      concerns: enrichedConcerns,
      recommendationLevel,
      detailedReport: detailedReport || undefined,
      emotionalPattern:
        result.emotionalPattern +
        `\n\n🔍 AI Detected: You're experiencing ${normalizedPrimaryEmotion} (confidence: ${(normalizedConfidence * 100).toFixed(0)}%). ${normalizedConcerns.length > 0 ? `Key concerns: ${normalizedConcerns.join(', ')}.` : ''}`
    };
  } catch (error) {
    console.error('ML enrichment failed, using rule-based analysis:', error);
    return result;
  }
}

export default mlEmotionClassifier;
