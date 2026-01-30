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

// Initialize Twilio client only if credentials are properly configured
let client = null;
if (accountSid && accountSid.startsWith('AC') && authToken) {
  client = twilio(accountSid, authToken);
}
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

    console.log(`📞 Initiating call to: ${phoneNumber}`);
    console.log(`🌐 Using webhook URL: ${backendUrl}/api/voice-call/handle-call`);
    console.log(`📱 From number: ${twilioPhoneNumber}`);

    const call = await client.calls.create({
      url: `${backendUrl}/api/voice-call/handle-call`,
      to: phoneNumber,
      from: twilioPhoneNumber,
      statusCallback: `${backendUrl}/api/voice-call/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    });

    console.log(`✅ Call initiated successfully to ${phoneNumber}`);
    console.log(`📋 Call SID: ${call.sid}`);
    console.log(`📊 Call Status: ${call.status}`);

    callSessions.set(call.sid, {
      patientName: patientName || 'Patient',
      conversationHistory: [],
      startTime: new Date()
    });

    res.json({ 
      success: true, 
      callSid: call.sid,
      status: call.status,
      message: 'Call initiated successfully. You will receive a call shortly.'
    });
  } catch (error) {
    console.error('❌ Error initiating call:', error.message);
    console.error('📋 Error details:', error);
    
    // Check for specific Twilio errors
    let errorMessage = 'Failed to initiate call';
    let errorType = 'unknown';
    
    if (error.message && error.message.includes('unverified')) {
      errorType = 'unverified_number';
      errorMessage = 'Phone number not verified for Twilio trial account';
    } else if (error.message && error.message.includes('not valid')) {
      errorType = 'invalid_number';
      errorMessage = 'Invalid phone number format';
    } else if (error.code === 21201) {
      errorType = 'invalid_number';
      errorMessage = 'Invalid phone number';
    } else if (error.code === 21212) {
      errorType = 'invalid_country';
      errorMessage = 'Invalid phone number format or country code';
    } else if (error.code === 21608) {
      errorType = 'unverified_number';
      errorMessage = 'Unverified number - Twilio trial account limitation';
    }
    
    res.status(400).json({ 
      success: false,
      error: errorMessage,
      errorType: errorType,
      details: error.message,
      twilioCode: error.code || null,
      help: errorType === 'unverified_number' 
        ? 'Trial accounts can only call verified numbers. Verify your number at: https://www.twilio.com/console/phone-numbers/verified'
        : null
    });
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
    language: 'en-IN',
    profanityFilter: false,
    speechModel: 'phone_call',
    enhanced: true,
    hints: 'fever,headache,pain,medicine,doctor,symptoms,cough,cold,bukhar,dard,thanda,garam'
  });

  gather.say(
    {
      voice: 'Polly.Aditi',
      language: 'en-IN'
    },
    'Hello, I am Medi Call Sarthi, your AI medical voice assistant. Please tell me your health concern.'
  );

  // Fallback - ask again instead of hanging up
  twiml.say(
    { voice: 'Polly.Aditi', language: 'en-IN' },
    'No response received. Please speak again.'
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

  // Greet the host
  twiml.say(
    { voice: 'Polly.Aditi', language: 'hi-IN' },
    'Namaste! Aap Medi Saarthi Conference Call mein hain. Main aapka medical assistant hoon. Aap aur aapke friends ya family ke members, sabhi log apne medical questions pooch sakte hain. Main sabka jawab dungi.'
  );

  twiml.pause({ length: 1 });

  // Join conference with AI listening and continuous interaction
  const dial = twiml.dial();
  const conf = dial.conference({
    startConferenceOnEnter: true,
    endConferenceOnExit: true,
    waitUrl: '',
    beep: false,
    coach: callSid, // Allow this participant to hear everything
    statusCallback: `${backendUrl}/api/voice-call/conference-event`,
    statusCallbackEvent: ['start', 'end', 'join', 'leave', 'speaker']
  }, conferenceName);

  // After joining, immediately start listening for questions
  twiml.say(
    { voice: 'Polly.Aditi', language: 'hi-IN' },
    'Aap apna question pooch sakte hain.'
  );
  
  // Redirect to speech processing for continuous interaction
  twiml.redirect(`${backendUrl}/api/voice-call/conference-listen?conferenceName=${encodeURIComponent(conferenceName)}&callSid=${callSid}`);

  res.type('text/xml');
  res.send(twiml.toString());
});

// Join conference call - for additional participants
router.post('/join-conference', async (req, res) => {
  const conferenceName = req.query.conferenceName;
  const callSid = req.body.CallSid;
  
  console.log(`🎤 Participant joining conference: ${conferenceName}, CallSid: ${callSid}`);
  
  const twiml = new VoiceResponse();
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

  twiml.say(
    { voice: 'Polly.Aditi', language: 'hi-IN' },
    'Namaste! Aap Medi Saarthi conference call mein shamil ho rahe hain. Main sabhi participants ke questions ka jawab dungi.'
  );

  // Join conference
  const dial = twiml.dial();
  dial.conference({
    startConferenceOnEnter: false, // Don't start for participants
    endConferenceOnExit: false,
    beep: 'false',
    statusCallback: `${backendUrl}/api/voice-call/conference-event`,
    statusCallbackEvent: ['start', 'end', 'join', 'leave', 'speaker']
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

// Conference listen - continuous speech gathering for all participants
router.post('/conference-listen', async (req, res) => {
  const conferenceName = req.query.conferenceName;
  const callSid = req.query.callSid || req.body.CallSid;
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  
  console.log(`👂 Conference ${conferenceName} - Listening for speech from any participant`);
  
  const twiml = new VoiceResponse();
  
  // Gather speech from anyone in the conference
  const gather = twiml.gather({
    input: 'speech',
    action: `${backendUrl}/api/voice-call/process-conference-speech?conferenceName=${encodeURIComponent(conferenceName)}`,
    method: 'POST',
    speechTimeout: 'auto',
    timeout: 5,
    language: 'hi-IN,en-IN',
    profanityFilter: false,
    speechModel: 'phone_call',
    enhanced: true,
    hints: 'bukhar,fever,headache,dard,pain,medicine,doctor,symptoms,pet dard,sar dard,cough,cold,diabetes,blood pressure'
  });

  gather.pause({ length: 2 });

  // If no speech detected, loop back
  twiml.say(
    { voice: 'Polly.Aditi', language: 'hi-IN' },
    'Koi aur question? Sabhi log pooch sakte hain.'
  );
  twiml.redirect(`${backendUrl}/api/voice-call/conference-listen?conferenceName=${encodeURIComponent(conferenceName)}&callSid=${callSid}`);
  
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

// Process speech from conference - responds to all participants
router.post('/process-conference-speech', async (req, res) => {
  console.log('🗣️ CONFERENCE SPEECH received from any participant!');
  console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const speechResult = req.body.SpeechResult;
    const conferenceName = req.query.conferenceName;
    const callSid = req.body.CallSid;
    const confidence = parseFloat(req.body.Confidence || 0);
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

    console.log(`🎯 Conference: ${conferenceName} | Speaker: ${callSid} | Speech: "${speechResult}" | Confidence: ${confidence}`);

    if (!speechResult || confidence < 0.3) {
      const twiml = new VoiceResponse();
      twiml.say(
        { voice: 'Polly.Aditi', language: 'hi-IN' },
        'Mujhe samajh nahi aaya. Jo bhi bola, kripya phir se thoda loud aur clear bolein.'
      );
      twiml.redirect(`${backendUrl}/api/voice-call/conference-listen?conferenceName=${encodeURIComponent(conferenceName)}&callSid=${callSid}`);
      return res.type('text/xml').send(twiml.toString());
    }

    // Get or create conference session
    let session = conferenceSessions.get(conferenceName) || {
      participants: [],
      conversationHistory: [],
      startTime: new Date()
    };

    // Check for goodbye/end keywords
    const endKeywords = ['bye', 'goodbye', 'thank you', 'dhanyavaad', 'alvida', 'shukriya', 'khatam', 'end'];
    const wantsToEnd = endKeywords.some(keyword => 
      speechResult.toLowerCase().includes(keyword)
    );

    if (wantsToEnd && speechResult.split(' ').length <= 3) {
      const twiml = new VoiceResponse();
      twiml.say(
        { voice: 'Polly.Aditi', language: 'hi-IN' },
        'Dhanyavaad sabhi ko! Apna aur apne family ka khayal rakhein. Agar zaroorat ho toh doctor se milein. Namaste!'
      );
      twiml.hangup();
      return res.type('text/xml').send(twiml.toString());
    }

    // Check for emergency
    const emergencyKeywords = ['chest pain', 'breathing problem', 'sans nahi aa rahi', 'dil ka dard', 'bleeding', 'heart attack', 'stroke', 'emergency', 'ambulance', 'behosh', 'unconscious'];
    const isEmergency = emergencyKeywords.some(keyword => 
      speechResult.toLowerCase().includes(keyword)
    );

    if (isEmergency) {
      const twiml = new VoiceResponse();
      twiml.say(
        { voice: 'Polly.Aditi', language: 'hi-IN' },
        'Yeh emergency situation lag raha hai! Sabhi participants kripya turant 102 par ambulance call karein ya najdeeki hospital jaayein. Deri mat karein!'
      );
      
      // Continue conference for other questions
      twiml.pause({ length: 2 });
      twiml.redirect(`${backendUrl}/api/voice-call/conference-listen?conferenceName=${encodeURIComponent(conferenceName)}&callSid=${callSid}`);
      return res.type('text/xml').send(twiml.toString());
    }

    // Add to conversation history with caller identification
    session.conversationHistory.push({
      role: 'user',
      content: speechResult,
      timestamp: new Date(),
      callSid: callSid,
      participantNumber: session.participants.findIndex(p => p.callSid === callSid) + 1
    });

    // Get AI response with conference context
    console.log('🤖 Getting Gemini response for conference question...');
    const contextMessage = `Conference call with ${session.participants.length} participants. Question: ${speechResult}`;
    const aiResponse = await getGeminiResponse(contextMessage, session.conversationHistory);
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
    
    // Acknowledge the speaker and answer
    twiml.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      aiResponse
    );
    
    // Pause and ask for more questions from anyone
    twiml.pause({ length: 1 });
    twiml.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      'Koi aur question? Sabhi log pooch sakte hain.'
    );
    
    // Continue listening for more questions
    twiml.redirect(`${backendUrl}/api/voice-call/conference-listen?conferenceName=${encodeURIComponent(conferenceName)}&callSid=${callSid}`);

    res.type('text/xml');
    res.send(twiml.toString());

  } catch (error) {
    console.error('❌ Error processing conference speech:', error);
    const twiml = new VoiceResponse();
    twiml.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      'Maaf kijiye, technical problem hai. Koi aur question? Phir se boliye.'
    );
    twiml.redirect(`${backendUrl}/api/voice-call/conference-listen?conferenceName=${encodeURIComponent(req.query.conferenceName)}&callSid=${req.body.CallSid}`);
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
    
    const systemPrompt = `You are **Medi Call Sarthi**, an AI-powered medical voice assistant designed ONLY for phone call interactions with patients.

You DO NOT support text chat.
You interact exclusively through spoken conversation during an outbound or inbound phone call.

━━━━━━━━━━━━━━━━━━━━━━
🎯 CORE PURPOSE
━━━━━━━━━━━━━━━━━━━━━━
- Assist patients who receive a phone call from the system.
- Understand spoken health concerns.
- Respond with safe, clear, and empathetic voice replies.
- Provide general medical guidance — NOT diagnosis or prescriptions.

━━━━━━━━━━━━━━━━━━━━━━
🎙️ VOICE-FIRST BEHAVIOR
━━━━━━━━━━━━━━━━━━━━━━
- Responses must be **short, clear, and conversational** (2-3 sentences maximum).
- Use simple language suitable for phone calls.
- Avoid long explanations.
- Speak naturally, as if talking to a real patient.
- Always pause-friendly sentences.

━━━━━━━━━━━━━━━━━━━━━━
🌐 MULTI-LANGUAGE VOICE SUPPORT
━━━━━━━━━━━━━━━━━━━━━━
- Automatically detect the caller's spoken language.
- Reply in the SAME language.
- Support Indian languages including:
  Hindi, English, Tamil, Telugu, Kannada, Malayalam,
  Marathi, Gujarati, Bengali, Punjabi.
- Default to Hindi if language is unclear.

━━━━━━━━━━━━━━━━━━━━━━
🧠 MEDICAL SAFETY RULES (STRICT)
━━━━━━━━━━━━━━━━━━━━━━
You MUST NEVER:
❌ Diagnose a disease
❌ Prescribe medicines or dosages
❌ Claim to replace a doctor or hospital

You MAY:
✅ Explain symptoms at a general, educational level
✅ Suggest basic self-care (rest, hydration, food habits)
✅ Mention medicine substitutes ONLY by category
✅ Encourage consulting a qualified doctor when needed

━━━━━━━━━━━━━━━━━━━━━━
🩺 SYMPTOM HANDLING FLOW (VOICE)
━━━━━━━━━━━━━━━━━━━━━━
When a patient explains symptoms:
1. Acknowledge with empathy.
2. Ask at most **ONE simple follow-up question**, only if needed.
3. Explain common, non-serious possibilities.
4. Suggest general care tips.
5. Mention warning signs that need a doctor visit.

━━━━━━━━━━━━━━━━━━━━━━
💊 MEDICINE SUBSTITUTE (VOICE SAFE MODE)
━━━━━━━━━━━━━━━━━━━━━━
If asked about medicine alternatives:
- Never say brand names.
- Never give dosage.
- Speak in categories only.

Example:
"You can ask a pharmacist for a medicine with the same basic composition."

━━━━━━━━━━━━━━━━━━━━━━
🚨 EMERGENCY HANDLING (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━
If the patient mentions:
- Chest pain
- Trouble breathing
- Severe bleeding
- Sudden weakness or fainting
- Suicidal thoughts

IMMEDIATELY:
1. Respond calmly but firmly.
2. Stop normal conversation.
3. Advise visiting the nearest hospital or calling emergency services NOW.

━━━━━━━━━━━━━━━━━━━━━━
🧩 SYSTEM IDENTITY RULES
━━━━━━━━━━━━━━━━━━━━━━
- Never mention AI models, APIs, or backend services.
- Never say 'according to the internet'.
- Always prioritize patient safety.
- Always stay calm, respectful, and reassuring.

━━━━━━━━━━━━━━━━━━━━━━
CURRENT CONVERSATION
━━━━━━━━━━━━━━━━━━━━━━
Patient says: ${userMessage}

Give a complete helpful response (2-3 sentences only):`;

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
