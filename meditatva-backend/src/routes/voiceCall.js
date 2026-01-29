const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const axios = require('axios');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const speechToTextApiKey = process.env.GOOGLE_SPEECH_API_KEY;
const textToSpeechApiKey = process.env.GOOGLE_TTS_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

const client = twilio(accountSid, authToken);
const VoiceResponse = twilio.twiml.VoiceResponse;

// Store active call sessions
const callSessions = new Map();

// Store active conference sessions
const conferenceSessions = new Map();

// Initiate outbound call
router.post('/initiate-call', async (req, res) => {
  try {
    const { phoneNumber, patientName } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Check if we have a public URL
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    
    if (backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1')) {
      return res.status(400).json({ 
        error: 'Public URL required', 
        message: 'Twilio requires a public URL. Please use ngrok or deploy to a public server.',
        instructions: 'Run: ngrok http 3000, then set BACKEND_URL to the ngrok URL in .env'
      });
    }

    const call = await client.calls.create({
      url: `${backendUrl}/api/voice-call/handle-call`,
      to: phoneNumber,
      from: twilioPhoneNumber,
      statusCallback: `${backendUrl}/api/voice-call/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    });

    console.log(`✅ Call initiated to ${phoneNumber}, CallSid: ${call.sid}`);
    console.log(`📞 Webhook URL: ${backendUrl}/api/voice-call/handle-call`);

    callSessions.set(call.sid, {
      patientName: patientName || 'Patient',
      conversationHistory: [],
      startTime: new Date()
    });

    res.json({ 
      success: true, 
      callSid: call.sid,
      message: 'Call initiated successfully'
    });
  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({ error: 'Failed to initiate call', details: error.message });
  }
});

// Handle incoming call (Twilio webhook)
router.post('/handle-call', async (req, res) => {
  console.log('🎤 HANDLE-CALL webhook received:', req.body.CallSid);
  console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
  
  const twiml = new VoiceResponse();
  const callSid = req.body.CallSid;
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  
  // Welcome message with longer timeout
  const gather = twiml.gather({
    input: 'speech',
    action: `${backendUrl}/api/voice-call/process-speech`,
    method: 'POST',
    speechTimeout: 'auto',
    timeout: 10,
    language: 'hi-IN',
    profanityFilter: false,
    speechModel: 'phone_call',
    enhanced: true,
    hints: 'bukhar,fever,headache,dard,pain,medicine,doctor,symptoms,pet dard,sar dard,cough,cold,thanda,garam'
  });

  gather.say(
    {
      voice: 'Polly.Aditi',
      language: 'hi-IN'
    },
    'Namaste. Main Medi Call Sarthi hoon. Mujhe apni samasya batayein. Jaise, mujhe bukhar hai, ya sar dard hai. Main aapki baat sun rahi hoon.'
  );

  // Fallback - ask again instead of hanging up
  twiml.say(
    { voice: 'Polly.Aditi', language: 'hi-IN' },
    'Koi response nahi mila. Kripya ek baar phir se bolein.'
  );
  twiml.redirect(`${backendUrl}/api/voice-call/handle-call`);

  console.log('📤 Sending TwiML response');
  res.type('text/xml');
  res.send(twiml.toString());
});

// Process speech input
router.post('/process-speech', async (req, res) => {
  console.log('🗣️ PROCESS-SPEECH webhook received!');
  console.log('📋 Full request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const speechResult = req.body.SpeechResult;
    const callSid = req.body.CallSid;
    const confidence = parseFloat(req.body.Confidence || 0);
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

    console.log(`🎯 Speech: "${speechResult}" | Confidence: ${confidence} | CallSid: ${callSid}`);

    if (!speechResult || confidence < 0.3) {
      const twiml = new VoiceResponse();
      twiml.say(
        { voice: 'Polly.Aditi', language: 'hi-IN' },
        'Mujhe samajh nahi aaya. Kripya phir se thoda loud bolein.'
      );
      twiml.redirect(`${backendUrl}/api/voice-call/handle-call`);
      return res.type('text/xml').send(twiml.toString());
    }

    // Get session
    let session = callSessions.get(callSid) || {
      conversationHistory: [],
      patientName: 'Patient'
    };

    // Check for emergency keywords
    const emergencyKeywords = ['chest pain', 'breathing', 'suicide', 'bleeding', 'heart attack', 'stroke'];
    const isEmergency = emergencyKeywords.some(keyword => 
      speechResult.toLowerCase().includes(keyword)
    );

    if (isEmergency) {
      const twiml = new VoiceResponse();
      twiml.say(
        { voice: 'Polly.Aditi', language: 'hi-IN' },
        'Yeh emergency situation lag rahi hai. Kripya turant najdeeki hospital jaayein ya ambulance ko 102 par call karein. Apna khayal rakhein.'
      );
      twiml.hangup();
      return res.type('text/xml').send(twiml.toString());
    }

    // Add to conversation history
    session.conversationHistory.push({
      role: 'user',
      content: speechResult
    });

    // Get AI response from Gemini
    console.log('🤖 Calling Gemini AI for response...');
    const aiResponse = await getGeminiResponse(speechResult, session.conversationHistory);
    console.log('✅ AI Response received:', aiResponse);

    // Add AI response to history
    session.conversationHistory.push({
      role: 'assistant',
      content: aiResponse
    });

    // Update session
    callSessions.set(callSid, session);

    // Create TwiML response
    const twiml = new VoiceResponse();
    
    // Say the AI response first
    twiml.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      aiResponse
    );
    
    // Then ask if they have more questions
    const gather = twiml.gather({
      input: 'speech',
      action: `${backendUrl}/api/voice-call/process-speech`,
      method: 'POST',
      speechTimeout: 'auto',
      timeout: 8,
      language: 'hi-IN',
      profanityFilter: false,
      speechModel: 'phone_call',
      enhanced: true
    });

    gather.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      'Kya aapko kuch aur poochna hai? Agar nahi, to bas chup rahein.'
    );

    // Fallback - thank and hang up
    twiml.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      'Dhanyavaad. Apna khayal rakhein.'
    );
    twiml.hangup();

    res.type('text/xml');
    res.send(twiml.toString());

  } catch (error) {
    console.error('Error processing speech:', error);
    const twiml = new VoiceResponse();
    twiml.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      'Mujhe kuch technical problem ho rahi hai. Kripya thodi der baad dobara koshish karein.'
    );
    twiml.hangup();
    res.type('text/xml').send(twiml.toString());
  }
});

// Initiate conference call - Host gets called first
router.post('/initiate-conference', async (req, res) => {
  try {
    const { phoneNumber, conferenceName } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Your phone number is required to start conference' });
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    
    if (backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1')) {
      return res.status(400).json({ 
        error: 'Public URL required', 
        message: 'Twilio requires a public URL. Please use ngrok or deploy to a public server.'
      });
    }

    const confName = conferenceName || `MediConf-${Date.now()}`;
    
    // Initialize conference session
    conferenceSessions.set(confName, {
      hostNumber: phoneNumber,
      participants: [],
      conversationHistory: [],
      startTime: new Date(),
      aiJoined: false
    });

    // Call the host first
    const call = await client.calls.create({
      url: `${backendUrl}/api/voice-call/conference-host?conferenceName=${encodeURIComponent(confName)}`,
      to: phoneNumber,
      from: twilioPhoneNumber,
      statusCallback: `${backendUrl}/api/voice-call/conference-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    });
    
    conferenceSessions.get(confName).participants.push({
      phoneNumber,
      callSid: call.sid,
      status: 'calling',
      role: 'host'
    });

    console.log(`✅ Conference ${confName} initiated - calling host ${phoneNumber}`);

    res.json({ 
      success: true, 
      conferenceName: confName,
      callSid: call.sid,
      message: 'Conference started - you will receive a call',
      addParticipantUrl: `${backendUrl}/api/voice-call/add-to-conference`
    });
  } catch (error) {
    console.error('Error initiating conference:', error);
    res.status(500).json({ error: 'Failed to initiate conference', details: error.message });
  }
});

// Add participant to existing conference
router.post('/add-to-conference', async (req, res) => {
  try {
    const { conferenceName, phoneNumber, participantName } = req.body;

    if (!conferenceName || !phoneNumber) {
      return res.status(400).json({ error: 'Conference name and phone number required' });
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

    if (!conferenceSessions.has(conferenceName)) {
      return res.status(404).json({ error: 'Conference not found or already ended' });
    }

    // Call the new participant
    const call = await client.calls.create({
      url: `${backendUrl}/api/voice-call/join-conference?conferenceName=${encodeURIComponent(conferenceName)}`,
      to: phoneNumber,
      from: twilioPhoneNumber,
      statusCallback: `${backendUrl}/api/voice-call/conference-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    });

    const session = conferenceSessions.get(conferenceName);
    session.participants.push({
      phoneNumber,
      callSid: call.sid,
      status: 'calling',
      role: 'participant',
      name: participantName
    });

    console.log(`✅ Added ${phoneNumber} to conference ${conferenceName}`);

    res.json({
      success: true,
      message: `Calling ${participantName || phoneNumber}`,
      callSid: call.sid
    });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ error: 'Failed to add participant', details: error.message });
  }
});

// Conference host endpoint - first person to join
router.post('/conference-host', async (req, res) => {
  const conferenceName = req.query.conferenceName;
  const callSid = req.body.CallSid;
  
  console.log(`🎤 Host joining conference: ${conferenceName}, CallSid: ${callSid}`);
  
  const twiml = new VoiceResponse();
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

  twiml.say(
    { voice: 'Polly.Aditi', language: 'hi-IN' },
    'Namaste. Aap Medi Conference Call mein hain. Aap koi bhi medical question pooch sakte hain. Jab aap ready hain, aap apne friends ya family ko is conference mein add kar sakte hain.'
  );

  // Join conference with AI listening
  const dial = twiml.dial();
  dial.conference({
    startConferenceOnEnter: true,
    endConferenceOnExit: true,
    waitUrl: '',
    statusCallback: `${backendUrl}/api/voice-call/conference-event`,
    statusCallbackEvent: ['start', 'end', 'join', 'leave']
  }, conferenceName);

  res.type('text/xml');
  res.send(twiml.toString());
});

// Join conference call
router.post('/join-conference', async (req, res) => {
  const conferenceName = req.query.conferenceName;
  const callSid = req.body.CallSid;
  
  console.log(`🎤 Participant joining conference: ${conferenceName}, CallSid: ${callSid}`);
  
  const twiml = new VoiceResponse();
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

  twiml.say(
    { voice: 'Polly.Aditi', language: 'hi-IN' },
    'Namaste. Aap Medi Call Sarthi conference call mein shamil ho rahe hain. Kripya pratiksha karein.'
  );

  // Join conference with AI assistant
  const dial = twiml.dial();
  dial.conference({
    startConferenceOnEnter: true,
    endConferenceOnExit: false,
    waitUrl: `${backendUrl}/api/voice-call/conference-wait`,
    statusCallback: `${backendUrl}/api/voice-call/conference-event`,
    statusCallbackEvent: ['start', 'end', 'join', 'leave', 'mute', 'hold', 'speaker']
  }, conferenceName);

  res.type('text/xml');
  res.send(twiml.toString());
});

// Conference wait music/message
router.post('/conference-wait', (req, res) => {
  const twiml = new VoiceResponse();
  
  twiml.say(
    { voice: 'Polly.Aditi', language: 'hi-IN', loop: 3 },
    'Kripya pratiksha karein. Baaki participants jald hi shamil honge.'
  );
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Conference event handler
router.post('/conference-event', async (req, res) => {
  const event = req.body.StatusCallbackEvent;
  const conferenceName = req.body.FriendlyName;
  const callSid = req.body.CallSid;
  
  console.log(`📞 Conference ${conferenceName} - Event: ${event}, CallSid: ${callSid}`);

  if (event === 'conference-start' && conferenceSessions.has(conferenceName)) {
    const session = conferenceSessions.get(conferenceName);
    
    // Add AI assistant when conference starts (only once)
    if (!session.aiJoined) {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      
      try {
        await client.calls.create({
          url: `${backendUrl}/api/voice-call/ai-participant?conferenceName=${encodeURIComponent(conferenceName)}`,
          from: twilioPhoneNumber,
          to: twilioPhoneNumber,
          statusCallback: `${backendUrl}/api/voice-call/conference-status`
        });
        
        session.aiJoined = true;
        console.log(`🤖 AI assistant added to conference ${conferenceName}`);
      } catch (error) {
        console.error('Error adding AI to conference:', error);
      }
    }
  }

  if (event === 'participant-join' && conferenceSessions.has(conferenceName)) {
    const session = conferenceSessions.get(conferenceName);
    const participant = session.participants.find(p => p.callSid === callSid);
    if (participant) {
      participant.status = 'joined';
    }
  }

  if (event === 'participant-leave' && conferenceSessions.has(conferenceName)) {
    const session = conferenceSessions.get(conferenceName);
    const participant = session.participants.find(p => p.callSid === callSid);
    if (participant) {
      participant.status = 'left';
    }
  }

  res.sendStatus(200);
});

// AI participant handler
router.post('/ai-participant', async (req, res) => {
  const conferenceName = req.query.conferenceName;
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  
  console.log(`🤖 AI joining conference: ${conferenceName}`);
  
  const twiml = new VoiceResponse();
  
  // Greet all participants
  twiml.say(
    { voice: 'Polly.Aditi', language: 'hi-IN' },
    'Namaste sabhi ko. Main Medi Call Sarthi hoon. Aap sabhi apne medical questions pooch sakte hain. Ek baar mein ek vyakti bolein.'
  );

  // Join conference and listen
  const dial = twiml.dial();
  const conference = dial.conference({
    startConferenceOnEnter: false,
    endConferenceOnExit: false,
    waitUrl: '',
    statusCallback: `${backendUrl}/api/voice-call/conference-event`,
    statusCallbackEvent: ['start', 'end', 'join', 'leave']
  }, conferenceName);

  // Gather speech from anyone in conference
  const gather = twiml.gather({
    input: 'speech',
    action: `${backendUrl}/api/voice-call/process-conference-speech?conferenceName=${encodeURIComponent(conferenceName)}`,
    method: 'POST',
    speechTimeout: 'auto',
    timeout: 10,
    language: 'hi-IN,en-IN',
    profanityFilter: false,
    speechModel: 'phone_call',
    enhanced: true
  });

  gather.say(
    { voice: 'Polly.Aditi', language: 'hi-IN' },
    'Aap apna question pooch sakte hain.'
  );

  res.type('text/xml');
  res.send(twiml.toString());
});

// Process speech from conference
router.post('/process-conference-speech', async (req, res) => {
  console.log('🗣️ CONFERENCE SPEECH received!');
  console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const speechResult = req.body.SpeechResult;
    const conferenceName = req.query.conferenceName;
    const callSid = req.body.CallSid;
    const confidence = parseFloat(req.body.Confidence || 0);
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

    console.log(`🎯 Conference: ${conferenceName} | Speech: "${speechResult}" | Confidence: ${confidence}`);

    if (!speechResult || confidence < 0.3) {
      const twiml = new VoiceResponse();
      twiml.say(
        { voice: 'Polly.Aditi', language: 'hi-IN' },
        'Mujhe samajh nahi aaya. Kripya phir se thoda loud bolein.'
      );
      twiml.redirect(`${backendUrl}/api/voice-call/ai-participant?conferenceName=${encodeURIComponent(conferenceName)}`);
      return res.type('text/xml').send(twiml.toString());
    }

    // Get or create conference session
    let session = conferenceSessions.get(conferenceName) || {
      participants: [],
      conversationHistory: [],
      startTime: new Date()
    };

    // Check for emergency
    const emergencyKeywords = ['chest pain', 'breathing', 'suicide', 'bleeding', 'heart attack', 'stroke', 'emergency', 'ambulance'];
    const isEmergency = emergencyKeywords.some(keyword => 
      speechResult.toLowerCase().includes(keyword)
    );

    if (isEmergency) {
      const twiml = new VoiceResponse();
      twiml.say(
        { voice: 'Polly.Aditi', language: 'hi-IN' },
        'Yeh emergency situation hai. Sabhi participants kripya turant 102 par ambulance call karein ya najdeeki hospital jaayein.'
      );
      
      // Continue conference, don't hang up
      twiml.redirect(`${backendUrl}/api/voice-call/ai-participant?conferenceName=${encodeURIComponent(conferenceName)}`);
      return res.type('text/xml').send(twiml.toString());
    }

    // Add to conversation history
    session.conversationHistory.push({
      role: 'user',
      content: speechResult,
      timestamp: new Date(),
      callSid: callSid
    });

    // Get AI response
    console.log('🤖 Getting Gemini response for conference...');
    const aiResponse = await getGeminiResponse(speechResult, session.conversationHistory);
    console.log('✅ AI Response:', aiResponse);

    // Add AI response to history
    session.conversationHistory.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    // Update session
    conferenceSessions.set(conferenceName, session);

    // Respond to everyone in conference
    const twiml = new VoiceResponse();
    
    twiml.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      aiResponse
    );
    
    // Ask for more questions
    twiml.pause({ length: 1 });
    twiml.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      'Koi aur question? Koi bhi bol sakta hai.'
    );
    
    // Continue listening
    twiml.redirect(`${backendUrl}/api/voice-call/ai-participant?conferenceName=${encodeURIComponent(conferenceName)}`);

    res.type('text/xml');
    res.send(twiml.toString());

  } catch (error) {
    console.error('❌ Error processing conference speech:', error);
    const twiml = new VoiceResponse();
    twiml.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      'Maaf kijiye, technical problem hai. Phir se boliye.'
    );
    twiml.redirect(`${backendUrl}/api/voice-call/ai-participant?conferenceName=${encodeURIComponent(req.query.conferenceName)}`);
    res.type('text/xml').send(twiml.toString());
  }
});

// Conference status callback
router.post('/conference-status', (req, res) => {
  const callSid = req.body.CallSid;
  const callStatus = req.body.CallStatus;
  
  console.log(`Conference call ${callSid} status: ${callStatus}`);

  if (callStatus === 'completed' || callStatus === 'failed') {
    // Check if this was the last participant
    for (const [confName, session] of conferenceSessions.entries()) {
      const participant = session.participants.find(p => p.callSid === callSid);
      if (participant) {
        participant.status = 'completed';
        
        // If all participants left, clean up
        const allLeft = session.participants.every(p => 
          p.status === 'completed' || p.status === 'left' || p.status === 'failed'
        );
        
        if (allLeft) {
          console.log(`🧹 Cleaning up conference ${confName}`);
          conferenceSessions.delete(confName);
        }
      }
    }
  }

  res.sendStatus(200);
});

// Call status callback
router.post('/call-status', (req, res) => {
  const callSid = req.body.CallSid;
  const callStatus = req.body.CallStatus;
  
  console.log(`Call ${callSid} status: ${callStatus}`);

  if (callStatus === 'completed' || callStatus === 'failed' || callStatus === 'busy' || callStatus === 'no-answer') {
    // Clean up session
    callSessions.delete(callSid);
  }

  res.sendStatus(200);
});

// Get AI response from Gemini
async function getGeminiResponse(userMessage, conversationHistory) {
  try {
    console.log('📞 Generating AI response for:', userMessage);
    
    const systemPrompt = `You are Medi Call Sarthi, a Hindi-speaking medical assistant on a phone call.

Rules:
- Answer in HINDI only
- Keep response to 2-3 complete sentences
- Be helpful and caring
- Give practical advice
- Suggest doctor if serious

Patient says: ${userMessage}

Give a complete helpful response in Hindi:`;

    console.log('🔄 Sending request to Gemini...');
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 8000,
          topP: 0.95,
          topK: 40
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      }
    );

    console.log('✅ Gemini response received');
    console.log('Full response data:', JSON.stringify(response.data, null, 2));
    
    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response structure from Gemini');
    }
    
    const aiText = response.data.candidates[0].content.parts[0].text;
    console.log('📝 Raw AI text:', aiText);
    
    // Clean up response for voice (remove markdown, asterisks, etc.)
    let cleanedText = aiText
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, ' ')
      .trim();

    // Ensure we have complete sentences
    if (!cleanedText.endsWith('.') && !cleanedText.endsWith('।') && !cleanedText.endsWith('?')) {
      cleanedText += '.';
    }

    console.log('🔊 Final cleaned response:', cleanedText);
    return cleanedText;
  } catch (error) {
    console.error('❌ Error getting Gemini response:', error.message);
    console.error('Full error:', error.response?.data || error);
    return 'Maaf kijiye, mujhe technical problem ho rahi hai. Agar symptoms continue ho rahe hain, toh kripya doctor se consult karein.';
  }
}

module.exports = router;
