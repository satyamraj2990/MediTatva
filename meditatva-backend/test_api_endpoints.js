const http = require('http');

// Test 1: Health check
console.log('Testing /api/emotion/health...');
http.get('http://localhost:3000/api/emotion/health', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log('Health Check Response:', data);
  });
}).on('error', (e) => {
  console.error('Health check error:', e.message);
});

// Test 2: Wellness Report
setTimeout(() => {
  console.log('\nTesting /api/emotion/wellness-report...');
  const testData = JSON.stringify({
    screeningResponses: { q1: 3, q2: 4, q3: 3, q4: 4, q5: 3, q6: 2, q7: 4 },
    emotionalProfile: {
      primary_emotion: 'anxious',
      top_5_emotions: [
        { emotion: 'anxious', score: 0.15 },
        { emotion: 'stressed', score: 0.12 }
      ]
    },
    concernProfile: {
      work_pressure: { intensity: 'high' },
      sleep_issues: { intensity: 'moderate' }
    },
    riskAssessment: { overall_risk_score: 0.62 },
    userScore: 62
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/emotion/wellness-report',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      const response = JSON.parse(data);
      console.log('Wellness Report Status Code:', res.statusCode);
      console.log('Sections in report:', Object.keys(response).length);
      console.log('Has support_recommendation:', !!response.support_recommendation);
      console.log('Has closing_note:', !!response.closing_note);
      if (response.overall_mental_state) {
        console.log('Overall State Narrative (first 100 chars):', response.overall_mental_state.narrative?.substring(0, 100));
      }
      process.exit(0);
    });
  }).on('error', (e) => {
    console.error('Wellness report error:', e.message);
    process.exit(1);
  });

  req.write(testData);
  req.end();
}, 1000);
