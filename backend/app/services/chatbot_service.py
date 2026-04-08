from app.models.schemas import MoodInsights


def detect_mood(message: str) -> MoodInsights:
    text = message.lower()

    low_words = ["sad", "depressed", "hopeless", "cry", "lonely", "anxious", "stress"]
    positive_words = ["happy", "good", "better", "calm", "great", "relaxed"]

    low_hits = sum(1 for word in low_words if word in text)
    positive_hits = sum(1 for word in positive_words if word in text)

    if low_hits > positive_hits:
        return MoodInsights(
            mood="Low Mood",
            confidence=min(0.95, 0.55 + 0.1 * low_hits),
            supportive_tip="Try a 2-minute breathing pause and message one trusted person today.",
        )

    if positive_hits > low_hits:
        return MoodInsights(
            mood="Positive",
            confidence=min(0.95, 0.55 + 0.1 * positive_hits),
            supportive_tip="Keep this momentum by writing one gratitude note tonight.",
        )

    return MoodInsights(
        mood="Neutral",
        confidence=0.6,
        supportive_tip="Share one specific feeling, and I can offer a more targeted suggestion.",
    )


def generate_reply(message: str, mood: MoodInsights) -> str:
    if mood.mood == "Low Mood":
        return (
            "I hear you. Based on what you shared, it sounds emotionally heavy right now. "
            "You are not alone, and we can take this one step at a time. "
            "Would you like a quick grounding routine?"
        )

    if mood.mood == "Positive":
        return (
            "That is great to hear. You seem to be in a steadier space right now. "
            "If you want, I can suggest one small routine to sustain this mood."
        )

    return (
        "Thanks for sharing. I can help with mood tracking, stress coping ideas, "
        "or a short daily check-in. Tell me what you want to focus on."
    )
