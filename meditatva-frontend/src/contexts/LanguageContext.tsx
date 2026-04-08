/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppLanguage = "en" | "hi" | "pa" | "ta" | "te";

export interface LanguageOption {
  code: AppLanguage;
  label: string;
  nativeLabel: string;
}

const STORAGE_KEY = "meditatva-language";

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिंदी" },
  { code: "pa", label: "Punjabi", nativeLabel: "ਪੰਜਾਬੀ" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
];

const TRANSLATIONS: Record<string, Partial<Record<AppLanguage, string>>> = {
  "header.premiumHealthcare": {
    en: "Premium Healthcare",
    hi: "प्रीमियम हेल्थकेयर",
    pa: "ਪ੍ਰੀਮੀਅਮ ਹੈਲਥਕੇਅਰ",
    ta: "ப்ரீமியம் சுகாதாரம்",
    te: "ప్రీమియం హెల్త్‌కేర్",
  },
  "header.language": {
    en: "Language",
    hi: "भाषा",
    pa: "ਭਾਸ਼ਾ",
    ta: "மொழி",
    te: "భాష",
  },
  "menu.dashboard": { en: "Mood Analyzer", hi: "मूड एनालाइज़र", pa: "ਮੂਡ ਐਨਾਲਾਈਜ਼ਰ", ta: "மூட் அனலைசர்", te: "మూడ్ అనలైజర్" },
  "menu.dashboardDesc": { en: "Expression and voice mood insights", hi: "भाव और आवाज़ आधारित मूड इनसाइट्स", pa: "ਅਭਿਵ੍ਯਕਤੀ ਅਤੇ ਆਵਾਜ਼ ਆਧਾਰਿਤ ਮੂਡ ਇਨਸਾਈਟਸ", ta: "முகபாவம் மற்றும் குரல் அடிப்படையிலான மூட் தகவல்கள்", te: "వ్యక్తీకరణ మరియు వాయిస్ ఆధారిత మూడ్ ఇన్‌సైట్స్" },
  "menu.cabinet": { en: "Cabinet", hi: "कैबिनेट", pa: "ਕੈਬਨਿਟ", ta: "கேபினெட்", te: "క్యాబినెట్" },
  "menu.cabinetDesc": { en: "Prescriptions", hi: "प्रिस्क्रिप्शन", pa: "ਪ੍ਰਿਸਕ੍ਰਿਪਸ਼ਨ", ta: "மருந்து சீட்டுகள்", te: "ప్రిస్క్రిప్షన్లు" },
  "menu.appointments": { en: "Appointments", hi: "अपॉइंटमेंट्स", pa: "ਅਪਾਇੰਟਮੈਂਟਸ", ta: "முன்பதிவுகள்", te: "అపాయింట్‌మెంట్స్" },
  "menu.appointmentsDesc": { en: "Book & manage", hi: "बुक और मैनेज करें", pa: "ਬੁੱਕ ਅਤੇ ਪ੍ਰਬੰਧ ਕਰੋ", ta: "முன்பதிவு செய்து நிர்வகிக்க", te: "బుక్ చేసి నిర్వహించండి" },
  "menu.callSaarthi": { en: "Call Saarthi", hi: "कॉल सारथी", pa: "ਕਾਲ ਸਾਰਥੀ", ta: "கால் சாரதி", te: "కాల్ సారథి" },
  "menu.callSaarthiDesc": { en: "Voice care dashboard", hi: "वॉइस केयर डैशबोर्ड", pa: "ਆਵਾਜ਼ ਦੇਖਭਾਲ ਡੈਸ਼ਬੋਰਡ", ta: "குரல் பராமரிப்பு டாஷ்போர்டு", te: "వాయిస్ కేర్ డ్యాష్‌బోర్డ్" },
  "menu.screening": { en: "Mental Health Screening", hi: "मेंटल हेल्थ स्क्रीनिंग", pa: "ਮੈਂਟਲ ਹੈਲਥ ਸਕਰੀਨਿੰਗ", ta: "மனநலம் திரையிடல்", te: "మానసిక ఆరోగ్య స్క్రీనింగ్" },
  "menu.screeningDesc": { en: "PHQ-9 • GAD-7", hi: "PHQ-9 • GAD-7", pa: "PHQ-9 • GAD-7", ta: "PHQ-9 • GAD-7", te: "PHQ-9 • GAD-7" },
  "menu.counselor": { en: "Counselor / Help Booking", hi: "काउंसलर / हेल्प बुकिंग", pa: "ਕਾਊਂਸਲਰ / ਮਦਦ ਬੁਕਿੰਗ", ta: "கவுன்சிலர் / உதவி முன்பதிவு", te: "కౌన్సిలర్ / హెల్ప్ బుకింగ్" },
  "menu.counselorDesc": { en: "Escalate to human support", hi: "ह्यूमन सपोर्ट से जुड़ें", pa: "ਮਾਨਵ ਸਹਾਇਤਾ ਨਾਲ ਜੁੜੋ", ta: "மனித உதவியுடன் இணைக", te: "మానవ సహాయానికి పెంచండి" },
  "menu.nearby": { en: "Nearby Stores", hi: "नज़दीकी स्टोर", pa: "ਨੇੜਲੇ ਸਟੋਰ", ta: "அருகிலுள்ள கடைகள்", te: "సమీప దుకాణాలు" },
  "menu.nearbyDesc": { en: "Find pharmacies", hi: "फार्मेसी ढूंढें", pa: "ਫਾਰਮੇਸੀ ਲੱਭੋ", ta: "மருந்தகம் தேடுங்கள்", te: "ఫార్మసీలు కనుగొనండి" },
  "menu.findMedicine": { en: "Find Medicine", hi: "दवाई खोजें", pa: "ਦਵਾਈ ਲੱਭੋ", ta: "மருந்து தேடல்", te: "ఔషధం వెతకండి" },
  "menu.findMedicineDesc": { en: "Search meds", hi: "दवाइयां खोजें", pa: "ਦਵਾਈਆਂ ਖੋਜੋ", ta: "மருந்துகள் தேடல்", te: "ఔషధాలు వెతకండి" },
  "menu.orders": { en: "My Orders", hi: "मेरे ऑर्डर", pa: "ਮੇਰੇ ਆਰਡਰ", ta: "என் ஆர்டர்கள்", te: "నా ఆర్డర్లు" },
  "menu.ordersDesc": { en: "Track orders", hi: "ऑर्डर ट्रैक करें", pa: "ਆਰਡਰ ਟਰੈਕ ਕਰੋ", ta: "ஆர்டரை கண்காணிக்க", te: "ఆర్డర్ ట్రాక్ చేయండి" },
  "dashboard.title": { en: "Dashboard", hi: "डैशबोर्ड", pa: "ਡੈਸ਼ਬੋਰਡ", ta: "டாஷ்போர்டு", te: "డ్యాష్‌బోర్డ్" },
  "dashboard.overview": { en: "Wellness overview", hi: "वेलनेस अवलोकन", pa: "ਵੈਲਨੈੱਸ ਓਵਰਵਿਊ", ta: "நலன் மேலோட்டம்", te: "వెల్‌నెస్ అవలోకనం" },
  "dashboard.welcomeBack": { en: "Welcome back! 👋", hi: "वापसी पर स्वागत है! 👋", pa: "ਵਾਪਸੀ 'ਤੇ ਸੁਆਗਤ ਹੈ! 👋", ta: "மீண்டும் வருக! 👋", te: "మళ్లీ స్వాగతం! 👋" },
  "dashboard.healthOverview": { en: "Here's your comprehensive health overview", hi: "यहां आपका संपूर्ण स्वास्थ्य अवलोकन है", pa: "ਇੱਥੇ ਤੁਹਾਡਾ ਪੂਰਾ ਸਿਹਤ ਓਵਰਵਿਊ ਹੈ", ta: "உங்கள் முழுமையான சுகாதார மேலோட்டம் இங்கே", te: "ఇదిగో మీ సమగ్ర ఆరోగ్య అవలోకనం" },
  "dashboard.upcoming": { en: "Upcoming", hi: "आगामी", pa: "ਆਗਾਮੀ", ta: "வரவிருக்கிறது", te: "రాబోయేవి" },
  "dashboard.activeOrders": { en: "Active Orders", hi: "सक्रिय ऑर्डर", pa: "ਸਰਗਰਮ ਆਰਡਰ", ta: "செயலில் உள்ள ஆர்டர்கள்", te: "క్రియాశీల ఆర్డర్లు" },
  "dashboard.reminders": { en: "Reminders", hi: "रिमाइंडर", pa: "ਰਿਮਾਈਂਡਰ", ta: "நினைவூட்டல்கள்", te: "రిమైండర్లు" },
  "patient.healthScore": { en: "Health Score", hi: "स्वास्थ्य स्कोर", pa: "ਸਿਹਤ ਸਕੋਰ", ta: "சுகாதார மதிப்பெண்", te: "ఆరోగ్య స్కోరు" },
  "patient.premium": { en: "Premium", hi: "प्रीमियम", pa: "ਪ੍ਰੀਮੀਅਮ", ta: "பிரீமியம்", te: "ప్రీమియం" },
  "patient.verified": { en: "Verified", hi: "सत्यापित", pa: "ਪੁਸ਼ਟੀਕ੍ਰਿਤ", ta: "சரிபார்க்கப்பட்டது", te: "ధృవీకరించబడింది" },
  "dashboard.quickActions": { en: "Quick Actions", hi: "त्वरित कार्य", pa: "ਤੁਰੰਤ ਕਾਰਵਾਈਆਂ", ta: "விரைவு செயல்கள்", te: "త్వరిత చర్యలు" },
  "dashboard.scanPrescription": { en: "Scan Prescription", hi: "प्रिस्क्रिप्शन स्कैन करें", pa: "ਪ੍ਰਿਸਕ੍ਰਿਪਸ਼ਨ ਸਕੈਨ ਕਰੋ", ta: "மருந்து சீட்டை ஸ்கேன் செய்யவும்", te: "ప్రిస్క్రిప్షన్ స్కాన్ చేయండి" },
  "dashboard.scanPrescriptionDesc": { en: "Upload & analyze", hi: "अपलोड और विश्लेषण", pa: "ਅਪਲੋਡ ਅਤੇ ਵਿਸ਼ਲੇਸ਼ਣ", ta: "பதிவேற்று & பகுப்பாய்வு", te: "అప్‌లోడ్ చేసి విశ్లేషించండి" },
  "dashboard.findMedicine": { en: "Find Medicine", hi: "दवाई खोजें", pa: "ਦਵਾਈ ਲੱਭੋ", ta: "மருந்து தேடல்", te: "ఔషధం వెతకండి" },
  "dashboard.findMedicineDesc": { en: "Search nearby", hi: "नज़दीक खोजें", pa: "ਨੇੜੇ ਖੋਜੋ", ta: "அருகில் தேடுங்கள்", te: "సమీపంలో వెతకండి" },
  "dashboard.appointments": { en: "Appointments", hi: "अपॉइंटमेंट्स", pa: "ਅਪਾਇੰਟਮੈਂਟਸ", ta: "முன்பதிவுகள்", te: "అపాయింట్‌మెంట్స్" },
  "dashboard.appointmentsDesc": { en: "See doctors", hi: "डॉक्टर देखें", pa: "ਡਾਕਟਰ ਵੇਖੋ", ta: "மருத்துவர்களைக் காண்க", te: "డాక్టర్లను చూడండి" },
  "dashboard.aiAssistant": { en: "Saarthi - AI Voice", hi: "सारथी - AI वॉइस", pa: "ਸਾਰਥੀ - AI ਵੌਇਸ", ta: "சாரதி - AI குரல்", te: "సారథి - AI వాయిస్" },
  "dashboard.aiAssistantDesc": { en: "Get health advice", hi: "स्वास्थ्य सलाह पाएं", pa: "ਸਿਹਤ ਸਲਾਹ ਲਓ", ta: "சுகாதார ஆலோசனை பெறுங்கள்", te: "ఆరోగ్య సలహా పొందండి" },
  "dashboard.reports": { en: "Medical Reports", hi: "मेडिकल रिपोर्ट्स", pa: "ਮੈਡੀਕਲ ਰਿਪੋਰਟਾਂ", ta: "மருத்துவ அறிக்கைகள்", te: "మెడికల్ రిపోర్టులు" },
  "dashboard.reportsDesc": { en: "Upload & analyze", hi: "अपलोड और विश्लेषण", pa: "ਅਪਲੋਡ ਅਤੇ ਵਿਸ਼ਲੇਸ਼ਣ", ta: "பதிவேற்று & பகுப்பாய்வு", te: "అప్‌లోడ్ చేసి విశ్లేషించండి" },
  "dashboard.voiceChat": { en: "Voice Chat", hi: "वॉइस चैट", pa: "ਵੌਇਸ ਚੈਟ", ta: "குரல் உரையாடல்", te: "వాయిస్ చాట్" },
  "dashboard.voiceChatDesc": { en: "Talk to AI Saarthi", hi: "AI सारथी से बात करें", pa: "AI ਸਾਰਥੀ ਨਾਲ ਗੱਲ ਕਰੋ", ta: "AI சாரதியுடன் பேசுங்கள்", te: "AI సారథితో మాట్లాడండి" },
  "dashboard.callSaarthi": { en: "Call Saarthi", hi: "कॉल सारथी", pa: "ਕਾਲ ਸਾਰਥੀ", ta: "கால் சாரதி", te: "కాల్ సారథి" },
  "dashboard.callSaarthiDesc": { en: "Voice call support", hi: "वॉइस कॉल सपोर्ट", pa: "ਵੌਇਸ ਕਾਲ ਸਹਾਇਤਾ", ta: "குரல் அழைப்பு ஆதரவு", te: "వాయిస్ కాల్ సపోర్ట్" },
  "dashboard.recentActivity": { en: "Recent Activity", hi: "हाल की गतिविधि", pa: "ਹਾਲੀਆ ਗਤੀਵਿਧੀ", ta: "சமீபத்திய செயல்பாடு", te: "ఇటీవలి కార్యకలాపాలు" },
  "dashboard.viewAll": { en: "View All", hi: "सभी देखें", pa: "ਸਭ ਵੇਖੋ", ta: "அனைத்தையும் காண்க", te: "అన్నీ చూడండి" },
  "dashboard.todaysReminders": { en: "Today's Reminders", hi: "आज के रिमाइंडर", pa: "ਅੱਜ ਦੇ ਰਿਮਾਈਂਡਰ", ta: "இன்றைய நினைவூட்டல்கள்", te: "నేటి రిమైండర్లు" },
  "dashboard.bloodPressureMedicine": { en: "Blood Pressure Medicine", hi: "ब्लड प्रेशर की दवा", pa: "ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ ਦੀ ਦਵਾਈ", ta: "இரத்த அழுத்த மருந்து", te: "బ్లడ్ ప్రెషర్ మందు" },
  "dashboard.daily": { en: "Daily", hi: "रोज़ाना", pa: "ਰੋਜ਼ਾਨਾ", ta: "தினசரி", te: "రోజువారీ" },
  "home.callDashboardTitle": { en: "Mood Anaylser Dashboard", hi: "मूड एनालाइज़र डैशबोर्ड", pa: "ਮੂਡ ਐਨਾਲਾਈਜ਼ਰ ਡੈਸ਼ਬੋਰਡ", ta: "மூட் அனலைசர் டாஷ்போர்டு", te: "మూడ్ అనలైజర్ డ్యాష్‌బోర్డ్" },
  "home.callDashboardDesc": { en: "Track real-time facial and voice emotion with confidence.", hi: "रियल-टाइम चेहरे और आवाज़ की भावना को कॉन्फिडेंस के साथ ट्रैक करें।", pa: "ਰਿਅਲ-ਟਾਈਮ ਚਿਹਰੇ ਅਤੇ ਆਵਾਜ਼ ਦੀ ਭਾਵਨਾ ਨੂੰ ਕਾਨਫ਼ਿਡੈਂਸ ਨਾਲ ਟ੍ਰੈਕ ਕਰੋ।", ta: "ரியல்-டைம் முகபாவம் மற்றும் குரல் உணர்வுகளை நம்பகத்தன்மையுடன் கண்காணிக்கவும்.", te: "రియల్-టైమ్ ముఖ మరియు వాయిస్ భావాలను నమ్మక శాతంతో ట్రాక్ చేయండి." },
  "card.callSaarthi": { en: "Call Saarthi", hi: "कॉल सारथी", pa: "ਕਾਲ ਸਾਰਥੀ", ta: "கால் சாரதி", te: "కాల్ సారథి" },
  "card.callSaarthiDesc": { en: "AI-assisted medical voice call in multiple languages.", hi: "कई भाषाओं में AI-सहायता वाली मेडिकल वॉइस कॉल।", pa: "ਕਈ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ AI ਸਹਾਇਤਾਕਾਰ ਮੈਡੀਕਲ ਵਾਇਸ ਕਾਲ।", ta: "பல மொழிகளில் AI உதவியுடன் மருத்துவ குரல் அழைப்பு.", te: "అనేక భాషల్లో AI సహాయంతో మెడికల్ వాయిస్ కాల్." },
  "card.aiAssistant": { en: "AI Assistant with Saarthi", hi: "सारथी के साथ AI असिस्टेंट", pa: "ਸਾਰਥੀ ਨਾਲ AI ਅਸਿਸਟੈਂਟ", ta: "சாரதியுடன் AI உதவியாளர்", te: "సారథితో AI అసిస్టెంట్" },
  "card.aiAssistantDesc": { en: "Ask health queries for symptoms, remedies, exercises and quick wellness guidance.", hi: "लक्षण, उपाय, एक्सरसाइज़ और तेज़ वेलनेस गाइडेंस के लिए स्वास्थ्य प्रश्न पूछें।", pa: "ਲੱਛਣ, ਇਲਾਜ, ਕਸਰਤ ਅਤੇ ਤੇਜ਼ ਵੈਲਨੈੱਸ ਮਦਦ ਲਈ ਸਿਹਤ ਸਵਾਲ ਪੁੱਛੋ।", ta: "அறிகுறிகள், தீர்வுகள், உடற்பயிற்சி மற்றும் விரைவான நல ஆலோசனைக்காக சுகாதார கேள்விகளை கேளுங்கள்.", te: "లక్షణాలు, పరిష్కారాలు, వ్యాయామాలు మరియు త్వరిత వెల్‌నెస్ మార్గదర్శకత్వం కోసం ఆరోగ్య ప్రశ్నలు అడగండి." },
  "actions.logout": { en: "Logout", hi: "लॉगआउट", pa: "ਲਾਗਆਉਟ", ta: "வெளியேறு", te: "లాగౌట్" },
  "screening.welcomeTitle": {
    en: "Hi there. I am here to help you with a quick mental wellness check-in.",
    hi: "नमस्ते। मैं आपकी त्वरित मानसिक वेलनेस चेक-इन में मदद करने के लिए यहां हूं।",
    pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ। ਮੈਂ ਤੁਹਾਡੀ ਤੇਜ਼ ਮਾਨਸਿਕ ਸੁਖ-ਸਹੂਲਤ ਜਾਂਚ ਵਿੱਚ ਮਦਦ ਲਈ ਇੱਥੇ ਹਾਂ।",
    ta: "வணக்கம். விரைவான மனநல நிலை சரிபார்ப்பில் உங்களுக்கு உதவ நான் இங்கே இருக்கிறேன்.",
    te: "హాయ్. త్వరిత మానసిక వెల్‌నెస్ చెక్-ఇన్‌లో మీకు సహాయం చేయడానికి నేను ఇక్కడ ఉన్నాను.",
  },
  "screening.welcomeSubtext": {
    en: "Type hi or hello to start the conversation.",
    hi: "बातचीत शुरू करने के लिए hi या hello टाइप करें।",
    pa: "ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰਨ ਲਈ hi ਜਾਂ hello ਟਾਈਪ ਕਰੋ।",
    ta: "உரையாடலை தொடங்க hi அல்லது hello என টাইப் செய்யுங்கள்.",
    te: "సంభాషణ ప్రారంభించడానికి hi లేదా hello టైప్ చేయండి.",
  },
  "screening.greetingPlaceholder": {
    en: "Type hi or hello",
    hi: "hi या hello टाइप करें",
    pa: "hi ਜਾਂ hello ਟਾਈਪ ਕਰੋ",
    ta: "hi அல்லது hello টাইப் செய்யுங்கள்",
    te: "hi లేదా hello టైప్ చేయండి",
  },
  "screening.errorBegin": {
    en: "Please type hi or hello to begin.",
    hi: "शुरू करने के लिए कृपया hi या hello टाइप करें।",
    pa: "ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਕਿਰਪਾ ਕਰਕੇ hi ਜਾਂ hello ਟਾਈਪ ਕਰੋ।",
    ta: "தொடங்குவதற்கு தயவுசெய்து hi அல்லது hello টাইப் செய்யுங்கள்.",
    te: "ప్రారంభించడానికి దయచేసి hi లేదా hello టైప్ చేయండి.",
  },
  "screening.errorGreeting": {
    en: "Please start with hi or hello so I can begin the check-in.",
    hi: "कृपया hi या hello से शुरू करें ताकि मैं चेक-इन शुरू कर सकूं।",
    pa: "ਕਿਰਪਾ ਕਰਕੇ hi ਜਾਂ hello ਨਾਲ ਸ਼ੁਰੂ ਕਰੋ ਤਾਂ ਕਿ ਮੈਂ ਚੈਕ-ਇਨ ਸ਼ੁਰੂ ਕਰ ਸਕਾਂ।",
    ta: "தயவுசெய்து hi அல்லது hello என்று தொடங்குங்கள்; அப்போது நான் check-in ஐத் தொடங்குவேன்.",
    te: "దయచేసి hi లేదా hello తో ప్రారంభించండి, అప్పుడు నేను check-in ప్రారంభిస్తాను.",
  },
  "screening.askName": {
    en: "Great. What is your name?",
    hi: "बहुत बढ़िया। आपका नाम क्या है?",
    pa: "ਬਹੁਤ ਵਧੀਆ। ਤੁਹਾਡਾ ਨਾਮ ਕੀ ਹੈ?",
    ta: "சரி. உங்கள் பெயர் என்ன?",
    te: "బాగుంది. మీ పేరు ఏమిటి?",
  },
  "screening.placeholderName": {
    en: "Enter your name",
    hi: "अपना नाम दर्ज करें",
    pa: "ਆਪਣਾ ਨਾਮ ਦਰਜ ਕਰੋ",
    ta: "உங்கள் பெயரை உள்ளிடவும்",
    te: "మీ పేరు నమోదు చేయండి",
  },
  "screening.errorName": {
    en: "Please enter your name.",
    hi: "कृपया अपना नाम दर्ज करें।",
    pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਨਾਮ ਦਰਜ ਕਰੋ।",
    ta: "தயவுசெய்து உங்கள் பெயரை உள்ளிடவும்.",
    te: "దయచేసి మీ పేరు నమోదు చేయండి.",
  },
  "screening.startQuestions": {
    en: "Thanks, {{name}}. Let us begin your 12-question check-in.",
    hi: "धन्यवाद, {{name}}। आइए आपका 12-प्रश्न वाला चेक-इन शुरू करें।",
    pa: "ਧੰਨਵਾਦ, {{name}}। ਆਓ ਤੁਹਾਡਾ 12-ਸਵਾਲਾਂ ਵਾਲਾ ਚੈਕ-ਇਨ ਸ਼ੁਰੂ ਕਰੀਏ।",
    ta: "நன்றி, {{name}}. உங்கள் 12 கேள்வி check-in ஐ ஆரம்பிப்போம்.",
    te: "ధన్యవాదాలు, {{name}}. మీ 12 ప్రశ్నల check-in ను ప్రారంభిద్దాం.",
  },
  "screening.processing": {
    en: "✨ Processing...",
    hi: "✨ प्रोसेसिंग...",
    pa: "✨ ਪ੍ਰੋਸੈਸ ਹੋ ਰਿਹਾ ਹੈ...",
    ta: "✨ செயலாக்கம்...",
    te: "✨ ప్రాసెసింగ్...",
  },
  "screening.send": { en: "Send", hi: "भेजें", pa: "ਭੇਜੋ", ta: "அனுப்பு", te: "పంపండి" },
  "screening.continue": { en: "Continue", hi: "जारी रखें", pa: "ਜਾਰੀ ਰੱਖੋ", ta: "தொடரவும்", te: "కొనసాగించండి" },
  "screening.questionLabel": { en: "Question", hi: "प्रश्न", pa: "ਸਵਾਲ", ta: "கேள்வி", te: "ప్రశ్న" },
  "screening.eta": { en: "This screening takes about 3-5 minutes", hi: "यह स्क्रीनिंग लगभग 3-5 मिनट लेती है", pa: "ਇਹ ਸਕਰੀਨਿੰਗ ਲਗਭਗ 3-5 ਮਿੰਟ ਲੈਂਦੀ ਹੈ", ta: "இந்த screening சுமார் 3-5 நிமிடங்கள் ஆகும்", te: "ఈ screening కు సుమారు 3-5 నిమిషాలు పడుతుంది" },
  "screening.questions": { en: "questions", hi: "प्रश्न", pa: "ਸਵਾਲ", ta: "கேள்விகள்", te: "ప్రశ్నలు" },
  "recent.title": { en: "Recent Activity", hi: "हाल की गतिविधि", pa: "ਹਾਲੀਆ ਗਤੀਵਿਧੀ", ta: "சமீபத்திய செயல்பாடு", te: "ఇటీవలి కార్యకలాపాలు" },
  "recent.paracetamol": { en: "Ordered Paracetamol 500mg", hi: "Paracetamol 500mg ऑर्डर किया", pa: "Paracetamol 500mg ਆਰਡਰ ਕੀਤਾ", ta: "Paracetamol 500mg ஆர்டர் செய்யப்பட்டது", te: "Paracetamol 500mg ఆర్డర్ చేశారు" },
  "recent.appointment": { en: "Appointment with Dr. Sharma", hi: "Dr. Sharma के साथ अपॉइंटमेंट", pa: "Dr. Sharma ਨਾਲ ਅਪਾਇੰਟਮੈਂਟ", ta: "Dr. Sharma உடன் அபாயின்மென்ட்", te: "Dr. Sharma తో అపాయింట్మెంట్" },
  "recent.uploadedPrescription": { en: "Uploaded prescription", hi: "प्रिस्क्रिप्शन अपलोड किया", pa: "ਪ੍ਰਿਸਕ੍ਰਿਪਸ਼ਨ ਅੱਪਲੋਡ ਕੀਤਾ", ta: "மருந்து சீட்டு பதிவேற்றப்பட்டது", te: "ప్రిస్క్రిప్షన్ అప్‌లోడ్ చేశారు" },
  "recent.reminderSet": { en: "Medicine reminder set", hi: "दवा रिमाइंडर सेट किया", pa: "ਦਵਾਈ ਰਿਮਾਈਂਡਰ ਸੈੱਟ ਕੀਤਾ", ta: "மருந்து நினைவூட்டல் அமைக்கப்பட்டது", te: "ఔషధ రిమైండర్ సెట్అయింది" },
  "recent.time2h": { en: "2 hours ago", hi: "2 घंटे पहले", pa: "2 ਘੰਟੇ ਪਹਿਲਾਂ", ta: "2 மணி நேரம் முன்பு", te: "2 గంటల క్రితం" },
  "recent.timeYesterday": { en: "Yesterday", hi: "कल", pa: "ਕੱਲ੍ਹ", ta: "நேற்று", te: "నిన్న" },
  "recent.time2d": { en: "2 days ago", hi: "2 दिन पहले", pa: "2 ਦਿਨ ਪਹਿਲਾਂ", ta: "2 நாட்களுக்கு முன்", te: "2 రోజుల క్రితం" },
  "recent.time3d": { en: "3 days ago", hi: "3 दिन पहले", pa: "3 ਦਿਨ ਪਹਿਲਾਂ", ta: "3 நாட்களுக்கு முன்", te: "3 రోజుల క్రితం" },
};

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (next: AppLanguage) => void;
  options: LanguageOption[];
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem(STORAGE_KEY) as AppLanguage | null;
    if (saved && LANGUAGE_OPTIONS.some((option) => option.code === saved)) {
      return saved;
    }
    return "en";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, language);
    }
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (next: AppLanguage) => {
    setLanguageState(next);
  };

  const t = (key: string, fallback?: string) => {
    const entry = TRANSLATIONS[key];
    if (!entry) return fallback ?? key;
    return entry[language] ?? entry.en ?? fallback ?? key;
  };

  const value: LanguageContextValue = { language, setLanguage, options: LANGUAGE_OPTIONS, t };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useAppLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useAppLanguage must be used within LanguageProvider");
  }
  return ctx;
}
