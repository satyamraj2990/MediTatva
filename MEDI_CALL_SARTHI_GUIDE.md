# 📞 Medi Call Sarthi - Voice Call Medical Assistant

## Overview
Medi Call Sarthi is an AI-powered voice medical assistant that provides health guidance through phone calls. It integrates Twilio for voice calls, Google Speech-to-Text, Text-to-Speech, and Gemini AI for intelligent medical responses.

## Features

### ✨ Core Capabilities
- 📞 **Outbound Calling**: Patient initiates call from dashboard
- 🎙️ **Speech Recognition**: Converts patient's voice to text
- 🤖 **AI Medical Assistant**: Uses Gemini AI for medical guidance
- 🔊 **Voice Responses**: Speaks back to patient using Text-to-Speech
- 🌐 **Multi-Language Support**: Hindi, English, and other Indian languages
- ⚠️ **Emergency Detection**: Identifies critical symptoms and advises immediate action

### 🛡️ Safety Features
- ❌ **No Diagnosis**: Never diagnoses diseases
- ❌ **No Prescriptions**: Never prescribes medications
- ✅ **General Guidance**: Provides educational health information only
- ✅ **Doctor Recommendation**: Always suggests consulting doctors when needed
- 🚨 **Emergency Handling**: Detects emergency keywords and provides appropriate advice

## Architecture

### Flow Diagram
```
Patient Dashboard
       ↓
   Click "Start Call"
       ↓
   Backend API (/api/voice-call/initiate-call)
       ↓
   Twilio initiates call to patient's phone
       ↓
   Patient receives call
       ↓
   Welcome message played (TwiML)
       ↓
   Patient speaks health concern
       ↓
   Speech-to-Text converts to text
       ↓
   Gemini AI processes query
       ↓
   AI generates medical guidance
       ↓
   Text-to-Speech converts to voice
       ↓
   Response spoken to patient
       ↓
   Continue conversation or end call
```

### Technology Stack
- **Voice Provider**: Twilio Programmable Voice
- **Speech-to-Text**: Google Cloud Speech API
- **Text-to-Speech**: Google Cloud Text-to-Speech API  
- **AI Engine**: Google Gemini Pro
- **Backend**: Node.js + Express
- **Frontend**: React + TypeScript

## Setup Instructions

### Prerequisites
1. Twilio Account with phone number
2. Google Cloud Platform account
3. Enabled APIs:
   - Cloud Speech-to-Text API
   - Cloud Text-to-Speech API
   - Generative Language API (Gemini)

### Environment Variables

Add to `/meditatva-backend/.env`:
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Google APIs
GOOGLE_SPEECH_API_KEY=your_speech_to_text_api_key
GOOGLE_TTS_API_KEY=your_text_to_speech_api_key
GEMINI_API_KEY=your_gemini_api_key

# Server
BACKEND_URL=http://localhost:3000
```

### Installation

1. **Install Dependencies**:
```bash
cd meditatva-backend
npm install twilio axios
```

2. **Configure Twilio Webhook**:
   - Go to Twilio Console → Phone Numbers → Your Number
   - Set "A Call Comes In" webhook to: `https://your-domain.com/api/voice-call/handle-call`
   - Method: POST

3. **Restart Backend**:
```bash
npm start
```

## API Endpoints

### 1. Initiate Call
```http
POST /api/voice-call/initiate-call
Content-Type: application/json

{
  "phoneNumber": "+917739489684",
  "patientName": "John Doe"
}
```

**Response**:
```json
{
  "success": true,
  "callSid": "CA123...",
  "message": "Call initiated successfully"
}
```

### 2. Handle Call (Twilio Webhook)
```http
POST /api/voice-call/handle-call
```
Twilio automatically calls this when call connects.

### 3. Process Speech (Twilio Webhook)
```http
POST /api/voice-call/process-speech
```
Receives speech input and returns AI response as TwiML.

### 4. Call Status (Twilio Webhook)
```http
POST /api/voice-call/call-status
```
Receives call status updates.

## Usage

### From Patient Dashboard

1. Click on **"📞 Medi Call Sarthi"** card
2. Enter your phone number (with country code)
3. Click **"Start Call"**
4. Wait for the call on your phone
5. Speak your health concern when prompted
6. Listen to AI guidance
7. Continue conversation or hang up

### Example Conversation

**System**: "Namaste. Main Medi Call Sarthi hoon, aapka AI medical voice assistant. Kripya apni health ki samasya batayein."

**Patient**: "Mujhe bukhar hai aur sar dard ho raha hai."

**System**: "Agar aapko bukhar aur sar dard hai, toh yeh common symptoms ho sakte hain. Kripya rest karein, paani piyen aur doctor se consult karein agar symptoms 2-3 din se zyada continue hote hain."

## Emergency Handling

If patient mentions:
- Chest pain
- Breathing difficulty
- Severe bleeding
- Heart attack symptoms
- Suicidal thoughts

**System Response**: "Yeh emergency situation lag rahi hai. Kripya turant najdeeki hospital jaayein ya ambulance ko 102 par call karein. Apna khayal rakhein."

Call ends immediately.

## Medical Safety Guidelines

### The AI Assistant MUST:
- ✅ Provide general health education
- ✅ Suggest basic self-care (rest, hydration)
- ✅ Recommend consulting doctors
- ✅ Be empathetic and reassuring
- ✅ Keep responses SHORT (2-3 sentences)
- ✅ Use simple, conversational language

### The AI Assistant MUST NEVER:
- ❌ Diagnose diseases
- ❌ Prescribe medications or dosages
- ❌ Claim to replace doctors
- ❌ Provide definitive medical advice
- ❌ Give treatment plans

## Response Guidelines

### Keep It Short
- Maximum 2-3 sentences per response
- Suitable for phone conversation
- Clear pronunciation for TTS

### Use Simple Language
- Mix of Hindi and English (Hinglish)
- Medical terms explained simply
- Natural, conversational tone

### Be Empathetic
- Acknowledge patient's concern
- Reassure when appropriate
- Never alarm unnecessarily

## Supported Languages

Primary:
- 🇮🇳 Hindi (`hi-IN`)
- 🇬🇧 English (`en-IN`)

Twilio supports:
- Tamil, Telugu, Kannada
- Malayalam, Marathi, Gujarati
- Bengali, Punjabi

## Voice Configuration

### Twilio Voice
- Voice: `Polly.Aditi` (Indian female voice)
- Language: `hi-IN` (Hindi - India)
- Fallback: `en-IN` (English - India)

### Speech Recognition
- Input: Speech
- Timeout: Auto
- Language: `hi-IN en-IN`
- Hints: Common medical terms

## Testing

### Local Testing
```bash
# Test call initiation
curl -X POST http://localhost:3000/api/voice-call/initiate-call \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+917739489684", "patientName": "Test User"}'
```

### Production Testing
1. Use ngrok for webhook testing:
```bash
ngrok http 3000
```

2. Update Twilio webhook URL to ngrok URL

3. Test from patient dashboard

## Troubleshooting

### Call Not Connecting
- ✅ Check Twilio account balance
- ✅ Verify phone number format (+countrycode...)
- ✅ Check Twilio phone number is verified
- ✅ Review Twilio debugger logs

### Speech Not Recognized
- ✅ Speak clearly and slowly
- ✅ Check background noise
- ✅ Verify Speech API key is valid
- ✅ Check API quotas

### AI Response Issues
- ✅ Verify Gemini API key
- ✅ Check API quotas
- ✅ Review backend logs
- ✅ Test Gemini API separately

### Voice Quality Issues
- ✅ Check network connection
- ✅ Verify TTS API key
- ✅ Try different voice settings
- ✅ Check Twilio call quality

## Cost Estimation

### Per Call (Approximate)
- Twilio Voice: $0.0130/min (US → India)
- Speech-to-Text: $0.006/15 seconds
- Text-to-Speech: $0.000004/character
- Gemini API: Free tier available

**Estimated**: ~$0.15 - $0.25 per 5-minute call

## Limitations

1. **Not for Emergencies**: Always advise calling 102/108 for emergencies
2. **No Diagnosis**: Cannot diagnose conditions
3. **No Prescriptions**: Cannot prescribe medications
4. **Network Dependent**: Requires stable internet/phone connection
5. **Language Accuracy**: TTS/STT may have regional accent issues

## Future Enhancements

- [ ] Add prescription reading capability
- [ ] Integrate with EHR systems
- [ ] Multi-turn context awareness
- [ ] Voice biometric authentication
- [ ] Call recording and transcription
- [ ] Analytics dashboard for call insights
- [ ] Regional language expansion
- [ ] Doctor escalation feature

## Security Considerations

### Data Privacy
- No call recordings stored by default
- Conversation history kept in memory only during call
- Session data deleted after call completion
- HIPAA compliance considerations

### Authentication
- Phone number verification
- OTP-based authentication (future)
- User session management

## Compliance

⚠️ **Important**: This is an AI assistant providing general information only. Users must:
- Consult qualified doctors for medical advice
- Not rely solely on AI guidance
- Seek immediate medical attention for emergencies
- Understand AI limitations

## Support

For issues or questions:
- 📧 Email: support@meditatva.com
- 📞 Phone: +91-XXXX-XXXXXX
- 💬 Chat: Available in patient dashboard

## License

Proprietary - MediTatva Platform

---

**Last Updated**: January 28, 2026
**Version**: 1.0.0
