# Mental Wellness Report API Documentation

## Endpoint: POST /api/emotion/wellness-report

Generate a comprehensive, personalized mental wellness report from screening data and emotional analysis.

---

## Request Format

```json
{
  "screeningResponses": {
    "q1": 2,
    "q2": 1,
    "q3": 0,
    "q4": 1,
    "q5": 2,
    "q6": 1,
    "q7": 3
  },
  "emotionalProfile": {
    "primary_emotion": "anxious",
    "primary_confidence": 0.15,
    "emotional_diversity": 8,
    "concentration": 0.15,
    "emotional_volatility": 0.08,
    "top_5_emotions": [
      {
        "emotion": "anxious",
        "probability": 0.15
      },
      {
        "emotion": "stressed",
        "probability": 0.12
      },
      {
        "emotion": "sad",
        "probability": 0.08
      },
      {
        "emotion": "overwhelmed",
        "probability": 0.07
      },
      {
        "emotion": "afraid",
        "probability": 0.06
      }
    ]
  },
  "concernProfile": {
    "anxiety_disorder": {
      "intensity": 0.12,
      "confidence": 0.15,
      "is_risk_factor": true
    },
    "stress_management": {
      "intensity": 0.10,
      "confidence": 0.12,
      "is_risk_factor": true
    },
    "depression_risk": {
      "intensity": 0.08,
      "confidence": 0.08,
      "is_risk_factor": true
    },
    "resilience_factor": {
      "intensity": 0.04,
      "confidence": 0.05,
      "is_risk_factor": false
    }
  },
  "riskAssessment": {
    "overall_risk_score": 0.35,
    "mental_health_status": "MODERATE_RISK",
    "identified_risks": [],
    "protective_factors": []
  },
  "userScore": 0.65
}
```

---

## Response Format

```json
{
  "report_id": "MWR-1774345133365",
  "timestamp": "2026-03-24T15:08:53.365790",
  "screening_data": {
    "total_score": 0.65,
    "responses_count": 7,
    "primary_emotion": "anxious",
    "emotional_diversity": 8
  },
  "overall_mental_state": {
    "narrative": "Personalized paragraph explaining emotional condition...",
    "emotional_quality": "anxious",
    "primary_emotional_tone": "Distressed",
    "pattern_summary": "Burnout Tendency, Rumination Cycle, Anxiety Spiral"
  },
  "emotional_breakdown": {
    "detected_emotions": [
      {
        "emotion": "anxious",
        "intensity": "High",
        "score": 0.15,
        "description": "Worry or nervousness about potential threats"
      }
    ],
    "concern_interconnections": [
      {
        "concern": "Anxiety Disorder",
        "intensity": "Moderate",
        "score": 0.12,
        "flag": true
      }
    ]
  },
  "behavioral_patterns": {
    "identified_patterns": [
      {
        "name": "Burnout Tendency",
        "description": "Description of pattern...",
        "behavioral_sign": "Observable behavior..."
      }
    ],
    "behavioral_indicators": [
      "Heightened threat awareness",
      "Capacity overload"
    ],
    "cognitive_style": "Anticipatory/Future-focused (tends toward worry about what might happen)"
  },
  "key_concerns": {
    "primary_concerns": [
      {
        "concern": "Anxiety Management",
        "indicator": "anxious",
        "intensity": "High"
      }
    ],
    "emerging_concerns": [
      {
        "concern": "Stress Management",
        "indicator": "stressed",
        "intensity": "Moderate"
      }
    ],
    "protective_elements": [
      {
        "strength": "Hopeful",
        "intensity": "Low"
      }
    ]
  },
  "psychological_insight": {
    "primary_insight": "Deep explanation of emotional mechanisms and patterns...",
    "dynamic_explanation": "How the system works mechanistically...",
    "system_perspective": "Bigger picture view of interaction between patterns..."
  },
  "severity_risk": {
    "severity_level": "MODERATE",
    "risk_classification": "SHOULD_ADDRESS",
    "severity_score": 0.35,
    "reasoning": "Detailed explanation of severity classification...",
    "warning_signs": [
      "Isolation indicators",
      "Reduced agency and control"
    ],
    "buffer_factors": [
      "Presence of positive emotions provides resilience foundation"
    ]
  },
  "recommendations": [
    {
      "category": "Recovery Strategy",
      "recommendation": "Schedule deliberate rest...",
      "rationale": "Burnout requires genuine restoration..."
    },
    {
      "category": "Grounding Technique",
      "recommendation": "Use 5-4-3-2-1 sensory technique...",
      "rationale": "Engages present-moment awareness..."
    }
  ],
  "micro_actions": [
    {
      "action_number": 1,
      "timeframe": "Next 5 minutes",
      "description": "Take 5 deep breaths, focusing on exhales...",
      "benefit": "Activates parasympathetic nervous system..."
    },
    {
      "action_number": 2,
      "timeframe": "Within 1 hour",
      "description": "Step away from stress...",
      "benefit": "Distance creates perspective..."
    }
  ],
  "support_recommendation": {
    "support_level": "Talking to someone recommended",
    "message": "While self-care strategies can help...",
    "next_steps": [
      "Identify one trusted person to talk with",
      "If you prefer professional support, research counselors",
      "Practice the strategies and adjust based on what works",
      "Check in with yourself in one week"
    ],
    "red_flags_requiring_immediate_help": [],
    "urgent_message": ""
  },
  "closing_note": "You're taking an important step by checking in with yourself. What you're experiencing matters, and you deserve to address it...",
  "is_model_generated": true,
  "generation_method": "ML-inferred patterns, ZERO hardcoding"
}
```

---

## Response Fields Explained

### 1. Report Metadata
- `report_id`: Unique identifier for this report
- `timestamp`: When report was generated
- `screening_data`: Summary of input screening info

### 2. Overall Mental State (Section 1)
- `narrative`: Personalized paragraph explaining emotional condition
- `emotional_quality`: Primary emotion detected
- `primary_emotional_tone`: Distressed/Positive/Neutral
- `pattern_summary`: Condensed pattern list

### 3. Emotional Breakdown (Section 2)
- `detected_emotions`: Top emotions with intensity and descriptions
- `concern_interconnections`: Related mental health concerns

### 4. Behavioral Patterns (Section 3)
- `identified_patterns`: Detected psychological patterns (burnout, rumination, etc.)
- `behavioral_indicators`: Observable signs (threat awareness, isolation, etc.)
- `cognitive_style`: How user processes information

### 5. Key Concerns (Section 4)
- `primary_concerns`: High-intensity concerns
- `emerging_concerns`: Moderate-intensity concerns
- `protective_elements`: Positive emotions/strengths

### 6. Psychological Insight (Section 5)
- `primary_insight`: Core mechanism explanation
- `dynamic_explanation`: How patterns interact
- `system_perspective`: Broader pattern interconnections

### 7. Severity & Risk (Section 6)
- `severity_level`: LOW / MILD / MODERATE / HIGH
- `risk_classification`: Status indicator
- `severity_score`: Numeric risk score (0-1)
- `reasoning`: Why this level
- `warning_signs`: Red flags present
- `buffer_factors`: Strengths/protections

### 8. Recommendations (Section 7)
- `category`: Type of recommendation (Recovery, Grounding, etc.)
- `recommendation`: Specific strategy
- `rationale`: Why this helps

### 9. Micro-Actions (Section 8)
- Small, actionable steps with timeframes
- Numbered 1-5 for progression

### 10. Support Recommendation (Section 9)
- `support_level`: What level of help is recommended
- `message`: Soft, encouraging messaging
- `next_steps`: Concrete actions
- `red_flags_requiring_immediate_help`: Crisis indicators
- `urgent_message`: If crisis detected

### 11. Closing Note (Section 10)
- Empathetic, warm message
- Personalized based on detected patterns and severity

---

## Integration Example (Frontend)

```typescript
// Call wellness report API
const response = await fetch('/api/emotion/wellness-report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    screeningResponses: userResponses,
    emotionalProfile: mlModel.emotionalProfile,
    concernProfile: mlModel.concernProfile,
    riskAssessment: mlModel.riskAssessment,
    userScore: calculatedScore
  })
});

const report = await response.json();

// Display report
displayDetailedReport(report);
```

---

## Error Handling

**400 Bad Request**: Missing required fields
```json
{
  "error": "Missing required fields: emotionalProfile, concernProfile, riskAssessment, userScore",
  "modelAvailable": false
}
```

**503 Service Unavailable**: Model not available
```json
{
  "error": "Report generation failed - model not available",
  "modelAvailable": false
}
```

**500 Internal Server Error**: Report generation failed
```json
{
  "error": "Internal server error",
  "message": "Error details...",
  "modelAvailable": false
}
```

---

## Performance Characteristics

| Aspect | Detail |
|--------|--------|
| **Generation Time** | 2-3 seconds (Python subprocess) |
| **Timeout** | 10 seconds |
| **Response Size** | ~50-80KB JSON |
| **Accuracy** | Based on trained emotion classifier (48.48% baseline) |
| **Cache Recommended** | 5 minutes (no personalized data changes) |

---

## Design Principles

1. **NO Hardcoding**: Every insight is dynamically generated from ML data
2. **Pattern-Based**: 5+ psychological patterns detected automatically
3. **Empathetic**: Warm, human tone throughout
4. **Actionable**: Every recommendation includes specific steps
5. **Severity-Aware**: Recommendations and tone adjust based on risk level
6. **Holistic**: Multiple dimensions analyzed (emotions, patterns, risks, strengths)

---

## Use Cases

1. **Post-Screening Report**: Generated after 7-question mental health screening
2. **Journaling Companion**: Generated from daily journal entries
3. **Progress Tracking**: Compare reports over time
4. **Crisis Detection**: Flag urgent issues requiring immediate help
5. **Therapy Assistant**: Provides talking points for counselor sessions

---

**API Version**: 1.0  
**Last Updated**: 2026-03-24  
**Status**: Production Ready
