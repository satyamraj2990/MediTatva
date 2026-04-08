const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');

// ════════════════════════════════════════════════════════════════════
// SIMPLE VOICE ASSISTANT - NO TWILIO, BROWSER-BASED
// ════════════════════════════════════════════════════════════════════

const geminiApiKey = process.env.GEMINI_API_KEY || '';

// Rate limiting for Gemini API
const geminiRateLimit = {
  calls: [],
  maxCallsPerMinute: 15,
  isAllowed() {
    const now = Date.now();
    this.calls = this.calls.filter(time => now - time < 60000);
    if (this.calls.length >= this.maxCallsPerMinute) {
      return false;
    }
    this.calls.push(now);
    return true;
  }
};

// ═══ PROCESS VOICE QUERY ═══
router.post('/query', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  🎙️  VOICE ASSISTANT - QUERY PROCESSING                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    const { query, conversationHistory = [] } = req.body;
    
    console.log(`🗣️  User Query: "${query}"`);
    console.log(`📜 History: ${conversationHistory.length} messages`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    
    // Validate query
    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }
    
    // Check rate limit
    if (!geminiRateLimit.isAllowed()) {
      console.warn('⚠️  Rate limit exceeded');
      return res.json({
        success: true,
        message: 'High traffic detected. Returned guided fallback response.',
        response: getFallbackResponse(query),
        rateLimited: true,
        timestamp: new Date().toISOString()
      });
    }
    
    // Generate AI response
    let aiResponse = '';
    
    try {
      aiResponse = await generateMedicalResponse(query, conversationHistory);
      console.log(`✅ AI Response generated (${aiResponse.length} chars)`);
      console.log(`📝 Preview: ${aiResponse.substring(0, 100)}...`);
      
    } catch (aiError) {
      console.error('❌ AI Error:', aiError.message);
      // Fallback to keyword-based response
      aiResponse = getFallbackResponse(query);
      console.log('📝 Using fallback response');
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`⏱️  Total processing time: ${processingTime}ms`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    res.json({
      success: true,
      response: aiResponse,
      processingTime: processingTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR in voice assistant:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      response: 'I am facing a temporary technical issue. Please try again in a few moments. If this is urgent, call 108/102 or contact a nearby doctor.'
    });
  }
});

// ════════════════════════════════════════════════════════════════════
// AI RESPONSE GENERATION
// ════════════════════════════════════════════════════════════════════
async function generateMedicalResponse(userQuery, conversationHistory = []) {
  const startTime = Date.now();
  
  console.log('🤖 Calling Gemini AI...');
  
  if (!geminiApiKey || geminiApiKey === 'your_key_here') {
    throw new Error('Gemini API key not configured');
  }
  
  // Build context from conversation history
  let contextText = '';
  if (conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-4); // Last 2 exchanges
    contextText = recentHistory.map(msg => 
      `${msg.role === 'user' ? 'Patient' : 'MediSaarthi'}: ${msg.text}`
    ).join('\n');
  }
  
  // Medical AI Prompt (English only)
  const systemPrompt = `You are MediSaarthi, a friendly AI health assistant for Indian users.

RULES:
1. ALWAYS answer in clear, simple ENGLISH only.
2. Keep response SHORT (4-6 sentences max)
3. Be conversational and friendly
4. Format as SPOKEN PARAGRAPH (no bullets, no lists)
5. Cover: likely cause + practical relief tips + medicine info (if relevant) + when to see a doctor
6. If user expresses emotional distress (frustrated, anxious, sad, stressed), include grounding steps and when to seek professional mental health support.
7. If user suggests self-harm thoughts, include immediate emergency instruction: call 108/102 now.
8. If user mentions multiple symptoms, address EACH symptom explicitly in the same answer.

USER QUERY: "${userQuery}"

${contextText ? `\nRECENT CONVERSATION:\n${contextText}\n` : ''}

RESPOND IN ENGLISH:`;

  const modelCandidates = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash'
  ];

  try {
    let aiText = '';
    let lastError = null;

    for (const modelName of modelCandidates) {
      try {
        console.log(`🔄 Trying Gemini model: ${modelName}`);

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`,
          {
            contents: [{
              parts: [{ text: systemPrompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 400,
              topP: 0.9,
              topK: 40
            },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
          },
          {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
          }
        );

        const modelText = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!modelText) {
          throw new Error(`Invalid AI response structure from ${modelName}`);
        }

        aiText = modelText;
        console.log(`✅ Gemini model succeeded: ${modelName}`);
        break;
      } catch (modelError) {
        lastError = modelError;
        console.warn(`⚠️ Gemini model failed: ${modelName} - ${modelError.message}`);
      }
    }

    if (!aiText) {
      throw lastError || new Error('All Gemini models failed');
    }

    const responseTime = Date.now() - startTime;
    console.log(`⏱️  Gemini API responded in ${responseTime}ms`);
    
    // Clean formatting for voice
    aiText = aiText
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Limit length for voice output
    if (aiText.length > 1000) {
      const truncated = aiText.substring(0, 950);
      const lastPeriod = truncated.lastIndexOf('.');
      aiText = lastPeriod > 700 ? truncated.substring(0, lastPeriod + 1) : truncated + '...';
    }

    // If Gemini returns too little or clearly incomplete content, provide actionable fallback guidance.
    const cleaned = aiText.trim();
    const looksIncomplete = !/[.!?]$/.test(cleaned);
    const sentenceCount = cleaned.split(/[.!?]+/).filter(Boolean).length;
    const queryTokens = String(userQuery)
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 3);
    const mentionsQueryTerm = queryTokens.some((t) => cleaned.toLowerCase().includes(t));

    if (cleaned.length < 80 || sentenceCount < 2 || (looksIncomplete && !mentionsQueryTerm)) {
      console.warn('⚠️ Gemini response low quality/incomplete, using structured fallback response');
      return getFallbackResponse(userQuery);
    }
    
    return aiText;
    
  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════════════
// FALLBACK RESPONSES (when AI fails)
// ════════════════════════════════════════════════════════════════════
function getFallbackResponse(query) {
  const queryLower = query.toLowerCase();

  const firstSentence = (text) => {
    const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
    const parts = cleaned.split(/(?<=[.!?])\s+/);
    return parts[0] || cleaned;
  };
  
  // Common symptoms with fallback responses
  const fallbacks = {
    depression: 'You are not alone. If you feel low or overwhelmed, try 5 rounds of 4-7-8 breathing, drink water, and talk to someone you trust today. If low mood, sleep, or appetite changes persist for more than 2 weeks, consult a psychologist or psychiatrist. If you have thoughts of self-harm, call 108/102 immediately or go to the nearest emergency room.',

    tired: 'Feeling tired can happen due to poor sleep, stress, dehydration, low nutrition, thyroid issues, anemia, or overwork. Start with hydration, light meals with protein, 20-30 minutes of rest, and a proper sleep routine tonight. If fatigue continues beyond a week, get a medical checkup including CBC, thyroid profile, and blood sugar tests.',

    pain: 'Pain in joints or muscles can come from strain, overuse, inflammation, or posture issues. Rest the affected area, avoid heavy activity for 24-48 hours, use a cold pack in the first day and warm compress later, and consider simple pain relief if suitable for you. If pain is severe, swelling increases, movement is limited, or symptoms continue beyond 3-5 days, consult an orthopedic doctor.',

    headache: 'For headache, rest in a quiet room, hydrate well, and reduce screen exposure for a while. You may take paracetamol 500 mg if suitable for you. If headache is severe, frequent, or lasts more than 2-3 days, consult a doctor promptly.',

    fever: 'For fever, rest well, drink fluids, and monitor temperature every 4-6 hours. You may use paracetamol as advised on the label if suitable for you. If fever is above 102°F, lasts more than 3 days, or has breathing issues, see a doctor urgently.',

    stomach: 'For stomach discomfort, eat light food, avoid oily/spicy meals, and stay hydrated. ORS, curd rice, or banana can help mild irritation. If pain is severe, persistent, or with vomiting/fever, consult a doctor.',

    cough: 'For cough, drink warm fluids, avoid cold irritants, and consider steam inhalation. Honey with warm water may help if appropriate. If cough lasts more than a week or includes breathlessness/chest pain, get medical care.',

    cold: 'For common cold, rest, hydrate, and use steam inhalation for congestion. Usually it improves in 3-5 days. If symptoms worsen or fever and breathing trouble appear, see a doctor.',

    diabetes: 'For diabetes, follow regular monitoring, balanced meals, and daily physical activity. Avoid high sugar/refined foods and continue prescribed medication. Consult your doctor for individualized treatment goals and dose changes.',

    bp: 'For blood pressure control, reduce salt, maintain regular walking, manage stress, and sleep well. Check BP regularly and continue prescribed medicines. Seek medical review if readings remain high or symptoms appear.',

    thyroid: 'For thyroid issues, take prescribed medication consistently and get periodic thyroid tests. Maintain a balanced diet and regular follow-up. Do not change dosage without your doctor\'s advice.'
  };

  const fallbackAliases = {
    depression: ['depress', 'depressed', 'depression', 'sad', 'anxious', 'anxiety', 'stress', 'tension', 'frustrated', 'frustration', 'fraustrated', 'overwhelmed', 'panic', 'hopeless'],
    tired: ['tired', 'fatigue', 'fatigued', 'exhausted', 'weak', 'low energy', 'drained', 'sleepy'],
    pain: ['pain', 'joint pain', 'knee', 'back pain', 'ankle', 'shoulder', 'elbow', 'neck pain', 'muscle pain', 'sprain', 'strain'],
    headache: ['headache', 'sir dard', 'sar dard', 'sir', 'sar', 'migraine'],
    fever: ['fever', 'bukhar', 'temperature'],
    stomach: ['stomach', 'pet', 'acidity', 'gas', 'nausea', 'vomit'],
    cough: ['cough', 'khansi', 'coughing'],
    cold: ['cold', 'thanda', 'sardi', 'runny nose'],
    diabetes: ['diabetes', 'sugar', 'shakkar', 'blood sugar'],
    bp: ['bp', 'blood pressure', 'hypertension'],
    thyroid: ['thyroid', 'tsh']
  };
  
  const matchedKeys = [];
  for (const [keyword] of Object.entries(fallbacks)) {
    const aliases = fallbackAliases[keyword] || [keyword];
    if (aliases.some(alias => alias && queryLower.includes(alias))) {
      matchedKeys.push(keyword);
    }
  }

  const hasDistress = matchedKeys.includes('depression');
  const hasTired = matchedKeys.includes('tired');
  const hasPain = matchedKeys.includes('pain');

  // Blend common mixed queries instead of repeating the same static fallback.
  const hasFever = matchedKeys.includes('fever');
  const hasStomach = matchedKeys.includes('stomach');
  const hasCough = matchedKeys.includes('cough') || matchedKeys.includes('cold');

  if (hasDistress && hasTired && hasPain && hasFever) {
    return 'It sounds like you are under emotional stress, low on energy, and also dealing with body pain plus fever. Start with hydration, light food with protein, and 10 minutes of slow breathing, then reduce workload and take short movement breaks. For fever, monitor temperature every 4-6 hours and use paracetamol only if suitable for you; for knee or muscle pain, avoid overuse for 24-48 hours and use cold/warm compress as needed. If symptoms continue beyond 24-48 hours, or fever stays high, consult a doctor for CBC/thyroid/sugar and infection evaluation; add mental health support if stress remains high. If you feel unsafe or have self-harm thoughts, call 108/102 immediately.';
  }

  if (hasDistress && hasTired && hasPain) {
    return 'It sounds like you are under emotional stress, low on energy, and also dealing with body pain. Start with hydration, light food with protein, and 10 minutes of slow breathing, then reduce workload and take short movement breaks. For knee or muscle pain, avoid overuse for 24-48 hours and use cold/warm compress as needed. If fatigue, mood symptoms, or pain continue for more than a week, consult a physician for CBC/thyroid/sugar tests and also consider mental health support. If you feel unsafe or have self-harm thoughts, call 108/102 immediately.';
  }

  if (hasDistress && hasPain) {
    return 'It sounds like stress is affecting both your mood and body comfort. Use 5-10 minutes of deep breathing, reduce mental load for a few hours, and rest the painful area with cold then warm compress. Stay hydrated, avoid overexertion, and keep sleep timing consistent tonight. If pain worsens, swelling appears, or stress remains intense for several days, consult a doctor and mental health professional for complete support. If you feel unsafe or have self-harm thoughts, call 108/102 immediately.';
  }

  if (hasDistress && hasTired) {
    return 'It sounds like you are emotionally drained and physically tired. Start with hydration, one light balanced meal, and 10 minutes of slow breathing (4-7-8 pattern), then reduce stress load for the next few hours. Try to sleep on time tonight and avoid excess caffeine. If low mood or fatigue continues for more than 1-2 weeks, consult a psychologist/psychiatrist and a physician for basic tests like CBC, thyroid, and blood sugar. If you feel unsafe or have self-harm thoughts, call 108/102 immediately.';
  }

  if (hasTired && hasPain) {
    return 'Your tiredness and body pain can be linked to overwork, poor sleep, dehydration, or strain. Focus on hydration, light nutrition, and 20-30 minutes of rest, and avoid heavy activity for the painful area for 1-2 days. Use cold/warm compress and gentle stretching if tolerated. If pain limits movement or fatigue persists beyond a week, consult a doctor for detailed evaluation including CBC, thyroid, and sugar tests.';
  }

  // Generic multi-symptom blending for any other 2+ detected categories.
  if (matchedKeys.length >= 2) {
    const uniqueKeys = [...new Set(matchedKeys)].slice(0, 3);
    const blendedCore = uniqueKeys
      .map((k) => firstSentence(fallbacks[k]))
      .join(' ');
    let addOn = '';
    if (hasFever) addOn += ' Monitor temperature regularly and seek care if fever stays high. ';
    if (hasStomach) addOn += ' Keep meals light and avoid spicy/oily food for now. ';
    if (hasCough) addOn += ' Warm fluids and steam can help cough/cold symptoms. ';
    return `I can see multiple concerns in your query (${uniqueKeys.join(', ')}). ${blendedCore} ${addOn}If symptoms worsen or continue beyond 24-48 hours, consult a doctor for a proper evaluation.`.replace(/\s+/g, ' ').trim();
  }

  if (matchedKeys.length > 0) {
    return fallbacks[matchedKeys[0]];
  }
  
  // Generic fallback for unknown queries: still provide actionable guidance.
  const sanitizedQuery = query.substring(0, 80);
  return `I understand your concern about "${sanitizedQuery}". As an immediate step, rest, stay hydrated, avoid self-medicating with strong prescription drugs, and monitor your symptoms for the next few hours. If you have warning signs such as chest pain, breathing difficulty, high persistent fever, fainting, confusion, severe dehydration, or worsening pain, seek urgent medical care now. If symptoms continue beyond 24-48 hours, consult a doctor for a proper diagnosis and treatment plan.`;
}

// ═══ TEST ENDPOINT ═══
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Voice Assistant API is operational',
    geminiConfigured: !!geminiApiKey && geminiApiKey !== 'your_key_here',
    features: [
      'Browser-based voice recognition',
      'AI medical responses in Hindi/Hinglish',
      'No Twilio - completely free',
      'Real-time conversation'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
