#!/usr/bin/env python3
"""
Train emotion classifier model from emotion-emotion_69k dataset
Outputs trained model to: models/emotion_classifier_model.joblib
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os
from pathlib import Path

# Create models directory if not exists
os.makedirs('models', exist_ok=True)

# Map emotions to mental health concerns
EMOTION_TO_CONCERNS = {
    'sentimental': ['low_mood', 'burnout'],
    'afraid': ['anxiety', 'overwhelm'],
    'proud': [],  # positive
    'faithful': [],  # positive
    'terrified': ['anxiety', 'high_concern'],
    'joyful': [],  # positive
    'angry': ['overwhelm', 'focus_issues'],
    'sad': ['low_mood', 'fatigue'],
    'surprised': [],
    'grateful': [],
    'love': [],
    'frustated': ['focus_issues', 'overwhelm'],  # typo in original data
    'nervous': ['anxiety', 'focus_issues'],
    'hopeful': [],  # positive
    'excited': [],  # positive
    'anxious': ['anxiety', 'overwhelm'],
    'ashamed': ['low_mood', 'overwhelm'],
    'guilty': ['low_mood'],
    'disgust': ['overwhelm'],
    'apprehensive': ['anxiety'],
    'concerned': ['anxiety'],
    'confident': [],  # positive
    'content': [],  # positive
    'devastated': ['low_mood', 'high_concern'],
    'remorseful': ['low_mood'],
}

def load_dataset(csv_path):
    """Load and prepare dataset"""
    print(f"Loading dataset from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    # Clean up
    df = df.dropna(subset=['Situation', 'emotion'])
    df['Situation'] = df['Situation'].astype(str).str.strip()
    df['emotion'] = df['emotion'].astype(str).str.strip().str.lower()
    
    # Filter to emotions we have mappings for
    df = df[df['emotion'].isin(EMOTION_TO_CONCERNS.keys())]
    
    print(f"Dataset shape: {df.shape}")
    print(f"Unique emotions: {df['emotion'].nunique()}")
    print(f"Emotion distribution:\n{df['emotion'].value_counts()}")
    
    return df

def create_concern_labels(emotion_series):
    """Convert emotion labels to concern labels"""
    concern_labels = []
    for emotion in emotion_series:
        concerns = EMOTION_TO_CONCERNS.get(emotion, [])
        # Join concerns or mark as neutral
        label = '|'.join(concerns) if concerns else 'neutral'
        concern_labels.append(label)
    return concern_labels

def train_emotion_classifier(csv_path):
    """Train the emotion classification model"""
    
    # Load dataset
    df = load_dataset(csv_path)
    
    X = df['Situation'].values
    y_emotion = df['emotion'].values
    y_concern = create_concern_labels(y_emotion)
    
    print(f"\nConcern distribution:")
    concern_df = pd.Series(y_concern)
    print(concern_df.value_counts())
    
    # Split data
    X_train, X_test, y_train, y_test, y_concern_train, y_concern_test = train_test_split(
        X, y_emotion, y_concern,
        test_size=0.2,
        random_state=42,
        stratify=y_emotion
    )
    
    print(f"\nTraining set size: {len(X_train)}")
    print(f"Test set size: {len(X_test)}")
    
    # Create pipeline: TF-IDF + Random Forest
    print("\nTraining emotion classifier pipeline...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.8,
            stop_words='english'
        )),
        ('classifier', RandomForestClassifier(
            n_estimators=100,
            max_depth=20,
            random_state=42,
            n_jobs=-1
        ))
    ])
    
    # Train
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\nModel Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save model and mapping
    model_path = 'models/emotion_classifier_model.joblib'
    print(f"\nSaving model to {model_path}...")
    joblib.dump(pipeline, model_path)
    
    # Save metadata
    metadata = {
        'emotions': sorted(df['emotion'].unique().tolist()),
        'emotion_to_concerns': EMOTION_TO_CONCERNS,
        'accuracy': float(accuracy),
        'model_type': 'TfidfVectorizer + RandomForestClassifier'
    }
    joblib.dump(metadata, 'models/emotion_classifier_metadata.joblib')
    
    print(f"Model saved successfully!")
    print(f"Model path: {model_path}")
    print(f"Metadata saved: models/emotion_classifier_metadata.joblib")
    
    return pipeline, metadata

def test_model(pipeline, test_texts):
    """Test the model with sample texts"""
    print("\n" + "="*60)
    print("Testing model on sample inputs:")
    print("="*60)
    
    for text in test_texts:
        emotion = pipeline.predict([text])[0]
        probs = pipeline.predict_proba([text])[0]
        confidence = max(probs)
        concerns = EMOTION_TO_CONCERNS.get(emotion, [])
        
        print(f"\nText: {text[:80]}...")
        print(f"Predicted Emotion: {emotion}")
        print(f"Confidence: {confidence:.2%}")
        print(f"Mapped Concerns: {concerns}")

if __name__ == '__main__':
    # Dataset path
    dataset_path = r'c:\Users\satya\Downloads\MediTatva-main (5)\MediTatva-main\archive (4)\emotion-emotion_69k.csv'
    
    # Train model
    pipeline, metadata = train_emotion_classifier(dataset_path)
    
    # Test on sample texts
    test_samples = [
        "I've been feeling really sad and hopeless lately. Nothing interests me anymore.",
        "I'm so anxious about my upcoming presentation. My heart is racing.",
        "I'm really proud of what I've accomplished this year.",
        "I can't sleep at night because I keep worrying about everything.",
    ]
    
    test_model(pipeline, test_samples)
    
    print("\n✅ Training complete!")
