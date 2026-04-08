#!/usr/bin/env python
"""Test report generator with sample data"""

import json
import sys
from src.ml.report_generator import MentalWellnessReportGenerator

# Read test data
with open('test_report_data.json', 'r') as f:
    data = json.load(f)

# Generate report
generator = MentalWellnessReportGenerator()
report = generator.generate_report(
    screening_responses=data['screening_responses'],
    emotional_profile=data['emotional_profile'],
    concern_profile=data['concern_profile'],
    risk_assessment=data['risk_assessment'],
    user_score=data['user_score']
)

# Print formatted report
print(json.dumps(report, indent=2))
