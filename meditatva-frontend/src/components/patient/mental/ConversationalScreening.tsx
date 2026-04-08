import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ChatMessage } from "./ChatMessage";
import { EmojiScale } from "./EmojiScale";
import { CrisisSupportBanner } from "./CrisisSupportBanner";
import { MentalHealthReportCard } from "./MentalHealthReportCard";
import { SCREENING_QUESTIONS, EMOJI_SCALE_OPTIONS } from "@/lib/screeningConfig";
import { useAppLanguage } from "@/contexts/LanguageContext";
import {
  calculateScreeningResult,
  detectCrisis,
  enrichReportWithDataset,
  ScreeningResult,
} from "@/lib/screeningHelpers";

type ScreeningState = "welcome" | "name" | "screening" | "report";

interface ConversationalScreeningProps {
  onOpenCounselor: () => void;
}

interface SurveyResponseRow {
  questionId: string;
  questionText: string;
  answerLabel: string;
  score: number;
}

type ChatMessageItem = {
  type: "bot" | "user";
  content: string;
  subtext?: string;
  emojiLabel?: string;
  isLoading?: boolean;
};

const QUESTION_TRANSLATIONS: Record<string, Record<"hi" | "pa" | "ta" | "te", { text: string; subtext: string }>> = {
  q1_mood: {
    hi: { text: "हाल के दिनों में आप भावनात्मक रूप से कैसा महसूस कर रहे हैं?", subtext: "आपका कुल मूड और भावनात्मक स्थिति" },
    pa: { text: "ਹਾਲ ਹੀ ਵਿੱਚ ਤੁਸੀਂ ਜਜ਼ਬਾਤੀ ਤੌਰ ਤੇ ਕਿਵੇਂ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ?", subtext: "ਤੁਹਾਡਾ ਕੁੱਲ ਮੂਡ ਅਤੇ ਜਜ਼ਬਾਤੀ ਹਾਲਤ" },
    ta: { text: "சமீபத்தில் நீங்கள் உணர்ச்சிவசமாக எப்படி உணர்கிறீர்கள்?", subtext: "உங்கள் மொத்த மனநிலை மற்றும் உணர்ச்சி நிலை" },
    te: { text: "ఇటీవల మీరు భావోద్వేగంగా ఎలా అనిపిస్తోంది?", subtext: "మీ మొత్తం మూడ్ మరియు భావోద్వేగ స్థితి" },
  },
  q2_interest: {
    hi: { text: "क्या आपकी रुचि उन गतिविधियों में कम हो गई है जिन्हें आप पहले पसंद करते थे?", subtext: "शौक, पढ़ाई, मेलजोल या पसंदीदा काम" },
    pa: { text: "ਕੀ ਤੁਹਾਡੀ ਰੁਚੀ ਉਹਨਾਂ ਗਤੀਵਿਧੀਆਂ ਵਿੱਚ ਘੱਟ ਹੋ ਗਈ ਹੈ ਜੋ ਪਹਿਲਾਂ ਪਸੰਦ ਸੀ?", subtext: "ਸ਼ੌਕ, ਪੜ੍ਹਾਈ, ਮਿਲਣਾ-ਜੁਲਣਾ ਜਾਂ ਮਨਪਸੰਦ ਕੰਮ" },
    ta: { text: "முன்பு விரும்பிய செயல்களில் உங்கள் ஆர்வம் குறைந்ததா?", subtext: "பொழுதுபோக்கு, படிப்பு, சமூக உறவு அல்லது பிடித்த விஷயங்கள்" },
    te: { text: "ముందు ఇష్టపడిన పనులపై ఆసక్తి తగ్గిందా?", subtext: "హాబీలు, చదువు, సామాజికీకరణ లేదా మీకు ఇష్టమైనవి" },
  },
  q3_anxiety: {
    hi: { text: "आपको घबराहट, चिंता या बेचैनी कितनी बार महसूस होती है?", subtext: "सामान्य चिंता या घबराहट की भावना" },
    pa: { text: "ਤੁਹਾਨੂੰ ਘਬਰਾਹਟ, ਫਿਕਰ ਜਾਂ ਬੇਚੈਨੀ ਕਿੰਨੀ ਵਾਰ ਮਹਿਸੂਸ ਹੁੰਦੀ ਹੈ?", subtext: "ਆਮ ਚਿੰਤਾ ਜਾਂ ਨਰਵਸ ਮਹਿਸੂਸ ਕਰਨਾ" },
    ta: { text: "உங்களுக்கு பதட்டம், கவலை அல்லது அச்சம் எவ்வளவு அடிக்கடி வருகிறது?", subtext: "பொதுவான கவலை அல்லது பதட்ட உணர்வுகள்" },
    te: { text: "మీకు నర్వస్, ఆందోళన లేదా కలవరంగా ఎంత తరచుగా అనిపిస్తుంది?", subtext: "సాధారణ ఆందోళన లేదా నర్వస్ భావనలు" },
  },
  q4_sleep: {
    hi: { text: "इन दिनों आपकी नींद की गुणवत्ता कैसी है?", subtext: "नींद आने, बीच में जागने या ज्यादा सोने की स्थिति" },
    pa: { text: "ਅੱਜਕੱਲ੍ਹ ਤੁਹਾਡੀ ਨੀਂਦ ਦੀ ਗੁਣਵੱਤਾ ਕਿਹੋ ਜਿਹੀ ਹੈ?", subtext: "ਨੀਂਦ ਆਉਣ, ਨੀਂਦ ਟੁੱਟਣ ਜਾਂ ਵੱਧ ਸੌਣ ਨਾਲ ਜੁੜੀਆਂ ਗੱਲਾਂ" },
    ta: { text: "இந்த நாட்களில் உங்கள் உறக்கத் தரம் எப்படி இருக்கிறது?", subtext: "தூங்கத் தொடங்குவது, தூக்கத்தைத் தொடருவது அல்லது அதிகமாக தூங்குவது" },
    te: { text: "ఈ మధ్య మీ నిద్ర నాణ్యత ఎలా ఉంది?", subtext: "నిద్ర పట్టడం, మధ్యలో మేల్కొనడం లేదా ఎక్కువగా నిద్రపోవడం" },
  },
  q5_energy: {
    hi: { text: "आपकी ऊर्जा और प्रेरणा का स्तर कैसा है?", subtext: "थकान, ऊर्जा या अत्यधिक दबाव महसूस होना" },
    pa: { text: "ਤੁਹਾਡੀ ਊਰਜਾ ਅਤੇ ਪ੍ਰੇਰਣਾ ਦਾ ਪੱਧਰ ਕਿਹੋ ਜਿਹਾ ਹੈ?", subtext: "ਥਕਾਵਟ, ਤਾਜਗੀ ਜਾਂ ਬੋਝ ਮਹਿਸੂਸ ਕਰਨਾ" },
    ta: { text: "உங்கள் சக்தி மற்றும் உந்துதல் நிலை எப்படி உள்ளது?", subtext: "சோர்வு, உற்சாகம் அல்லது அதிக அழுத்தம் உணர்தல்" },
    te: { text: "మీ శక్తి మరియు ప్రేరణ స్థాయి ఎలా ఉంది?", subtext: "అలసట, ఉత్సాహం లేదా ఒత్తిడి అనిపించడం" },
  },
  q6_focus: {
    hi: { text: "क्या काम या पढ़ाई पर ध्यान केंद्रित करना मुश्किल हो रहा है?", subtext: "फोकस, काम पूरा करना या निर्णय लेना" },
    pa: { text: "ਕੀ ਕੰਮ ਜਾਂ ਪੜ੍ਹਾਈ ਤੇ ਧਿਆਨ ਕੇਂਦਰਿਤ ਕਰਨਾ ਮੁਸ਼ਕਲ ਹੋ ਰਿਹਾ ਹੈ?", subtext: "ਧਿਆਨ, ਕੰਮ ਪੂਰਾ ਕਰਨਾ ਜਾਂ ਫੈਸਲੇ ਲੈਣਾ" },
    ta: { text: "வேலை அல்லது படிப்பில் கவனம் செலுத்துவது கடினமாக உள்ளதா?", subtext: "கவனம், வேலை முடித்தல் அல்லது முடிவு எடுப்பது" },
    te: { text: "పనులపై లేదా చదువుపై దృష్టి పెట్టడం కష్టమా?", subtext: "ఫోకస్, పని పూర్తి చేయడం లేదా నిర్ణయం తీసుకోవడం" },
  },
  q7_overwhelm: {
    hi: { text: "क्या रोजमर्रा की जिम्मेदारियां अभी आपके लिए बहुत भारी लग रही हैं?", subtext: "काम का बोझ, अपेक्षाएं और मानसिक दबाव" },
    pa: { text: "ਕੀ ਰੋਜ਼ਾਨਾ ਦੀਆਂ ਜ਼ਿੰਮੇਵਾਰੀਆਂ ਇਸ ਵੇਲੇ ਤੁਹਾਨੂੰ ਬਹੁਤ ਭਾਰੀ ਲੱਗ ਰਹੀਆਂ ਹਨ?", subtext: "ਕੰਮ ਦਾ ਬੋਝ, ਉਮੀਦਾਂ ਅਤੇ ਮਾਨਸਿਕ ਦਬਾਅ" },
    ta: { text: "தினசரி பொறுப்புகள் இப்போது மிகவும் கனமாக உணரப்படுகிறதா?", subtext: "வேலைப்பளு, எதிர்பார்ப்புகள் மற்றும் மன அழுத்தம்" },
    te: { text: "రోజువారీ బాధ్యతలు ఇప్పుడు చాలా భారంగా అనిపిస్తున్నాయా?", subtext: "పనిభారం, అంచనాలు మరియు మానసిక ఒత్తిడి" },
  },
  q8_social: {
    hi: { text: "क्या आप लोगों से मिलना-जुलना कम कर रहे हैं या सामाजिक रूप से दूर हो गए हैं?", subtext: "दोस्त, परिवार, सहपाठी या सहकर्मी" },
    pa: { text: "ਕੀ ਤੁਸੀਂ ਲੋਕਾਂ ਤੋਂ ਦੂਰ ਰਹਿ ਰਹੇ ਹੋ ਜਾਂ ਸਮਾਜਿਕ ਤੌਰ ਤੇ ਪਿੱਛੇ ਹਟ ਰਹੇ ਹੋ?", subtext: "ਦੋਸਤ, ਪਰਿਵਾਰ, ਕਲਾਸਮੈਟ ਜਾਂ ਸਹਿਕਰਮੀ" },
    ta: { text: "நீங்கள் சமூக தொடர்புகளை தவிர்க்கிறீர்களா அல்லது விலகுகிறீர்களா?", subtext: "நண்பர்கள், குடும்பம், வகுப்புத் தோழர்கள் அல்லது சக ஊழியர்கள்" },
    te: { text: "మీరు ఇతరులను దూరంగా ఉంచుతున్నారా లేదా సామాజికంగా వెనుకకు వెళ్తున్నారా?", subtext: "స్నేహితులు, కుటుంబం, సహాధ్యాయులు లేదా సహచరులు" },
  },
  q9_appetite: {
    hi: { text: "क्या आपने भूख या खाने की दिनचर्या में बदलाव नोट किया है?", subtext: "सामान्य से बहुत कम या ज्यादा खाना" },
    pa: { text: "ਕੀ ਤੁਸੀਂ ਭੁੱਖ ਜਾਂ ਖਾਣ-ਪੀਣ ਦੀ ਆਦਤ ਵਿੱਚ ਬਦਲਾਅ ਮਹਿਸੂਸ ਕੀਤਾ ਹੈ?", subtext: "ਆਮ ਤੌਰ ਤੇ ਘੱਟ ਜਾਂ ਵੱਧ ਖਾਣਾ" },
    ta: { text: "உங்கள் பசி அல்லது உணவு பழக்கத்தில் மாற்றம் உள்ளதா?", subtext: "வழக்கத்தை விட குறைவாக அல்லது அதிகமாக உண்பது" },
    te: { text: "మీ ఆకలి లేదా ఆహార అలవాటులో మార్పు గమనించారా?", subtext: "సాధారణం కంటే తక్కువ లేదా ఎక్కువ తినడం" },
  },
  q10_selfworth: {
    hi: { text: "आप खुद के प्रति कितनी बार कठोर रहते हैं या खुद को असफल महसूस करते हैं?", subtext: "आत्म-आलोचना, अपराधबोध या कम आत्मसम्मान" },
    pa: { text: "ਤੁਸੀਂ ਆਪਣੇ ਆਪ ਨਾਲ ਕਿੰਨੀ ਵਾਰ ਬਹੁਤ ਸਖ਼ਤ ਹੁੰਦੇ ਹੋ ਜਾਂ ਅਸਫਲ ਮਹਿਸੂਸ ਕਰਦੇ ਹੋ?", subtext: "ਆਤਮ-ਆਲੋਚਨਾ, ਗਿਲਟ ਜਾਂ ਘੱਟ ਸਵੈ-ਮੁੱਲ" },
    ta: { text: "நீங்கள் உங்கள்மீது அதிகமாக குற்றம் சாட்டுவது அல்லது தோல்வி உணர்வது எவ்வளவு அடிக்கடி?", subtext: "சுயவிமர்சனம், குற்ற உணர்வு அல்லது குறைந்த சுய மதிப்பு" },
    te: { text: "మీరు మీపై ఎంత తరచుగా కఠినంగా ఉంటారు లేదా విఫలమయ్యానని అనిపిస్తుందా?", subtext: "స్వీయ విమర్శ, గిల్ట్ లేదా తక్కువ స్వీయ గౌరవం" },
  },
  q11_tension: {
    hi: { text: "क्या शरीर में तनाव, बेचैनी या असहजता महसूस होती है?", subtext: "तेज़ धड़कन, शरीर में जकड़न या रिलैक्स न कर पाना" },
    pa: { text: "ਕੀ ਸਰੀਰ ਵਿੱਚ ਤਣਾਅ, ਬੇਚੈਨੀ ਜਾਂ ਅਸੁਵਿਧਾ ਮਹਿਸੂਸ ਹੁੰਦੀ ਹੈ?", subtext: "ਤੇਜ਼ ਧੜਕਨ, ਸਰੀਰ ਵਿੱਚ ਖਿਚਾਅ ਜਾਂ ਅਰਾਮ ਨਾ ਆਉਣਾ" },
    ta: { text: "உடலில் பதட்டம், அமைதியின்மை அல்லது சிரமம் உணர்கிறீர்களா?", subtext: "இதய துடிப்பு, உடல் இறுக்கம் அல்லது தளர முடியாமை" },
    te: { text: "మీ శరీరంలో ఒత్తిడి, అసహనం లేదా అసౌకర్యం అనిపిస్తుందా?", subtext: "గుండె వేగంగా కొట్టుకోవడం, శరీర టెన్షన్ లేదా రిలాక్స్ కాలేకపోవడం" },
  },
  q12_hope: {
    hi: { text: "आने वाले कुछ हफ्तों को लेकर आप कितनी उम्मीद महसूस करते हैं?", subtext: "आशावाद और भावनात्मक लचीलापन" },
    pa: { text: "ਅਗਲੇ ਕੁਝ ਹਫ਼ਤਿਆਂ ਬਾਰੇ ਤੁਸੀਂ ਕਿੰਨੀ ਉਮੀਦ ਮਹਿਸੂਸ ਕਰਦੇ ਹੋ?", subtext: "ਆਸ਼ਾਵਾਦ ਅਤੇ ਜਜ਼ਬਾਤੀ ਲਚਕ" },
    ta: { text: "அடுத்த சில வாரங்களைப் பற்றி நீங்கள் எவ்வளவு நம்பிக்கை உணர்கிறீர்கள்?", subtext: "நல்ல நம்பிக்கை மற்றும் உணர்ச்சி மீட்சித்திறன்" },
    te: { text: "రాబోయే కొన్ని వారాల గురించి మీకు ఎంత ఆశాభావం ఉంది?", subtext: "ఆశావాదం మరియు భావోద్వేగ స్థైర్యం" },
  },
};

export const ConversationalScreening: React.FC<ConversationalScreeningProps> = ({
  onOpenCounselor,
}) => {
  const { t, language } = useAppLanguage();
  const [state, setState] = useState<ScreeningState>("welcome");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showCrisis, setShowCrisis] = useState(false);
  const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [greetingInput, setGreetingInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [capturedGreeting, setCapturedGreeting] = useState("");
  const [capturedName, setCapturedName] = useState("");
  const [welcomeError, setWelcomeError] = useState("");
  const [reportResponseRows, setReportResponseRows] = useState<SurveyResponseRow[]>([]);
  const [reportGeneratedAt, setReportGeneratedAt] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Get core questions to ask.
  const questionsToAsk = SCREENING_QUESTIONS.filter(q => q.isCoreScreening);
  const currentQuestion = state === "screening" && currentQuestionIndex < questionsToAsk.length 
    ? questionsToAsk[currentQuestionIndex] 
    : null;

  // Progress calculation
  const answeredCount = Object.keys(answers).length;
  const totalQuestionsCount = questionsToAsk.length;
  const progressPercent = state === "screening" 
    ? (answeredCount / totalQuestionsCount) * 100 
    : 0;

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [state, currentQuestionIndex, capturedGreeting, capturedName]);

  const handleGreetingSubmit = () => {
    const value = greetingInput.trim();
    if (!value) {
      setWelcomeError(t("screening.errorBegin", "Please type hi or hello to begin."));
      return;
    }

    const isGreeting = /\b(hi|hello|hey|namaste|sat sri akal|vanakkam|namaskaram|hola)\b/i.test(value);
    if (!isGreeting) {
      setWelcomeError(t("screening.errorGreeting", "Please start with hi or hello so I can begin the check-in."));
      return;
    }

    setCapturedGreeting(value);
    setGreetingInput("");
    setWelcomeError("");
    setState("name");
  };

  const handleNameSubmit = () => {
    const value = nameInput.trim();
    if (value.length < 2) {
      setWelcomeError(t("screening.errorName", "Please enter your name."));
      return;
    }

    const cleanName = value.slice(0, 40);
    setCapturedName(cleanName);
    setNameInput("");
    setWelcomeError("");
    setState("screening");
  };

  // Handle answer selection
  const handleAnswer = (score: 0 | 1 | 2 | 3) => {
    if (!currentQuestion) return;

    const newAnswers = { ...answers, [currentQuestion.id]: score };
    setAnswers(newAnswers);

    // Simulate thinking delay for better UX
    setIsLoadingNext(true);
    setTimeout(async () => {
      // Check if all questions answered
      if (currentQuestionIndex < questionsToAsk.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setIsLoadingNext(false);
      } else {
        // All questions answered, generate report
        let result = calculateScreeningResult(newAnswers);
        const generatedAt = new Date().toISOString();
        const liveResponseRows: SurveyResponseRow[] = questionsToAsk.map((q) => {
          const answerScore = newAnswers[q.id] ?? 0;
          const answer = EMOJI_SCALE_OPTIONS.find((o) => o.score === answerScore);
          const localizedQuestion = getLocalizedQuestion(q);
          return {
            questionId: q.id,
            questionText: localizedQuestion.text,
            answerLabel: answer ? `${answer.emoji} ${answer.label}` : `Score ${answerScore}`,
            score: answerScore,
          };
        });
        
        // Enrich with ML-based emotion analysis
        const userTexts = questionsToAsk.map(q => {
          const answer = newAnswers[q.id];
          const answerText = EMOJI_SCALE_OPTIONS.find(o => o.score === answer)?.label || '';
          return `${q.text}: ${answerText}`;
        }).filter(t => t.length > 0);
        
        result = await enrichReportWithDataset(result, userTexts);
        
        setScreeningResult(result);
        setReportGeneratedAt(generatedAt);
        setReportResponseRows(liveResponseRows);
        setState("report");
        setIsLoadingNext(false);
      }
    }, 800);
  };

  // Get emoji label for answer
  const getEmojiLabel = (score: number) => {
    const option = EMOJI_SCALE_OPTIONS.find(o => o.score === score);
    return option ? `${option.emoji} ${option.label}` : "";
  };

  const getLocalizedQuestion = (question: typeof questionsToAsk[number]) => {
    if (language === "en") {
      return { text: question.text, subtext: question.subtext };
    }

    const translated = QUESTION_TRANSLATIONS[question.id]?.[language as "hi" | "pa" | "ta" | "te"];
    if (!translated) {
      return { text: question.text, subtext: question.subtext };
    }

    return translated;
  };

  // Build chat messages
  const getChatMessages = () => {
    const messages: ChatMessageItem[] = [];

    if (state === "welcome" || state === "name" || state === "screening") {
      messages.push({
        type: "bot",
        content: t("screening.welcomeTitle", "Hi there. I am here to help you with a quick mental wellness check-in."),
        subtext: t("screening.welcomeSubtext", "Type hi or hello to start the conversation."),
      });

      if (capturedGreeting) {
        messages.push({
          type: "user",
          content: capturedGreeting,
        });
      }

      if (state === "name" || state === "screening") {
        messages.push({
          type: "bot",
          content: t("screening.askName", "Great. What is your name?"),
        });
      }

      if (capturedName) {
        messages.push({
          type: "user",
          content: capturedName,
        });
      }
    }

    // Screening phase
    if (state === "screening") {
      if (currentQuestionIndex === 0) {
        messages.push({
          type: "bot",
          content: t("screening.startQuestions", "Thanks, {{name}}. Let us begin your 12-question check-in.").replace("{{name}}", capturedName),
        });
      }

      // Show all answered questions as messages
      questionsToAsk.slice(0, currentQuestionIndex).forEach((q, idx) => {
        const localized = getLocalizedQuestion(q);
        messages.push({
          type: "bot",
          content: localized.text,
          subtext: localized.subtext,
        });
        if (answers[q.id] !== undefined) {
          messages.push({
            type: "user",
            content: "",
            emojiLabel: getEmojiLabel(answers[q.id]),
          });
        }
      });

      // Show current question
      if (currentQuestion) {
        const localizedCurrent = getLocalizedQuestion(currentQuestion);
        messages.push({
          type: "bot",
          content: localizedCurrent.text,
          subtext: localizedCurrent.subtext,
        });
      }

      // Show loading indicator
      if (isLoadingNext && currentQuestionIndex < questionsToAsk.length) {
        messages.push({
          type: "bot",
          content: t("screening.processing", "✨ Processing..."),
          isLoading: true,
        });
      }
    }

    return messages;
  };

  const messages = getChatMessages();

  return (
    <div className="h-full min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className={`${state === "report" ? "max-w-[1400px]" : "w-full max-w-none"} mx-auto p-4 sm:p-6 lg:p-8`}>
        {/* Crisis Banner */}
        {showCrisis && (
          <CrisisSupportBanner onTalkToCounselor={onOpenCounselor} />
        )}

        {/* Report View */}
        {state === "report" && screeningResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <MentalHealthReportCard
              result={screeningResult}
              respondentName={capturedName}
              completedAt={reportGeneratedAt}
              responseRows={reportResponseRows}
            />
          </motion.div>
        )}

        {/* Chat View */}
        {state !== "report" && (
          <>
            {/* Progress Bar */}
            {state === "screening" && (
              <div className="mb-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {t("screening.questionLabel", "Question")} {Math.min(currentQuestionIndex + 1, totalQuestionsCount)}/{totalQuestionsCount}
                  </span>
                  <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}

            {/* Chat Container */}
            <Card className="h-[calc(100vh-12rem)] min-h-[560px] flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.map((msg, idx) => (
                  <ChatMessage
                    key={`${msg.type}-${idx}-${msg.content}`}
                    type={msg.type}
                    content={msg.content}
                    subtext={msg.subtext}
                    emojiLabel={msg.emojiLabel}
                    isLoading={msg.isLoading}
                  />
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                {state === "welcome" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <Input
                        value={greetingInput}
                        onChange={(e) => setGreetingInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleGreetingSubmit();
                          }
                        }}
                        placeholder={t("screening.greetingPlaceholder", "Type hi or hello")}
                        aria-label="Greeting input"
                      />
                      <Button onClick={handleGreetingSubmit}>
                        {t("screening.send", "Send")}
                      </Button>
                    </div>
                    {welcomeError && (
                      <p className="text-sm text-red-600 dark:text-red-400">{welcomeError}</p>
                    )}
                  </div>
                )}

                {state === "name" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <Input
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleNameSubmit();
                          }
                        }}
                        placeholder={t("screening.placeholderName", "Enter your name")}
                        aria-label="Name input"
                      />
                      <Button onClick={handleNameSubmit}>
                        {t("screening.continue", "Continue")}
                      </Button>
                    </div>
                    {welcomeError && (
                      <p className="text-sm text-red-600 dark:text-red-400">{welcomeError}</p>
                    )}
                  </div>
                )}

                {state === "screening" && currentQuestion && (
                  <EmojiScale onSelect={handleAnswer} disabled={isLoadingNext} />
                )}
              </div>
            </Card>

            {/* Info Text */}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
              ⏱️ {t("screening.eta", "This screening takes about 3-5 minutes")} | {questionsToAsk.length} {t("screening.questions", "questions")}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
