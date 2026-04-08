const express = require('express');
const { classifyEmotion, enrichConcernAnalysis, generateMentalWellnessReport } = require('../services/emotionClassifierService');

const router = express.Router();

/**
 * POST /api/emotion/classify
 * Classify emotion from user text
 * Body: {text: string}
 * Returns: {emotion, confidence, concerns, concernScore, modelAvailable}
 */
router.post('/classify', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length < 3) {
      return res.status(400).json({
        error: 'Text must be at least 3 characters',
        modelAvailable: false
      });
    }

    const result = await classifyEmotion(text);

    if (!result) {
      return res.status(503).json({
        error: 'Emotion classifier model not available',
        modelAvailable: false
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error in classify route:', error);
    res.status(500).json({
      error: 'Internal server error',
      modelAvailable: false
    });
  }
});

/**
 * POST /api/emotion/enrich
 * Analyze multiple texts and aggregate emotions/concerns
 * Body: {texts: string[]}
 * Returns: {primaryEmotion, concerns, emotionCounts, averageConfidence, textCount, modelAvailable}
 */
router.post('/enrich', async (req, res) => {
  try {
    const { texts } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        error: 'texts must be a non-empty array',
        modelAvailable: false
      });
    }

    const result = await enrichConcernAnalysis(texts);

    if (!result) {
      return res.status(503).json({
        error: 'Emotion classifier model not available or insufficient data',
        modelAvailable: false
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error in enrich route:', error);
    res.status(500).json({
      error: 'Internal server error',
      modelAvailable: false
    });
  }
});

/**
 * POST /api/emotion/wellness-report
 * Generate detailed mental wellness report from screening data
 * Body: {
 *   screeningResponses: {q1: score, q2: score, ...},
 *   emotionalProfile: {primary_emotion, top_5_emotions, ...},
 *   concernProfile: {concern1: {intensity, ...}, ...},
 *   riskAssessment: {overall_risk_score, ...},
 *   userScore: number
 * }
 * Returns: Comprehensive multi-dimensional mental wellness report
 */
router.post('/wellness-report', async (req, res) => {
  try {
    const { screeningResponses, emotionalProfile, concernProfile, riskAssessment, userScore } = req.body;

    if (!emotionalProfile || !concernProfile || riskAssessment === undefined || userScore === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: emotionalProfile, concernProfile, riskAssessment, userScore',
        modelAvailable: false
      });
    }

    const report = await generateMentalWellnessReport(
      screeningResponses || {},
      emotionalProfile,
      concernProfile,
      riskAssessment,
      userScore
    );

    if (!report) {
      return res.status(503).json({
        error: 'Report generation failed - model not available',
        modelAvailable: false
      });
    }

    res.json(report);
  } catch (error) {
    console.error('Error in wellness-report route:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      modelAvailable: false
    });
  }
});

/**
 * GET /api/emotion/health
 * Check if emotion classifier is available
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Emotion classifier service is available'
  });
});

module.exports = router;
