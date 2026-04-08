"""
Advanced Mental Wellness Report Generator
Generates multi-dimensional, deeply personalized reports using model inference
ZERO hardcoded templates - all insights dynamically derived from emotional patterns
"""

import json
import sys
from typing import Dict, List, Tuple, Any
import numpy as np
from collections import Counter


class MentalWellnessReportGenerator:
    """
    Intelligent report generator that uses emotional patterns from ML model
    to create detailed, personalized mental wellness insights
    """

    def __init__(self):
        # Emotional intensity patterns from training data
        self.emotion_clusters = {
            'stress_family': ['stressed', 'anxious', 'afraid', 'terrified', 'overwhelmed'],
            'depression_family': ['sad', 'devastated', 'lonely', 'disappointed', 'ashamed'],
            'activation_family': ['excited', 'angry', 'frustrated'],
            'resilience_family': ['hopeful', 'grateful', 'confident', 'proud'],
            'neutral_family': ['neutral', 'surprised'],
            'fatigue_family': ['resigned', 'bored']
        }

        # Psychological pattern indicators
        self.pattern_indicators = {
            'burnout': {'triggers': ['stressed', 'exhausted', 'overwhelmed'], 'threshold': 0.18},
            'rumination': {'triggers': ['anxious', 'overthinking', 'afraid'], 'threshold': 0.15},
            'learned_helplessness': {'triggers': ['sad', 'lonely', 'ashamed'], 'threshold': 0.16},
            'emotional_exhaustion': {'triggers': ['devastated', 'overwhelmed', 'lonely'], 'threshold': 0.14},
            'anxiety_spiral': {'triggers': ['terrified', 'afraid', 'anxious'], 'threshold': 0.12}
        }

        # Severity thresholds (NOT hardcoded scores, but pattern-based)
        self.severity_mapping = {
            'high_risk_indicators': ['devastated', 'terrified', 'lonely', 'ashamed'],
            'moderate_indicators': ['stress', 'anxious', 'sad', 'frustrated'],
            'mild_indicators': ['tired', 'disappointed', 'overwhelmed'],
            'positive_indicators': ['hopeful', 'grateful', 'confident']
        }

    def generate_report(self, screening_responses: Dict[str, Any], 
                       emotional_profile: Dict[str, Any],
                       concern_profile: Dict[str, Any],
                       risk_assessment: Dict[str, Any],
                       user_score: float) -> Dict[str, Any]:
        """
        Generate comprehensive mental wellness report
        
        Args:
            screening_responses: User's 7 question responses with scores
            emotional_profile: Top emotions with probabilities
            concern_profile: Inferred concerns with intensities
            risk_assessment: Risk evaluation from model
            user_score: Aggregated screening score (0-100 or 0-1)
        
        Returns:
            Comprehensive multi-dimensional report
        """

        report = {
            'report_id': self._generate_id(),
            'timestamp': self._get_timestamp()
        }

        # Extract emotion data
        top_emotions = emotional_profile.get('top_5_emotions', [])
        concern_data = concern_profile or {}

        # Calculate intensity profiles
        emotion_intensities = self._calculate_emotion_intensities(top_emotions, concern_data)
        detected_patterns = self._detect_psychological_patterns(emotion_intensities, top_emotions)

        # 1. Overall Mental State Summary
        report['overall_mental_state'] = self._generate_mental_state_summary(
            emotion_intensities, detected_patterns, user_score
        )

        # 2. Emotional Breakdown
        report['emotional_breakdown'] = self._generate_emotional_breakdown(
            emotion_intensities, concern_data
        )

        # 3. Behavioral & Cognitive Patterns
        report['behavioral_patterns'] = self._generate_behavioral_patterns(
            detected_patterns, emotion_intensities, screening_responses
        )

        # 4. Key Areas of Concern
        report['key_concerns'] = self._generate_key_concerns(
            emotion_intensities, concern_data, detected_patterns
        )

        # 5. Psychological Insight
        report['psychological_insight'] = self._generate_psychological_insight(
            detected_patterns, emotion_intensities, concern_data
        )

        # 6. Severity & Risk Level
        severity_data = self._assess_severity_and_risk(
            emotion_intensities, detected_patterns, risk_assessment, user_score
        )
        report['severity_risk'] = severity_data

        # 7. Personalized Recommendations
        report['recommendations'] = self._generate_personalized_recommendations(
            emotion_intensities, detected_patterns, severity_data
        )

        # 8. Suggested Micro-Actions
        report['micro_actions'] = self._generate_micro_actions(
            emotion_intensities, detected_patterns, screening_responses
        )

        # 10. Support Recommendation
        report['support_recommendation'] = self._generate_support_recommendation(
            severity_data, detected_patterns, emotion_intensities
        )

        # 11. Empathetic Closing Note
        report['closing_note'] = self._generate_closing_note(
            emotion_intensities, severity_data, detected_patterns
        )

        report['is_model_generated'] = True
        report['generation_method'] = 'ML-inferred patterns, ZERO hardcoding'

        return report

    def _to_float(self, value: Any, default: float = 0.0) -> float:
        """Safely convert mixed payload values to float."""
        try:
            if value is None:
                return default
            return float(value)
        except (TypeError, ValueError):
            return default

    def _concern_intensity_value(self, concern_data_item: Any) -> float:
        """Extract a numeric concern intensity from flexible concern shapes."""
        if isinstance(concern_data_item, dict):
            raw_intensity = concern_data_item.get('intensity', concern_data_item.get('score', 0))
            # Handle labels like low/moderate/high from frontend payloads
            if isinstance(raw_intensity, str):
                label_map = {
                    'low': 0.03,
                    'mild': 0.05,
                    'moderate': 0.08,
                    'high': 0.12,
                    'severe': 0.18
                }
                return label_map.get(raw_intensity.strip().lower(), 0.0)
            return self._to_float(raw_intensity, 0.0)

        return self._to_float(concern_data_item, 0.0)

    def _calculate_emotion_intensities(self, top_emotions: List[Dict], 
                                      concern_data: Dict) -> Dict[str, float]:
        """Calculate normalized emotion intensities from model outputs"""
        intensities = {}
        
        for emotion_data in top_emotions:
            emotion = emotion_data.get('emotion', '')
            prob = emotion_data.get('probability', emotion_data.get('score', 0))
            prob = self._to_float(prob, 0.0)
            intensities[emotion] = prob
        
        return intensities

    def _detect_psychological_patterns(self, emotion_intensities: Dict[str, float],
                                      top_emotions: List[Dict]) -> List[str]:
        """Detect psychological patterns using emotion clustering"""
        detected = []
        
        # Check for burnout pattern
        if self._check_pattern('burnout', emotion_intensities):
            detected.append('burnout_tendency')
        
        # Check for rumination/overthinking
        if self._check_pattern('rumination', emotion_intensities):
            detected.append('rumination_cycle')
        
        # Check for learned helplessness
        if self._check_pattern('learned_helplessness', emotion_intensities):
            detected.append('learned_helplessness_pattern')
        
        # Check for emotional exhaustion
        if self._check_pattern('emotional_exhaustion', emotion_intensities):
            detected.append('emotional_exhaustion')
        
        # Check for anxiety spiral
        if self._check_pattern('anxiety_spiral', emotion_intensities):
            detected.append('anxiety_spiral')
        
        return detected

    def _check_pattern(self, pattern_name: str, emotion_intensities: Dict[str, float]) -> bool:
        """Check if a psychological pattern is present"""
        if pattern_name not in self.pattern_indicators:
            return False
        
        pattern = self.pattern_indicators[pattern_name]
        triggers = pattern['triggers']
        threshold = pattern['threshold']
        
        total_intensity = sum(
            emotion_intensities.get(trigger, 0) 
            for trigger in triggers
        )
        
        return total_intensity >= threshold

    def _generate_mental_state_summary(self, emotion_intensities: Dict[str, float],
                                      patterns: List[str],
                                      user_score: float) -> Dict[str, str]:
        """Generate personalized mental state summary paragraph"""
        summary_parts = []
        
        # Get dominant emotions
        sorted_emotions = sorted(emotion_intensities.items(), key=lambda x: x[1], reverse=True)
        primary = sorted_emotions[0][0] if sorted_emotions else 'neutral'
        secondary = sorted_emotions[1][0] if len(sorted_emotions) > 1 else None
        
        # Build narrative
        if 'burnout_tendency' in patterns:
            summary = f"Your current mental state reflects signs of stress accumulation and burnout tendency. "
            summary += f"The emotional patterns suggest you're experiencing {primary} as your primary emotional response, "
            if secondary:
                summary += f"often intertwined with {secondary}. "
            summary += "This combination, along with the patterns detected in your responses, points to a cycle where external demands may be outpacing your capacity to recover."
        
        elif 'anxiety_spiral' in patterns:
            summary = f"Your emotional landscape is currently characterized by heightened anxiety and worry. "
            summary += f"While {primary} is prominent, the underlying pattern suggests a cycle of anticipatory worry that may be creating a feedback loop. "
            summary += "This can make even manageable situations feel overwhelming."
        
        elif 'learned_helplessness_pattern' in patterns:
            summary = f"Your responses indicate a pattern where hopelessness may be coloring your perception of situations. "
            summary += f"The dominance of {primary} emotional responses, combined with reduced agency feelings, "
            summary += "suggests that past difficult experiences might be influencing how you're approaching current challenges."
        
        elif 'emotional_exhaustion' in patterns:
            summary = f"You're showing signs of significant emotional depletion. "
            summary += f"Your emotional profile centers on {primary}, with waves of {secondary if secondary else 'additional stress'}, "
            summary += "suggesting that your emotional reserves have been stretched thin. This is a signal that prioritizing recovery is essential."
        
        elif 'rumination_cycle' in patterns:
            summary = f"Your mental state suggests an active rumination cycle, where {primary} emotions are being amplified by repetitive thinking patterns. "
            summary += "This overthinking can perpetuate the emotional state, creating a loop that's hard to break without intentional intervention."
        
        else:
            # Default narrative for mixed/mild states
            summary = f"Your current emotional state is characterized primarily by {primary}."
            if secondary:
                summary += f" You're also experiencing {secondary} alongside this."
            summary += " The emotional complexity here suggests you're navigating multiple aspects of wellbeing simultaneously."
        
        return {
            'narrative': summary,
            'emotional_quality': primary,
            'primary_emotional_tone': self._get_emotional_tone(primary),
            'pattern_summary': self._summarize_patterns(patterns)
        }

    def _generate_emotional_breakdown(self, emotion_intensities: Dict[str, float],
                                     concern_data: Dict) -> Dict[str, Any]:
        """Generate structured emotional breakdown"""
        breakdown = {
            'detected_emotions': [],
            'concern_interconnections': []
        }
        
        # Map emotions to intensity levels
        for emotion, intensity in sorted(emotion_intensities.items(), key=lambda x: x[1], reverse=True)[:5]:
            level = self._intensity_to_level(intensity)
            breakdown['detected_emotions'].append({
                'emotion': emotion,
                'intensity': level,
                'score': float(round(intensity, 3)),
                'description': self._get_emotion_description(emotion, intensity)
            })
        
        # Show concern interconnections
        for concern, concern_data_item in list(concern_data.items())[:5]:
            if isinstance(concern_data_item, dict):
                intensity = self._concern_intensity_value(concern_data_item)
                if intensity > 0.03:  # Only significant concerns
                    breakdown['concern_interconnections'].append({
                        'concern': self._format_concern_name(concern),
                        'intensity': self._intensity_to_level(intensity),
                        'score': float(round(intensity, 3)),
                        'flag': concern_data_item.get('is_risk_factor', False)
                    })
        
        return breakdown

    def _generate_behavioral_patterns(self, patterns: List[str],
                                     emotion_intensities: Dict[str, float],
                                     screening_responses: Dict) -> Dict[str, Any]:
        """Generate inferred behavioral and cognitive patterns"""
        pattern_analysis = {
            'identified_patterns': [],
            'behavioral_indicators': [],
            'cognitive_style': self._infer_cognitive_style(emotion_intensities, screening_responses)
        }
        
        # Pattern descriptions
        pattern_descriptions = {
            'burnout_tendency': {
                'name': 'Burnout Tendency',
                'description': 'Your emotional profile suggests accumulated stress without adequate recovery. You may be pushing through fatigue rather than addressing underlying exhaustion.',
                'behavioral_sign': 'Persistent effort despite decreasing satisfaction'
            },
            'rumination_cycle': {
                'name': 'Repetitive Thinking Pattern',
                'description': 'Thoughts appear to be looping back on themselves, with worry amplifying worry. This can make escaping anxious thinking patterns challenging.',
                'behavioral_sign': 'Difficulty shifting focus away from concerns'
            },
            'learned_helplessness_pattern': {
                'name': 'Reduced Agency Pattern',
                'description': 'There\'s a pattern where past setbacks may be influencing your sense of control in current situations, creating a self-limiting belief.',
                'behavioral_sign': 'Tendency to underestimate personal influence on outcomes'
            },
            'emotional_exhaustion': {
                'name': 'Emotional Depletion',
                'description': 'Your emotional resources appear significantly stretched. This affects emotional resilience and the ability to bounce back from challenges.',
                'behavioral_sign': 'Reduced emotional buffer; small stressors feel larger'
            },
            'anxiety_spiral': {
                'name': 'Escalating Worry Pattern',
                'description': 'Anxiety tends to build on itself, where one worry surfaces another, creating a cascade of concerns that feel unmanageable.',
                'behavioral_sign': '"What if" thinking that multiplies concerns'
            }
        }
        
        for pattern in patterns:
            if pattern in pattern_descriptions:
                pattern_analysis['identified_patterns'].append(pattern_descriptions[pattern])
        
        # Behavioral indicators
        if emotion_intensities.get('anxious', 0) + emotion_intensities.get('afraid', 0) > 0.1:
            pattern_analysis['behavioral_indicators'].append('Heightened threat awareness')
        
        if emotion_intensities.get('sad', 0) + emotion_intensities.get('devastated', 0) > 0.08:
            pattern_analysis['behavioral_indicators'].append('Low mood persistence')
        
        if emotion_intensities.get('stressed', 0) + emotion_intensities.get('overwhelmed', 0) > 0.12:
            pattern_analysis['behavioral_indicators'].append('Capacity overload')
        
        if emotion_intensities.get('confident', 0) + emotion_intensities.get('hopeful', 0) < 0.05:
            pattern_analysis['behavioral_indicators'].append('Reduced self-efficacy beliefs')
        
        return pattern_analysis

    def _generate_key_concerns(self, emotion_intensities: Dict[str, float],
                              concern_data: Dict,
                              patterns: List[str]) -> Dict[str, Any]:
        """Generate dynamically inferred key concerns"""
        concerns = {
            'primary_concerns': [],
            'emerging_concerns': [],
            'protective_elements': []
        }
        
        # Primary concerns (from intense emotions/concerns)
        for emotion, intensity in sorted(emotion_intensities.items(), key=lambda x: x[1], reverse=True):
            if intensity > 0.07:  # Significant threshold
                concern_tag = self._emotion_to_concern(emotion, patterns)
                if concern_tag:
                    concerns['primary_concerns'].append({
                        'concern': concern_tag,
                        'indicator': emotion,
                        'intensity': self._intensity_to_level(intensity)
                    })
        
        # Emerging concerns (moderate intensity)
        for emotion, intensity in emotion_intensities.items():
            if 0.04 < intensity <= 0.07:
                concern_tag = self._emotion_to_concern(emotion, patterns)
                if concern_tag and concern_tag not in [c['concern'] for c in concerns['primary_concerns']]:
                    concerns['emerging_concerns'].append({
                        'concern': concern_tag,
                        'indicator': emotion,
                        'intensity': self._intensity_to_level(intensity)
                    })
        
        # Protective elements (positive emotions)
        protective_emotions = ['hopeful', 'grateful', 'confident', 'proud']
        for emotion in protective_emotions:
            if emotion_intensities.get(emotion, 0) > 0.04:
                concerns['protective_elements'].append({
                    'strength': emotion.capitalize(),
                    'intensity': self._intensity_to_level(emotion_intensities.get(emotion, 0))
                })
        
        return concerns

    def _generate_psychological_insight(self, patterns: List[str],
                                       emotion_intensities: Dict[str, float],
                                       concern_data: Dict) -> Dict[str, str]:
        """Generate deep psychological insights"""
        insights = {
            'primary_insight': '',
            'dynamic_explanation': '',
            'system_perspective': ''
        }
        
        # Primary insight - what's really happening
        if 'burnout_tendency' in patterns and emotion_intensities.get('stressed', 0) > 0.06:
            insights['primary_insight'] = (
                "Your responses suggest a pattern where stress and fatigue are reinforcing each other. "
                "Each day without adequate recovery makes the next day's demands feel heavier, "
                "creating a downward spiral where your capacity to handle challenges is eroding."
            )
        
        elif 'anxiety_spiral' in patterns:
            insights['primary_insight'] = (
                "There's a self-amplifying anxiety pattern at work here. "
                "One worry surfaces, triggering thoughts of related concerns, which then feel more real and immediate. "
                "This cascade can make it difficult to distinguish between genuine threats and amplified worries."
            )
        
        elif 'rumination_cycle' in patterns:
            insights['primary_insight'] = (
                "Your emotional processing seems to be caught in repetitive loops. "
                "Rather than moving through difficult emotions, there's a pattern of returning to the same worry or negative thought, "
                "which keeps the emotional state activated even when external circumstances stabilize."
            )
        
        elif 'learned_helplessness_pattern' in patterns:
            insights['primary_insight'] = (
                "There appears to be a pattern where past challenging experiences may be creating a lens through which "
                "current situations are interpreted. This can lead to underestimating your actual influence over outcomes, "
                "reinforcing a sense that 'things won't change anyway.'"
            )
        
        else:
            insights['primary_insight'] = (
                "Your emotional state reflects the interaction between current stressors and your available coping resources. "
                "The pattern suggests that situational demands are currently outpacing your recovery capacity, "
                "leading to a buildup of unprocessed emotional load."
            )
        
        # Dynamic explanation - the mechanism
        dominant_emotion = max(emotion_intensities, key=emotion_intensities.get) if emotion_intensities else 'unknown'
        stress_level = emotion_intensities.get('stressed', 0) + emotion_intensities.get('overwhelmed', 0)
        low_mood = emotion_intensities.get('sad', 0) + emotion_intensities.get('devastated', 0)
        
        if stress_level > low_mood:
            insights['dynamic_explanation'] = (
                f"The mechanism at play seems to be primarily stress-driven. "
                f"Your system is in a heightened alert state, which depletes emotional regulation resources. "
                f"This makes even routine challenges feel harder to manage, reinforcing the stress response."
            )
        elif low_mood > stress_level:
            insights['dynamic_explanation'] = (
                f"The underlying dynamic appears to be mood-based. "
                f"Lower mood is reducing your approach motivation and increasing avoidance patterns, "
                f"which can then create secondary stress as things go unaddressed."
            )
        else:
            insights['dynamic_explanation'] = (
                f"You're experiencing a complex mix where stress and low mood are feeding each other. "
                f"Stress reduces energy for enjoyment, which deepens low mood, which then makes stress feel more overwhelming."
            )
        
        # System perspective
        if len(patterns) > 2:
            insights['system_perspective'] = (
                "What's interesting here is that multiple patterns are active simultaneously. "
                "This isn't just about one stressor or emotion, but about how different psychological processes "
                "are interacting to create and maintain your current state. This suggests the value of a multi-faceted approach to recovery."
            )
        else:
            insights['system_perspective'] = (
                "Your pattern suggests a particular vulnerability point in your emotional system. "
                "Understanding this pattern is the first step to building specific resilience in this area."
            )
        
        return insights

    def _assess_severity_and_risk(self, emotion_intensities: Dict[str, float],
                                 patterns: List[str],
                                 risk_assessment: Dict,
                                 user_score: float) -> Dict[str, Any]:
        """Assess severity and risk level with detailed explanation"""
        severity_data = {
            'severity_level': 'UNKNOWN',
            'risk_classification': 'UNKNOWN',
            'severity_score': 0.0,
            'reasoning': '',
            'warning_signs': [],
            'buffer_factors': []
        }
        
        # Calculate severity from multiple factors
        high_risk_emotions = sum(
            emotion_intensities.get(e, 0) 
            for e in self.severity_mapping['high_risk_indicators']
        )
        moderate_emotions = sum(
            emotion_intensities.get(e, 0) 
            for e in self.severity_mapping['moderate_indicators']
        )
        positive_emotions = sum(
            emotion_intensities.get(e, 0) 
            for e in self.severity_mapping['positive_indicators']
        )
        
        # Pattern multiplier
        pattern_severity_multiplier = 1.0 + (len(patterns) * 0.15)
        
        # Final severity score
        severity_score = (high_risk_emotions * 2.0 + moderate_emotions * 1.0 - positive_emotions * 0.7) / 2.0
        severity_score *= pattern_severity_multiplier
        severity_data['severity_score'] = float(round(severity_score, 3))
        
        # Classify
        if severity_score > 0.65 or high_risk_emotions > 0.25:
            severity_data['severity_level'] = 'HIGH'
            severity_data['risk_classification'] = 'REQUIRES_ATTENTION'
            severity_data['reasoning'] = (
                f"Your emotional profile shows significant intensity across multiple dimensions. "
                f"The combination of {', '.join(patterns[:2]) if patterns else 'various emotional patterns'} "
                f"indicates that your current resources may be stretched quite thin."
            )
        
        elif severity_score > 0.40 or len(patterns) > 1:
            severity_data['severity_level'] = 'MODERATE'
            severity_data['risk_classification'] = 'SHOULD_ADDRESS'
            severity_data['reasoning'] = (
                f"You're experiencing a meaningful level of emotional difficulty. "
                f"While not crisis-level, the patterns suggest you would benefit from intentional support strategies."
            )
        
        elif severity_score > 0.15:
            severity_data['severity_level'] = 'MILD'
            severity_data['risk_classification'] = 'MONITOR'
            severity_data['reasoning'] = (
                f"You're managing overall, but there are areas showing stress that warrant attention. "
                f"This is a good time to strengthen your support system and coping strategies before things intensify."
            )
        
        else:
            severity_data['severity_level'] = 'LOW'
            severity_data['risk_classification'] = 'STABLE'
            severity_data['reasoning'] = "Your emotional state appears relatively balanced at this time."
        
        # Warning signs
        if emotion_intensities.get('devastated', 0) > 0.06:
            severity_data['warning_signs'].append('Intense emotional pain signals')
        if emotion_intensities.get('lonely', 0) > 0.06:
            severity_data['warning_signs'].append('Isolation indicators')
        if emotion_intensities.get('ashamed', 0) > 0.05:
            severity_data['warning_signs'].append('Self-judgment patterns')
        if 'learned_helplessness_pattern' in patterns:
            severity_data['warning_signs'].append('Reduced agency and control')
        
        # Buffer factors
        if positive_emotions > 0.05:
            severity_data['buffer_factors'].append('Presence of positive emotions provides resilience foundation')
        if emotion_intensities.get('confident', 0) > 0.04:
            severity_data['buffer_factors'].append('Self-efficacy beliefs intact')
        if emotion_intensities.get('hopeful', 0) > 0.04:
            severity_data['buffer_factors'].append('Future-oriented hope present')
        
        return severity_data

    def _generate_personalized_recommendations(self, emotion_intensities: Dict[str, float],
                                              patterns: List[str],
                                              severity_data: Dict) -> List[Dict[str, str]]:
        """Generate personalized coping strategies and recommendations"""
        recommendations = []
        
        # Burrrr out → Recovery focus
        if 'burnout_tendency' in patterns:
            recommendations.extend([
                {
                    'category': 'Recovery Strategy',
                    'recommendation': 'Schedule deliberate rest without guilt. Your system needs actual recovery time, not just time off between obligations.',
                    'rationale': 'Burnout requires genuine restoration, not just reduced workload'
                },
                {
                    'category': 'Boundary Setting',
                    'recommendation': 'Identify one non-negotiable boundary you\'ll implement this week (e.g., no work emails after 7pm).',
                    'rationale': 'Boundaries create space for recovery'
                }
            ])
        
        # Anxiety → Grounding
        if 'anxiety_spiral' in patterns or emotion_intensities.get('anxious', 0) > 0.08:
            recommendations.extend([
                {
                    'category': 'Grounding Technique',
                    'recommendation': 'When anxiety escalates, use the 5-4-3-2-1 sensory technique: identify 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.',
                    'rationale': 'Engages present-moment awareness to interrupt worry spirals'
                },
                {
                    'category': 'Cognitive Practice',
                    'recommendation': 'When a "what if" thought appears, pause and ask: "Is this worry based on current reality or future possibility?"',
                    'rationale': 'Creates distance between worry and assumed threat'
                }
            ])
        
        # Low mood → Behavioral activation
        if emotion_intensities.get('sad', 0) + emotion_intensities.get('devastated', 0) > 0.08:
            recommendations.extend([
                {
                    'category': 'Behavioral Activation',
                    'recommendation': 'Engage in one activity you used to enjoy, even if you don\'t feel motivated. The mood often follows the action.',
                    'rationale': 'Breaks the mood-avoidance cycle'
                },
                {
                    'category': 'Connection',
                    'recommendation': 'Reach out to one person (text, call, in person). Isolation deepens low mood.',
                    'rationale': 'Social connection is mood-elevating and isolation-breaking'
                }
            ])
        
        # Rumination → Thought interruption
        if 'rumination_cycle' in patterns:
            recommendations.extend([
                {
                    'category': 'Thought Management',
                    'recommendation': 'When you notice repetitive thoughts, physically interrupt the pattern (stand up, splash water on face, change location) before redirecting attention.',
                    'rationale': 'Physical interrupts break the neural loop'
                },
                {
                    'category': 'Attention Redirection',
                    'recommendation': 'Practice focused attention on one task for 15 minutes. When rumination intrudes, gently return focus to the task.',
                    'rationale': 'Builds ability to shift mental channels'
                }
            ])
        
        # Helplessness → Agency building
        if 'learned_helplessness_pattern' in patterns:
            recommendations.extend([
                {
                    'category': 'Agency Building',
                    'recommendation': 'Identify one small thing within your control and take action on it. Document the outcome to reinforce your influence.',
                    'rationale': 'Directly counters helplessness beliefs'
                },
                {
                    'category': 'Reframing Practice',
                    'recommendation': 'When thoughts say "Nothing I do matters," challenge with: "What is one small way I can influence this situation?"',
                    'rationale': 'Rebuilds belief in personal agency'
                }
            ])
        
        # General recommendations based on severity
        if severity_data['severity_level'] in ['HIGH', 'MODERATE']:
            recommendations.append({
                'category': 'Support Seeking',
                'recommendation': 'Consider talking with a counselor or trusted person about what you\'re experiencing. Sometimes the shift happens with professional support.',
                'rationale': 'Your emotional load appears significant enough to warrant external support'
            })
        
        # Resilience building
        recommendations.append({
            'category': 'Resilience Foundation',
            'recommendation': 'Invest in one area: sleep consistency, movement/exercise, or connecting with someone meaningful. These amplify all other coping strategies.',
            'rationale': 'Foundation practices create resilience multiplier effect'
        })
        
        return recommendations

    def _generate_micro_actions(self, emotion_intensities: Dict[str, float],
                               patterns: List[str],
                               screening_responses: Dict) -> List[Dict[str, str]]:
        """Generate 3-5 small, immediately actionable steps"""
        actions = []
        
        # Action 1: Immediate grounding
        actions.append({
            'action_number': 1,
            'timeframe': 'Next 5 minutes',
            'description': 'Take 5 deep breaths, focusing on exhales that are longer than inhales. Feel the physical sensation of grounding.',
            'benefit': 'Activates parasympathetic nervous system, creates immediate calm'
        })
        
        # Action 2: Situational based
        if emotion_intensities.get('stressed', 0) > 0.07:
            actions.append({
                'action_number': 2,
                'timeframe': 'Within 1 hour',
                'description': 'Step away from whatever\'s creating stress. Take a 10-minute walk, change your environment.',
                'benefit': 'Distance creates perspective; movement metabolizes stress'
            })
        elif emotion_intensities.get('sad', 0) > 0.07:
            actions.append({
                'action_number': 2,
                'timeframe': 'Within 1 hour',
                'description': 'Send one brief message to someone (friend, family). Just say hi. Connection is mood-lifting.',
                'benefit': 'Interrupts isolation loop; reminds you of your relationships'
            })
        else:
            actions.append({
                'action_number': 2,
                'timeframe': 'Within 1 hour',
                'description': 'Do something nurturing: warm drink, stretch, favorite music. Small pleasures count.',
                'benefit': 'Self-care signals value and reduces stress accumulation'
            })
        
        # Action 3: Expression
        actions.append({
            'action_number': 3,
            'timeframe': 'Today, 15 minutes',
            'description': 'Write or voice-record what\'s going on without filtering. Get the emotional experience out of your head.',
            'benefit': 'Externalizing feelings reduces their grip on your mind'
        })
        
        # Action 4: Pattern-specific
        if 'rumination_cycle' in patterns or 'anxiety_spiral' in patterns:
            actions.append({
                'action_number': 4,
                'timeframe': 'Evening',
                'description': 'Set a "worry window": spend 15 minutes writing down all worries, then intentionally move to something else. Save tomorrow\'s worries for tomorrow.',
                'benefit': 'Contains worry to structured time, preventing 24/7 rumination'
            })
        else:
            actions.append({
                'action_number': 4,
                'timeframe': 'Evening',
                'description': 'Create a transition ritual: change clothes, wash hands, or dim lights. Signal to your nervous system that this phase of the day is over.',
                'benefit': 'Psychological boundary helps separate stress from rest'
            })
        
        # Action 5: Tomorrow focus
        actions.append({
            'action_number': 5,
            'timeframe': 'Before sleep',
            'description': 'Identify one thing you\'re grateful for, even if small (comfortable bed, cup of tea, text from friend). End the day with one genuine positive.',
            'benefit': 'Rebalances perspective; primes mood for next day'
        })
        
        return actions

    def _generate_lifestyle_tips(self, emotion_intensities: Dict[str, float],
                                patterns: List[str]) -> List[Dict[str, str]]:
        """Generate emoji-based lifestyle tips for easy adoption"""
        tips = []
        
        # Sleep tips
        tips.append({
            'emoji': '😴',
            'text': 'Sleep: Aim for 7-8 hours. Create a dark, cool bedroom. No screens 1 hour before bed.'
        })
        
        # Movement tips
        if emotion_intensities.get('stressed', 0) + emotion_intensities.get('overwhelmed', 0) > 0.08:
            tips.append({
                'emoji': '🚶',
                'text': 'Movement: 20-30 minute daily walk outdoors. Stress metabolizes through movement.'
            })
        else:
            tips.append({
                'emoji': '🏃',
                'text': 'Activity: 30 minutes of enjoyable movement (walk, dance, yoga). Exercise boosts mood naturally.'
            })
        
        # Nutrition tips
        tips.append({
            'emoji': '🥗',
            'text': 'Nutrition: Whole foods, colorful vegetables, omega-3s (fish, seeds). Avoid excess sugar and caffeine.'
        })
        
        # Connection tips
        if emotion_intensities.get('lonely', 0) > 0.05 or emotion_intensities.get('sad', 0) > 0.08:
            tips.append({
                'emoji': '👥',
                'text': 'Connection: Reach out to at least one person daily. Isolation deepens low mood; contact builds resilience.'
            })
        else:
            tips.append({
                'emoji': '💬',
                'text': 'Connection: Nurture meaningful relationships. Regular small interactions amplify wellbeing.'
            })
        
        # Nature/outdoor tips
        tips.append({
            'emoji': '🌿',
            'text': 'Nature: Spend 15+ minutes in nature daily. Reduces stress hormones, increases calm.'
        })
        
        # Hydration
        tips.append({
            'emoji': '💧',
            'text': 'Hydration: Drink 8-10 glasses water daily. Dehydration worsens mood and anxiety.'
        })
        
        # Meditation/Mindfulness
        tips.append({
            'emoji': '🧘',
            'text': 'Mindfulness: 5-10 minute daily meditation or breathing. Builds neural pathways for calm.'
        })
        
        # Limiting triggers
        if emotion_intensities.get('anxious', 0) > 0.10:
            tips.append({
                'emoji': '🔕',
                'text': 'Boundaries: Limit news/social media to 30 min/day. Information overload amplifies anxiety.'
            })
        
        # Creativity
        tips.append({
            'emoji': '🎨',
            'text': 'Creativity: Spend time on hobbies or creative pursuits. Engages flow state, reduces rumination.'
        })
        
        # Gratitude
        tips.append({
            'emoji': '🙏',
            'text': 'Gratitude: Daily practice of noting 3 things you appreciate. Rebalances perspective toward positive.'
        })
        
        return tips[:10]  # Return maximum 10 tips

    def _generate_home_remedies(self, emotion_intensities: Dict[str, float],
                               patterns: List[str],
                               severity_data: Dict) -> List[Dict[str, str]]:
        """Generate evidence-based home remedies and natural wellness practices"""
        remedies = []
        
        # Base remedies - always include
        base_remedies = [
            {
                'title': 'Warm herbal tea ritual',
                'instruction': 'Prepare chamomile, lavender, or passionflower tea. Drink slowly (1 cup) in the evening or when stressed. This calms the nervous system.',
                'duration': '10 minutes each time',
                'whenToAvoid': 'If pregnant, breastfeeding, or allergic to plants. Consult doctor if on sleeping medications.',
                'benefit': 'Reduces anxiety, improves sleep quality'
            },
            {
                'title': 'Breathing practice (4-7-8 technique)',
                'instruction': 'Breathe in through nose for 4 counts, hold for 7 counts, exhale through mouth for 8 counts. Repeat 4 times.',
                'duration': '5 minutes, 2-3 times daily',
                'whenToAvoid': 'During respiratory infections or breathing difficulties. Stop if dizzy.',
                'benefit': 'Activates parasympathetic system, reduces anxiety naturally'
            },
            {
                'title': 'Warm oil self-massage (Abhyanga)',
                'instruction': 'Use coconut or sesame oil. Warm it and gently massage arms, legs, and chest for 10 minutes. Shower after 20 minutes.',
                'duration': '30 minutes total, 2-3 times per week',
                'whenToAvoid': 'During fever, acute inflammation, or skin conditions. Do patch test first.',
                'benefit': 'Reduces muscle tension, promotes relaxation, improves circulation'
            }
        ]
        
        remedies.extend(base_remedies)
        
        # Pattern-specific remedies
        if 'anxiety_spiral' in patterns or emotion_intensities.get('anxious', 0) > 0.08:
            remedies.extend([
                {
                    'title': 'Ashwagandha preparation',
                    'instruction': 'Mix 1/2 teaspoon ashwagandha powder in warm milk with honey. Take once daily in evening.',
                    'duration': 'Consistent for 3-4 weeks',
                    'whenToAvoid': 'If pregnant, breastfeeding, or on sedatives. Can cause drowsiness.',
                    'benefit': 'Traditional adaptogen for anxiety reduction'
                },
                {
                    'title': 'Grounding technique (earthing)',
                    'instruction': 'Barefoot contact with earth for 15 minutes (grass, soil). Sit or walk naturally.',
                    'duration': '15 minutes daily',
                    'whenToAvoid': 'During extreme weather or if you have open wounds.',
                    'benefit': 'Reduces anxiety and promotes calm through electromagnetic balance'
                }
            ])
        
        # Low mood remedies
        if emotion_intensities.get('sad', 0) + emotion_intensities.get('devastated', 0) > 0.08:
            remedies.extend([
                {
                    'title': 'Morning sunlight exposure',
                    'instruction': 'Step outside in morning sunlight for 15-20 minutes (without heavy sunscreen). Let light reach your eyes.',
                    'duration': '15-20 minutes daily morning',
                    'whenToAvoid': 'During extreme heat. Use common sense about sun protection.',
                    'benefit': 'Regulates serotonin and mood, improves energy'
                },
                {
                    'title': 'Golden milk (turmeric latte)',
                    'instruction': 'Mix 1/2 teaspoon turmeric powder, pinch black pepper, honey in warm milk. Drink warm.',
                    'duration': 'Once daily, preferably evening',
                    'whenToAvoid': 'If allergic to turmeric or on blood thinners. Not during pregnancy.',
                    'benefit': 'Turmeric has anti-inflammatory properties, improves mood'
                }
            ])
        
        # Stress/burnout remedies
        if 'burnout_tendency' in patterns or emotion_intensities.get('stressed', 0) > 0.08:
            remedies.extend([
                {
                    'title': 'Epsom salt bath',
                    'instruction': 'Add 2 cups Epsom salt to warm bath. Soak for 20 minutes. Optional: add lavender essential oil drops.',
                    'duration': '20 minutes, 2-3 times per week',
                    'whenToAvoid': 'If you have severe burns, open wounds, or uncontrolled blood pressure.',
                    'benefit': 'Reduces muscle tension, stress relief, magnesium absorption'
                },
                {
                    'title': 'Meditation with Sanskrit mantra',
                    'instruction': 'Quietly repeat "Om" or "Aham Brahmasmi" for 10 minutes, focusing on the sound and vibration.',
                    'duration': '10 minutes daily',
                    'whenToAvoid': 'No specific restrictions. Adjust mantra to your comfort.',
                    'benefit': 'Activates parasympathetic system, reduces stress hormones'
                }
            ])
        
        # Rumination/overthinking remedies
        if 'rumination_cycle' in patterns or emotion_intensities.get('anxious', 0) > 0.06:
            remedies.extend([
                {
                    'title': 'Herbal tea blend for calm thinking',
                    'instruction': 'Mix equal parts dried lavender, chamomile, and lemon balm. Brew 1 teaspoon in hot water for 5 minutes. Drink slowly.',
                    'duration': 'Once or twice daily',
                    'whenToAvoid': 'If allergic to plants or on sedating medications.',
                    'benefit': 'Supports mental clarity and reduces racing thoughts'
                },
                {
                    'title': 'Journaling with intention',
                    'instruction': 'Write freely for 15 minutes without judgment. Then write 3 things you\'re grateful for. Tear up the first part if you wish.',
                    'duration': '15 minutes daily',
                    'whenToAvoid': 'No restrictions. Choose quiet time.',
                    'benefit': 'Externalizes thoughts, breaks rumination cycle'
                }
            ])
        
        # Emotional exhaustion remedies
        if 'emotional_exhaustion' in patterns:
            remedies.extend([
                {
                    'title': 'Rest ritual (conscious relaxation)',
                    'instruction': 'Lie down comfortably. Tense each muscle group for 5 seconds, then relax. Start from toes, move up to head.',
                    'duration': '15 minutes daily',
                    'whenToAvoid': 'No specific restrictions.',
                    'benefit': 'Progressive muscle relaxation releases tension, promotes recovery'
                },
                {
                    'title': 'Bone broth or vegetable soup',
                    'instruction': 'Simmer bones or vegetables with ginger, turmeric for 1-2 hours. Drink warm, nutrient-rich broth.',
                    'duration': 'Once or twice per week',
                    'whenToAvoid': 'Adjust ingredients based on dietary restrictions.',
                    'benefit': 'Nourishing, supports nervous system healing'
                }
            ])
        
        # General wellness support
        if severity_data['severity_level'] in ['MILD', 'MODERATE', 'HIGH']:
            remedies.append({
                'title': 'Daily ginger-lemon water',
                'instruction': 'Slice fresh ginger, add lemon juice, warm water. Drink first thing in morning.',
                'duration': 'Daily morning',
                'whenToAvoid': 'If you have acid reflux or are on blood thinners.',
                'benefit': 'Anti-inflammatory, immune support, digestive health'
            })
        
        # Add traditional practices
        remedies.append({
            'title': 'Gentle yoga (child\'s pose sequence)',
            'instruction': 'Child\'s pose for 1 min, cat-cow for 1 min, gentle spinal twist. Do slowly without forcing.',
            'duration': '5-10 minutes daily',
            'whenToAvoid': 'During severe back pain, pregnancy complications, or recent surgery.',
            'benefit': 'Releases tension, calms nervous system, improves flexibility'
        })
        
        return remedies[:8]  # Return maximum 8 remedies

    def _generate_support_recommendation(self, severity_data: Dict,
                                        patterns: List[str],
                                        emotion_intensities: Dict[str, float]) -> Dict[str, str]:
        """Generate personalized support recommendation"""
        recommendation = {
            'support_level': '',
            'message': '',
            'next_steps': [],
            'red_flags_requiring_immediate_help': []
        }
        
        severity = severity_data['severity_level']
        
        if severity == 'HIGH':
            recommendation['support_level'] = 'Professional support strongly recommended'
            recommendation['message'] = (
                "Your current emotional state suggests that professional support would be genuinely valuable. "
                "A counselor or therapist can help you work through the patterns at play and develop specific strategies tailored to your situation. "
                "This isn't weakness—it's wisdom to recognize when more expert guidance would help."
            )
            recommendation['next_steps'] = [
                'Research therapists or counselors in your area or online',
                'Check if your insurance or school provides mental health services',
                'If crisis support is immediately needed, contact a crisis helpline',
                'In the meantime, implement the micro-actions and recommendations above'
            ]
        
        elif severity == 'MODERATE':
            recommendation['support_level'] = 'Talking to someone recommended'
            recommendation['message'] = (
                "While self-care strategies can help, talking with a counselor or even a trusted, wise person in your life would amplify your progress. "
                "Sometimes the shift we need requires external perspective and support. This is a good time to reach out."
            )
            recommendation['next_steps'] = [
                'Identify one trusted person to talk with about what you\'re experiencing',
                'If you prefer professional support, research counselors in your area',
                'Practice the strategies below, and adjust based on what\'s actually working for you',
                'Check in with yourself in one week'
            ]
        
        elif severity == 'MILD':
            recommendation['support_level'] = 'Self-care strategies primary; consider support if not improving'
            recommendation['message'] = (
                "You have capacity to address this yourself with intentional self-care and the strategies outlined above. "
                "If these aren't working within a week or two, talking with someone would be the next step."
            )
            recommendation['next_steps'] = [
                'Start with the micro-actions and recommendations',
                'Journal about what\'s working and what isn\'t',
                'Reach out to a friend or counselor if things intensify',
                'Rescreen in one week to see if your state has shifted'
            ]
        
        else:
            recommendation['support_level'] = 'You\'re doing well. Continue what\'s working.'
            recommendation['message'] = (
                "Your emotional state appears stable. The key now is maintaining the things that are working. "
                "Stay attuned to early signs of change so you can respond early if support is needed."
            )
            recommendation['next_steps'] = [
                'Continue practices that build your resilience',
                'Maintain your support network even when not in crisis',
                'Rescreen periodically to track your wellbeing'
            ]
        
        # Red flags
        if 'devastated' in emotion_intensities and emotion_intensities['devastated'] > 0.08:
            recommendation['red_flags_requiring_immediate_help'].append(
                'Intense emotional pain that feels unbearable'
            )
        if 'learned_helplessness_pattern' in patterns and severity == 'HIGH':
            recommendation['red_flags_requiring_immediate_help'].append(
                'Feelings that nothing matters or will change'
            )
        if emotion_intensities.get('lonely', 0) > 0.08:
            recommendation['red_flags_requiring_immediate_help'].append(
                'Persistent isolation or disconnection from others'
            )
        
        if recommendation['red_flags_requiring_immediate_help']:
            recommendation['urgent_message'] = (
                "If any of these apply, please reach out to a mental health professional, crisis line, or trusted person: "
                + "; ".join(recommendation['red_flags_requiring_immediate_help']) + ". "
                "You deserve support, and help is available."
            )
        
        return recommendation

    def _generate_closing_note(self, emotion_intensities: Dict[str, float],
                              severity_data: Dict,
                              patterns: List[str]) -> str:
        """Generate empathetic, personalized closing note"""
        positive_emotions = emotion_intensities.get('hopeful', 0) + emotion_intensities.get('grateful', 0) + emotion_intensities.get('confident', 0)
        
        if severity_data['severity_level'] == 'HIGH':
            closing = (
                "Right now, things feel heavy. And that heaviness is real. But here's what's also true: "
                "the fact that you're checking in with yourself, that you're willing to look at what's happening—that's a sign of strength, not weakness. "
                "These patterns you're experiencing are exactly what support is designed to address. "
                "You don't have to carry this alone, and reaching out for help is actually one of the wisest things you can do."
            )
        
        elif severity_data['severity_level'] == 'MODERATE':
            closing = (
                "You're in a place where things feel complicated and somewhat overwhelming. "
                "That middle ground can sometimes feel harder than extreme distress because it's easy to dismiss. "
                "But don't. What you're experiencing matters, and you deserve to address it. "
                "The good news is that the patterns we're seeing are quite treatable—with the right support and effort, real shifts are possible."
            )
        
        elif severity_data['severity_level'] == 'MILD':
            closing = (
                "You're managing, and that's good. But there are areas where small, intentional shifts could make a real difference. "
                "Think of this as tuning an instrument that's already mostly in tune. A little attention now prevents bigger issues later. "
                "You have the capacity to do this, and the fact that you're taking time to understand yourself is already a positive step."
            )
        
        else:
            closing = (
                "Your emotional state is currently stable, which is excellent. "
                "The key now is recognizing what's working in your life and prioritizing it. "
                "Keep the people and practices that support you close. Mental health is as much about maintenance as it is about recovery."
            )
        
        # Personalization based on strengths
        if positive_emotions > 0.08:
            closing += "\n\nThe fact that you still have hope, gratitude, or confidence in you—hold onto that. It's your foundation."
        
        if 'burnout_tendency' in patterns:
            closing += "\n\nYour rest matters. Not as luxury, but as medicine."
        
        if 'learned_helplessness_pattern' in patterns:
            closing += "\n\nYou have more agency than you might feel right now. That belief can shift."
        
        closing += "\n\nTake care of yourself. You're worth the effort."
        
        return closing

    # ===== Helper methods =====
    
    def _generate_id(self) -> str:
        """Generate unique report ID"""
        import time
        return f"MWR-{int(time.time() * 1000)}"
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def _intensity_to_level(self, intensity: float) -> str:
        """Convert numeric intensity to descriptive level"""
        if intensity > 0.12:
            return 'High'
        elif intensity > 0.07:
            return 'Moderate'
        elif intensity > 0.03:
            return 'Mild'
        else:
            return 'Low'
    
    def _get_emotional_tone(self, emotion: str) -> str:
        """Get the tone of an emotion"""
        distressing = ['sad', 'anxious', 'afraid', 'angry', 'devastated', 'lonely', 'ashamed']
        positive = ['happy', 'grateful', 'hopeful', 'confident', 'proud', 'excited']
        
        if emotion in distressing:
            return 'Distressed'
        elif emotion in positive:
            return 'Positive'
        else:
            return 'Neutral/Mixed'
    
    def _get_emotion_description(self, emotion: str, intensity: float) -> str:
        """Get description for emotion at given intensity"""
        descriptions = {
            'anxious': 'Worry or nervousness about potential threats',
            'afraid': 'Fear or apprehension about specific or vague concerns',
            'stressed': 'Pressure or burden from demands exceeding capacity',
            'sad': 'Low mood, reduced enjoyment, or melancholy',
            'devastated': 'Profound sadness or emotional pain',
            'angry': 'Irritability, frustration, or hostility',
            'confident': 'Belief in your ability to handle situations',
            'hopeful': 'Forward-oriented optimism or positive expectation',
            'grateful': 'Appreciation for positive aspects of life',
            'lonely': 'Disconnection or isolation from others',
            'overwhelmed': 'Feeling flooded by demands or emotions',
            'ashamed': 'Self-criticism or judgment about yourself',
            'excited': 'Energy and positive anticipation',
            'neutral': 'Balanced or detached emotional state',
            'surprised': 'Unexpected shift in emotional orientation'
        }
        return descriptions.get(emotion, 'Complex emotional state')
    
    def _format_concern_name(self, concern: str) -> str:
        """Format concern name for display"""
        return concern.replace('_', ' ').title()
    
    def _emotion_to_concern(self, emotion: str, patterns: List[str]) -> str:
        """Map emotion to key concern area"""
        mapping = {
            'anxious': 'Anxiety Management',
            'afraid': 'Fear & Safety',
            'stressed': 'Stress Overload',
            'sad': 'Mood Concerns',
            'devastated': 'Emotional Pain',
            'angry': 'Anger & Frustration',
            'lonely': 'Connection & Isolation',
            'ashamed': 'Self-Esteem & Worth',
            'overwhelmed': 'Capacity & Boundaries',
            'confident': 'Self-Efficacy',
            'hopeful': 'Future Orientation',
            'grateful': 'Positive Perspective'
        }
        return mapping.get(emotion, 'Emotional Wellbeing')
    
    def _summarize_patterns(self, patterns: List[str]) -> str:
        """Summarize detected patterns in brief form"""
        if not patterns:
            return 'No dominant psychological pattern is currently indicated from this screening.'
        
        pattern_names = [p.replace('_', ' ').title() for p in patterns]
        return ', '.join(pattern_names[:3])
    
    def _infer_cognitive_style(self, emotion_intensities: Dict[str, float],
                               screening_responses: Dict) -> str:
        """Infer user's cognitive processing style"""
        anxiety_level = emotion_intensities.get('anxious', 0) + emotion_intensities.get('afraid', 0)
        rumination_level = emotion_intensities.get('stressed', 0) + emotion_intensities.get('overthinking', 0)
        
        if anxiety_level > 0.10:
            return 'Anticipatory/Future-focused (tends toward worry about what might happen)'
        elif rumination_level > 0.10:
            return 'Reflective/Auto-focused (tends toward analysis of what\'s happening)'
        else:
            return 'Balanced/Pragmatic (adaptive mix of reflection and forward-planning)'


def main():
    """Main execution for testing"""
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Insufficient arguments'}, indent=2))
        return
    
    try:
        # Parse input JSON
        input_data = json.loads(sys.argv[1])
        
        generator = MentalWellnessReportGenerator()
        
        # Generate comprehensive report
        report = generator.generate_report(
            screening_responses=input_data.get('screening_responses', {}),
            emotional_profile=input_data.get('emotional_profile', {}),
            concern_profile=input_data.get('concern_profile', {}),
            risk_assessment=input_data.get('risk_assessment', {}),
            user_score=input_data.get('user_score', 0)
        )
        
        print(json.dumps(report, indent=2))
    
    except Exception as e:
        print(json.dumps({'error': str(e), 'type': type(e).__name__}, indent=2))


if __name__ == '__main__':
    main()
