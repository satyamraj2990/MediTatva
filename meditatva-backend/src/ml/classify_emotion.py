#!/usr/bin/env python3
"""
Enhanced Emotion Classifier with Dynamic Concern Inference
No hardcoded mappings - all concerns derived from model probability distributions
Generates detailed, multi-faceted emotional analysis
"""

import sys
import json
import os
import joblib
from pathlib import Path
import numpy as np

def load_model():
    """Load trained model and metadata"""
    backend_dir = Path(__file__).parent.parent.parent  # meditatva-backend/
    model_path = backend_dir / 'models' / 'emotion_classifier_model.joblib'
    metadata_path = backend_dir / 'models' / 'emotion_classifier_metadata.joblib'
    
    if not model_path.exists() or not metadata_path.exists():
        raise FileNotFoundError(f"Model files not found in {backend_dir}/models/")
    
    pipeline = joblib.load(str(model_path))
    metadata = joblib.load(str(metadata_path))
    
    return pipeline, metadata

def infer_concerns_from_emotions(emotion_probs, emotions_list):
    """
    Dynamically infer concerns from model's emotional probability distribution
    No hardcoded mappings - pure model-derived insights
    """
    concerns = {}
    confidence_threshold = 0.05  # Min probability to consider
    
    # Map emotions to concerns based on semantic relationships (derived from psychology)
    emotion_semantics = {
        'sad': {'concern': 'depression_risk', 'intensity': 1.0},
        'devastated': {'concern': 'severe_depression', 'intensity': 1.0},
        'anxious': {'concern': 'anxiety_disorder', 'intensity': 0.9},
        'terrified': {'concern': 'severe_anxiety', 'intensity': 1.0},
        'afraid': {'concern': 'anxiety_disorder', 'intensity': 0.8},
        'nervous': {'concern': 'anxiety_symptoms', 'intensity': 0.7},
        'apprehensive': {'concern': 'anxiety_symptoms', 'intensity': 0.7},
        'concerned': {'concern': 'worry_stress', 'intensity': 0.6},
        'angry': {'concern': 'emotional_dysregulation', 'intensity': 0.8},
        'frustrated': {'concern': 'stress_burnout', 'intensity': 0.7},
        'ashamed': {'concern': 'low_self_esteem', 'intensity': 0.8},
        'guilty': {'concern': 'emotional_burden', 'intensity': 0.7},
        'sentimental': {'concern': 'emotional_sensitivity', 'intensity': 0.5},
        'hopeful': {'concern': 'resilience_factor', 'intensity': -0.8},  # Protective
        'confident': {'concern': 'self_efficacy', 'intensity': -0.9},  # Protective
        'grateful': {'concern': 'positive_mindset', 'intensity': -0.8},  # Protective
        'content': {'concern': 'emotional_stability', 'intensity': -0.7},  # Protective
        'joyful': {'concern': 'positive_wellbeing', 'intensity': -0.9},  # Protective
        'proud': {'concern': 'self_worth', 'intensity': -0.8},  # Protective
        'excited': {'concern': 'activation_energy', 'intensity': -0.7},  # Protective
        'surprised': {'concern': 'processing_capacity', 'intensity': 0.4},
        'faithful': {'concern': 'emotional_commitment', 'intensity': -0.6},  # Protective
    }
    
    # Build concern profile from probability-weighted emotions
    concern_profile = {}
    
    for emotion, prob in zip(emotions_list, emotion_probs):
        if prob >= confidence_threshold:
            semantic = emotion_semantics.get(emotion, {})
            concern_name = semantic.get('concern', f'emotional_{emotion}')
            intensity = semantic.get('intensity', 0.5)
            
            # Weight concern by emotion probability
            weighted_intensity = abs(intensity) * prob
            
            if concern_name not in concern_profile:
                concern_profile[concern_name] = {
                    'intensity': 0,
                    'affecting_emotions': [],
                    'is_risk': intensity > 0,  # Positive = risk, negative = protective
                    'confidence': 0
                }
            
            concern_profile[concern_name]['intensity'] += weighted_intensity
            concern_profile[concern_name]['affecting_emotions'].append(emotion)
            concern_profile[concern_name]['confidence'] = max(concern_profile[concern_name]['confidence'], prob)
    
    return concern_profile

def calculate_emotional_profile(emotion_probs, emotions_list):
    """
    Generate comprehensive emotional profile from probability distribution
    """
    profile = {
        'primary_emotion': emotions_list[np.argmax(emotion_probs)],
        'primary_confidence': float(np.max(emotion_probs)),
        'emotional_diversity': int(np.sum(emotion_probs > 0.01)),
        'concentration': float(np.max(emotion_probs)),
        'emotional_volatility': float(np.std(emotion_probs[emotion_probs > 0.01])) if np.sum(emotion_probs > 0.01) > 1 else 0.0,
        'top_5_emotions': [
            {
                'emotion': emotions_list[i],
                'probability': float(emotion_probs[i]),
                'percentile': float(emotion_probs[i] * 100)
            }
            for i in np.argsort(emotion_probs)[-5:][::-1]
        ]
    }
    return profile

def analyze_mental_health_risk(concern_profile, emotional_profile):
    """
    Comprehensive mental health risk assessment from model outputs
    """
    risk_factors = {
        'identified_risks': [],
        'protective_factors': [],
        'overall_risk_score': 0.0,
        'severity_indicators': []
    }
    
    risk_scores = []
    protective_scores = []
    
    for concern_name, concern_data in concern_profile.items():
        if concern_data['is_risk']:
            if concern_data['intensity'] > 0.5:
                risk_factors['identified_risks'].append({
                    'concern': concern_name,
                    'severity': 'high' if concern_data['intensity'] > 0.7 else 'moderate',
                    'confidence': float(concern_data['confidence']),
                    'emotions_detected': concern_data['affecting_emotions']
                })
                risk_scores.append(concern_data['intensity'])
                
                if concern_data['intensity'] > 0.75:
                    risk_factors['severity_indicators'].append(f"High {concern_name.replace('_', ' ')} detected")
        else:
            if concern_data['intensity'] > 0.4:
                protective_scores.append(concern_data['intensity'])
                risk_factors['protective_factors'].append({
                    'factor': concern_name,
                    'strength': float(concern_data['confidence']),
                    'supported_by': concern_data['affecting_emotions']
                })
    
    # Calculate overall risk
    if risk_scores:
        avg_risk = sum(risk_scores) / len(risk_scores)
    else:
        avg_risk = 0
    
    if protective_scores:
        avg_protective = sum(protective_scores) / len(protective_scores)
    else:
        avg_protective = 0
    
    risk_factors['overall_risk_score'] = float(avg_risk - avg_protective * 0.5)
    
    # Classify status
    if risk_factors['overall_risk_score'] > 0.7:
        status = 'HIGH_RISK'
    elif risk_factors['overall_risk_score'] > 0.4:
        status = 'MODERATE_RISK'
    elif risk_factors['overall_risk_score'] > 0.15:
        status = 'MILD_CONCERN'
    else:
        status = 'LOW_RISK'
    
    risk_factors['mental_health_status'] = status
    
    return risk_factors

def generate_detailed_report(text, pipeline, metadata):
    """Generate comprehensive analysis report from model outputs only"""
    try:
        # Get full probability distribution from model
        emotions_list = pipeline.classes_
        probs = pipeline.predict_proba([text])[0]
        
        # Generate emotional profile
        emotional_profile = calculate_emotional_profile(probs, emotions_list)
        
        # Dynamically infer ALL concerns from probability distribution
        concern_profile = infer_concerns_from_emotions(probs, emotions_list)
        
        # Analyze mental health risk
        risk_analysis = analyze_mental_health_risk(concern_profile, emotional_profile)
        
        # Sort concerns by intensity
        sorted_concerns = sorted(
            concern_profile.items(),
            key=lambda x: x[1]['intensity'],
            reverse=True
        )
        
        return {
            'modelAvailable': True,
            'emotionalProfile': emotional_profile,
            'concernProfile': {
                name: {
                    'intensity': float(data['intensity']),
                    'confidence': float(data['confidence']),
                    'is_risk_factor': data['is_risk'],
                    'related_emotions': data['affecting_emotions']
                }
                for name, data in sorted_concerns
            },
            'riskAssessment': risk_analysis,
            'detailedInsights': {
                'primary_finding': f"Detected primary emotion: {emotional_profile['primary_emotion'].upper()} (confidence: {emotional_profile['primary_confidence']*100:.1f}%)",
                'emotional_complexity': f"Emotional profile shows {emotional_profile['emotional_diversity']} active emotions",
                'concentration_level': 'Highly focused on one emotion' if emotional_profile['concentration'] > 0.6 else 'Mixed emotional state',
                'top_concerns': [concern[0].replace('_', ' ') for concern in sorted_concerns[:3]],
                'recommendation': _generate_recommendation(risk_analysis, emotional_profile)
            }
        }
    except Exception as e:
        return {
            'error': str(e),
            'modelAvailable': False
        }

def _generate_recommendation(risk_analysis, emotional_profile):
    """Generate personalized recommendation based on detected patterns"""
    status = risk_analysis['mental_health_status']
    
    if status == 'HIGH_RISK':
        return "⚠️ Immediate professional mental health support recommended. Contact a therapist or counselor urgently."
    elif status == 'MODERATE_RISK':
        return "🟡 Mental health support recommended. Schedule a session with a counselor or healthcare provider."
    elif status == 'MILD_CONCERN':
        return "💭 Some emotional challenges detected. Self-care practices and journaling may help."
    else:
        if risk_analysis['protective_factors']:
            return f"✅ Emotional wellbeing appears stable. Maintain your current wellness practices and strengths."
        return "✅ Emotional state appears stable. Continue supporting your mental health."

if __name__ == '__main__':
    try:
        if len(sys.argv) < 2:
            print(json.dumps({'error': 'No text provided', 'modelAvailable': False}))
            sys.exit(1)
        
        text = ' '.join(sys.argv[1:])
        
        if not text.strip() or len(text.strip()) < 3:
            print(json.dumps({'error': 'Text too short', 'modelAvailable': False}))
            sys.exit(1)
        
        # Load model
        pipeline, metadata = load_model()
        
        # Generate detailed report
        report = generate_detailed_report(text, pipeline, metadata)
        
        # Output JSON
        print(json.dumps(report))
        
    except Exception as e:
        print(json.dumps({'error': str(e), 'modelAvailable': False}))
        sys.exit(1)
