const { spawn } = require('child_process');
const path = require('path');

/**
 * Node.js wrapper for Python emotion classifier
 * Enhanced version with detailed real-time analysis
 * All data is dynamically derived from model - no hardcoding
 */

let modelAvailable = true;

// Test if Python and model are available on startup
const testModelAvailability = async () => {
  try {
    const result = await runPythonClassifier('test');
    return result !== null && !result.error;
  } catch (e) {
    console.warn('⚠️  Emotion classifier model not available, using fallback');
    return false;
  }
};

const runPythonClassifier = (text) => {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, '../ml/classify_emotion.py');
    const pythonProcess = spawn('python', [
      pythonScriptPath,
      text
    ]);

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0 && output) {
        try {
          resolve(JSON.parse(output));
        } catch (e) {
          reject(new Error('Invalid JSON from classifier'));
        }
      } else {
        reject(new Error(error || `Process exited with code ${code}`));
      }
    });

    pythonProcess.on('error', (err) => {
      reject(err);
    });

    // Timeout after 8 seconds
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Classifier timeout'));
    }, 8000);
  });
};

const toLegacyClassification = (rawResult) => {
  if (!rawResult || rawResult.error) {
    return null;
  }

  const primaryEmotion = rawResult?.emotionalProfile?.primary_emotion || 'neutral';
  const confidence = Number(rawResult?.emotionalProfile?.primary_confidence || 0);

  const concernCandidates = Object.entries(rawResult?.concernProfile || {})
    .filter(([, data]) => data && data.is_risk_factor === true)
    .sort((a, b) => (b[1]?.intensity || 0) - (a[1]?.intensity || 0));

  const concerns = concernCandidates.slice(0, 6).map(([concern]) => concern);
  const concernScore = Number((((rawResult?.riskAssessment?.overall_risk_score || 0) * 100)).toFixed(1));

  return {
    emotion: primaryEmotion,
    confidence,
    concerns,
    concernScore,
    modelAvailable: true,
    rawAnalysis: rawResult
  };
};

/**
 * Classify emotion with detailed analysis
 * Returns comprehensive emotional & mental health insights
 */
const classifyEmotion = async (text) => {
  if (!modelAvailable) {
    return null;
  }

  try {
    const result = await runPythonClassifier(text);
    return toLegacyClassification(result);
  } catch (e) {
    console.error('❌ Error classifying emotion:', e.message);
    return null;
  }
};

/**
 * Enrich concern analysis from multiple texts
 * Aggregates emotion analysis across screening responses
 */
const enrichConcernAnalysis = async (userTexts) => {
  if (!modelAvailable || !Array.isArray(userTexts) || userTexts.length === 0) {
    return null;
  }

  try {
    const results = [];
    const emotionCounts = {};
    let confidenceSum = 0;
    const concernFrequency = {};
    
    // Classify each text
    for (const text of userTexts) {
      if (text && typeof text === 'string' && text.trim().length > 5) {
        const rawResult = await runPythonClassifier(text);
        const normalized = toLegacyClassification(rawResult);
        if (normalized && normalized.modelAvailable) {
          results.push(normalized);

          const emotion = normalized.emotion || 'neutral';
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
          confidenceSum += Number(normalized.confidence || 0);

          normalized.concerns.forEach((concern) => {
            concernFrequency[concern] = (concernFrequency[concern] || 0) + 1;
          });
        }
      }
    }

    if (results.length === 0) {
      return null;
    }

    // Aggregate insights
    const aggregated = {
      totalTextsAnalyzed: results.length,
      emotionalProfiles: results.map(r => r.rawAnalysis?.emotionalProfile || {}),
      allDetectedConcerns: {},
      aggregatedRiskAssessment: {
        overallRiskScore: 0,
        mentalHealthStatus: 'LOW_RISK',
        identifiedRisks: [],
        protectiveFactors: [],
        severityIndicators: []
      },
      modelAvailable: true
    };

    // Merge concerns and risk data
    let cumulativeRisk = 0;
    let riskCount = 0;

    results.forEach((result, idx) => {
      // Collect all concerns
      Object.entries(result.rawAnalysis?.concernProfile || {}).forEach(([concern, data]) => {
        if (!aggregated.allDetectedConcerns[concern]) {
          aggregated.allDetectedConcerns[concern] = {
            occurrences: 0,
            avgIntensity: 0,
            avgConfidence: 0,
            detectionHistory: []
          };
        }
        const existing = aggregated.allDetectedConcerns[concern];
        existing.occurrences += 1;
        existing.avgIntensity = (existing.avgIntensity + data.intensity) / 2;
        existing.avgConfidence = (existing.avgConfidence + data.confidence) / 2;
        existing.detectionHistory.push({
          responseIndex: idx,
          intensity: data.intensity,
          confidence: data.confidence
        });
      });

      // Aggregate risk scores
      if (result.rawAnalysis?.riskAssessment) {
        cumulativeRisk += result.rawAnalysis.riskAssessment.overall_risk_score || 0;
        riskCount += 1;

        // Collect identified risks
        (result.rawAnalysis.riskAssessment.identified_risks || []).forEach(risk => {
          const existing = aggregated.aggregatedRiskAssessment.identifiedRisks.find(
            r => r.concern === risk.concern
          );
          if (existing) {
            existing.occurrences = (existing.occurrences || 1) + 1;
          } else {
            aggregated.aggregatedRiskAssessment.identifiedRisks.push({
              concern: risk.concern,
              severity: risk.severity,
              occurrences: 1,
              emotions: risk.emotions_detected
            });
          }
        });

        // Collect protective factors
        (result.rawAnalysis.riskAssessment.protective_factors || []).forEach(factor => {
          const existing = aggregated.aggregatedRiskAssessment.protectiveFactors.find(
            f => f.factor === factor.factor
          );
          if (!existing) {
            aggregated.aggregatedRiskAssessment.protectiveFactors.push({
              factor: factor.factor,
              occurrences: 1
            });
          } else {
            existing.occurrences += 1;
          }
        });

        // Collect severity indicators
        (result.rawAnalysis.riskAssessment.severity_indicators || []).forEach(indicator => {
          if (!aggregated.aggregatedRiskAssessment.severityIndicators.includes(indicator)) {
            aggregated.aggregatedRiskAssessment.severityIndicators.push(indicator);
          }
        });
      }
    });

    // Calculate final aggregate risk score
    aggregated.aggregatedRiskAssessment.overallRiskScore = 
      riskCount > 0 ? cumulativeRisk / riskCount : 0;

    // Determine final mental health status
    const riskScore = aggregated.aggregatedRiskAssessment.overallRiskScore;
    if (riskScore > 0.7) {
      aggregated.aggregatedRiskAssessment.mentalHealthStatus = 'HIGH_RISK';
    } else if (riskScore > 0.4) {
      aggregated.aggregatedRiskAssessment.mentalHealthStatus = 'MODERATE_RISK';
    } else if (riskScore > 0.15) {
      aggregated.aggregatedRiskAssessment.mentalHealthStatus = 'MILD_CONCERN';
    } else {
      aggregated.aggregatedRiskAssessment.mentalHealthStatus = 'LOW_RISK';
    }

    const sortedEmotionCounts = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .reduce((acc, [emotion, count]) => {
        acc[emotion] = count;
        return acc;
      }, {});

    const sortedConcerns = Object.entries(concernFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([concern]) => concern);

    const primaryEmotion = Object.keys(sortedEmotionCounts)[0] || 'neutral';
    const averageConfidence = results.length > 0 ? Number((confidenceSum / results.length).toFixed(3)) : 0;

    // Return compatibility shape expected by frontend, plus deep aggregate diagnostics.
    return {
      primaryEmotion,
      concerns: sortedConcerns,
      emotionCounts: sortedEmotionCounts,
      averageConfidence,
      textCount: results.length,
      modelAvailable: true,
      aggregated
    };
  } catch (e) {
    console.error('❌ Error enriching concern analysis:', e.message);
    return null;
  }
};

/**
 * Generate detailed mental wellness report from screening data
 * Creates personalized, multi-dimensional analysis using ML outputs
 */
const generateMentalWellnessReport = async (screeningResponses, emotionalProfile, 
                                           concernProfile, riskAssessment, userScore) => {
  if (!modelAvailable) {
    return null;
  }

  try {
    const reportGeneratorPath = path.join(__dirname, '../ml/report_generator.py');
    
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        reportGeneratorPath,
        JSON.stringify({
          screening_responses: screeningResponses,
          emotional_profile: emotionalProfile,
          concern_profile: concernProfile,
          risk_assessment: riskAssessment,
          user_score: userScore
        })
      ]);

      let output = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0 && output) {
          try {
            const report = JSON.parse(output);
            if (report && report.error) {
              reject(new Error(`Report generator error: ${report.error}`));
              return;
            }
            resolve(report);
          } catch (e) {
            reject(new Error('Invalid JSON from report generator'));
          }
        } else {
          reject(new Error(error || `Report generation failed with code ${code}`));
        }
      });

      pythonProcess.on('error', (err) => {
        reject(err);
      });

      // 10 second timeout for report generation
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Report generation timeout'));
      }, 10000);
    });
  } catch (e) {
    console.error('❌ Error generating wellness report:', e.message);
    return null;
  }
};

// Initialize on require
testModelAvailability().then((available) => {
  modelAvailable = available;
});

module.exports = {
  classifyEmotion,
  enrichConcernAnalysis,
  generateMentalWellnessReport,
  modelAvailable
};
