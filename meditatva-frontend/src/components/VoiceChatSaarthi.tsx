import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "sonner";

// Initialize Gemini AI
let genAI: GoogleGenerativeAI | null = null;
try {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
} catch (error) {
  console.warn("Gemini API not configured:", error);
}

// AI Saarthi Voice System Prompt - Medical Guidance
const VOICE_SAARTHI_PROMPT = `You are AI Saarthi — a caring medical wellness assistant for MediTatva.

Your role:
- Provide helpful medical guidance for common health issues
- Speak in a calm, reassuring tone
- Be empathetic and supportive
- Use simple, clear language

Response rules:
1. Auto-detect user's language (Hindi/English) and respond in the SAME language
2. For health symptoms (fever, headache, cold, etc.):
   - Acknowledge their concern with empathy
   - Suggest 2-3 common OTC medicines with dosage
   - Give 2-3 home remedies or precautions
   - Mention when to see a doctor
3. Keep responses conversational but informative (4-6 sentences)
4. Use natural speaking style, not bullet points
5. Include medicine substitutes when possible

Example for "मुझे बुखार है":
"मुझे सुनकर दुख हुआ। बुखार के लिए आप Dolo 650 या Crocin ले सकते हैं, हर 6 घंटे में। खूब पानी पिएं और आराम करें। अगर बुखार 3 दिन से ज्यादा रहे या 102 से ऊपर हो, तो डॉक्टर से मिलें। आप कब से बुखार है?"

Remember: Provide practical medical advice in a caring voice tone.`;

type VoiceState = "idle" | "listening" | "speaking" | "processing";

interface VoiceChatSaarthiProps {
  onClose: () => void;
}

export const VoiceChatSaarthi = ({ onClose }: VoiceChatSaarthiProps) => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [lastResponse, setLastResponse] = useState<string>("");
  const [chatSession, setChatSession] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState("hi-IN");
  const [isCallActive, setIsCallActive] = useState(false); // Track call state

  // Refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceStateRef = useRef<VoiceState>("idle"); // Track state in ref for callbacks

  // Check browser support
  useEffect(() => {
    const hasWebSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const hasSynthesis = 'speechSynthesis' in window;
    
    if (!hasWebSpeech || !hasSynthesis) {
      setIsSupported(false);
      toast.error("Your browser doesn't support voice chat. Please use Chrome or Edge.");
    }
  }, []);

  // Initialize AI chat session
  useEffect(() => {
    initializeChatSession();
  }, []);

  const initializeChatSession = async () => {
    try {
      if (!genAI) {
        console.error("Gemini AI not initialized - API key missing");
        toast.error("AI service is not configured. Please contact support.");
        return;
      }

      console.log("🔧 Initializing AI chat session for voice...");
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash"
      });

      const chat = model.startChat({
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 800,
        },
        history: [
          {
            role: "user",
            parts: [{ text: "You are AI Saarthi. " + VOICE_SAARTHI_PROMPT }],
          },
          {
            role: "model",
            parts: [{ text: "नमस्ते। मैं सार्थी हूं। आज आप कैसा महसूस कर रहे हैं?" }],
          },
        ],
      });

      setChatSession(chat);
      console.log("✅ Chat session initialized successfully");

      // Start call automatically with greeting
      setIsCallActive(true);
      const greeting = "नमस्ते। मैं सार्थी हूं। आज आप कैसा महसूस कर रहे हैं?";
      setLastResponse(greeting);
      await speakText(greeting);
    } catch (error) {
      console.error("❌ Error initializing chat:", error);
      console.error("Error details:", error instanceof Error ? error.message : String(error));
      toast.error("Failed to initialize AI Saarthi: " + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Initialize speech recognition
  const initRecognition = () => {
    if (recognitionRef.current) {
      console.log("🛑 Stopping existing recognition");
      recognitionRef.current.stop();
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false; // Stop after one utterance
    recognition.interimResults = false;
    recognition.lang = currentLanguage;

    recognition.onstart = () => {
      console.log("🎙️ STATE: Listening started");
      setVoiceState("listening");
      voiceStateRef.current = "listening";
    };

    recognition.onresult = async (event: any) => {
      const spokenText = event.results[0][0].transcript;
      console.log("📝 USER SPOKE:", spokenText);
      
      // CRITICAL: Stop recognition immediately
      recognition.stop();
      
      setTranscript(spokenText);
      setVoiceState("processing");
      voiceStateRef.current = "processing";
      console.log("⚙️ STATE: Processing");

      // Get AI response
      await getAIResponse(spokenText);
    };

    recognition.onerror = (event: any) => {
      console.error("❌ Speech recognition error:", event.error);
      
      if (event.error === "no-speech") {
        toast.info("I didn't hear anything. Listening again...");
        // Auto-restart if call is active
        if (isCallActive && voiceStateRef.current !== "speaking") {
          setTimeout(() => startListening(), 1000);
        } else {
          setVoiceState("idle");
          voiceStateRef.current = "idle";
        }
      } else if (event.error === "not-allowed") {
        toast.error("Microphone permission denied. Please enable it.");
        setVoiceState("idle");
        voiceStateRef.current = "idle";
        setIsCallActive(false);
      } else {
        toast.error("Voice error. Restarting...");
        if (isCallActive) {
          setTimeout(() => startListening(), 1000);
        } else {
          setVoiceState("idle");
          voiceStateRef.current = "idle";
        }
      }
    };

    recognition.onend = () => {
      console.log("🎙️ Recognition ended. Current state:", voiceStateRef.current);
      
      // Only auto-restart if we're still idle and call is active
      if (voiceStateRef.current === "idle" && isCallActive) {
        console.log("🔄 Auto-restarting listening");
        setTimeout(() => startListening(), 500);
      }
    };

    recognitionRef.current = recognition;
  };

  // Start listening
  const startListening = () => {
    if (!isSupported) {
      toast.error("Voice chat is not supported in your browser");
      return;
    }

    // CRITICAL: Don't listen while speaking
    if (voiceStateRef.current === "speaking") {
      console.log("⚠️ Cannot listen while speaking");
      return;
    }

    // Cancel any ongoing speech before listening
    if (window.speechSynthesis.speaking) {
      console.log("🛑 Canceling ongoing speech");
      window.speechSynthesis.cancel();
    }

    console.log("▶️ Starting listening...");
    initRecognition();
    try {
      recognitionRef.current?.start();
    } catch (error) {
      console.error("❌ Failed to start recognition:", error);
      // If already started, ignore
    }
  };

  // Stop listening
  const stopListening = () => {
    console.log("⏹️ Stopping listening");
    recognitionRef.current?.stop();
    setVoiceState("idle");
    voiceStateRef.current = "idle";
  };

  // Get AI response with robust error handling
  const getAIResponse = async (userMessage: string) => {
    try {
      console.log("📤 SENDING TO AI:", userMessage);
      
      // Check if chat session exists
      if (!chatSession) {
        console.error("❌ Chat session not initialized");
        throw new Error("Chat session not initialized");
      }

      // Add language context to help AI respond appropriately
      const messageWithContext = currentLanguage === "hi-IN" && !userMessage.match(/[a-zA-Z]/) 
        ? `[हिंदी में जवाब दें] ${userMessage}`
        : userMessage;

      // Send message with timeout
      const result = await Promise.race([
        chatSession.sendMessage(messageWithContext),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("AI response timeout")), 15000)
        )
      ]) as any;

      // Validate response
      if (!result || !result.response) {
        throw new Error("Invalid AI response structure");
      }

      const responseText = result.response.text();
      console.log("📥 AI RAW RESPONSE:", responseText);

      // Check if response is empty
      if (!responseText || responseText.trim().length === 0) {
        throw new Error("Empty AI response");
      }
      
      // Clean up markdown formatting for voice
      const cleanResponse = responseText
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/\n+/g, ". ")
        .replace(/[#]+/g, "")
        .replace(/\[.*?\]/g, "") // Remove language tags
        .trim();

      console.log("✅ CLEAN RESPONSE:", cleanResponse);
      setLastResponse(cleanResponse);
      
      // CRITICAL: Speak the response
      await speakText(cleanResponse);
      
    } catch (error: any) {
      console.error("❌ AI Response Error:", error);
      console.error("Error type:", error?.constructor?.name);
      console.error("Error message:", error?.message);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      
      // Provide meaningful, calm fallback based on language and error type
      let fallbackMsg: string;
      
      // Check for quota exceeded error
      if (error?.message?.includes("quota") || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
        if (currentLanguage === "hi-IN") {
          fallbackMsg = "मुझे खेद है, अभी बहुत सारे लोग मुझसे बात कर रहे हैं। कृपया एक मिनट में फिर से कोशिश करें।";
        } else {
          fallbackMsg = "Sorry, I'm talking to many people right now. Please try again in a minute.";
        }
        toast.error("API quota exceeded. Please wait 1 minute.", { duration: 5000 });
      } else if (currentLanguage === "hi-IN") {
        if (error?.message?.includes("timeout")) {
          fallbackMsg = "मुझे थोड़ा समय लग रहा है। कृपया फिर से बताएं।";
        } else if (error?.message?.includes("session")) {
          fallbackMsg = "मैं यहाँ हूं। आप कैसा महसूस कर रहे हैं?";
        } else {
          fallbackMsg = "क्या आप फिर से बता सकते हैं?";
        }
      } else {
        if (error?.message?.includes("timeout")) {
          fallbackMsg = "I'm taking a moment. Please try again.";
        } else if (error?.message?.includes("session")) {
          fallbackMsg = "I'm here. How are you feeling?";
        } else {
          fallbackMsg = "Could you share that again?";
        }
      }
      
      setLastResponse(fallbackMsg);
      await speakText(fallbackMsg);
    }
  };

  // Text-to-speech - CRITICAL VOICE OUTPUT
  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      console.log("🔊 SPEAKING:", text);
      console.log("🔊 TEXT LENGTH:", text.length, "characters");
      
      // Validate text
      if (!text || text.trim().length === 0) {
        console.error("❌ Cannot speak empty text");
        setVoiceState("idle");
        voiceStateRef.current = "idle";
        resolve();
        return;
      }

      // CRITICAL: Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice for calm, mindful tone
      utterance.rate = 0.9; // Slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = currentLanguage;

      // Try to use a suitable voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith(currentLanguage.split("-")[0])
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log("🔊 Using voice:", preferredVoice.name);
      }

      utterance.onstart = () => {
        console.log("🔊 STATE: Speaking started");
        setVoiceState("speaking");
        voiceStateRef.current = "speaking";
      };

      utterance.onend = () => {
        console.log("✅ STATE: Speaking finished - COMPLETE");
        setVoiceState("idle");
        voiceStateRef.current = "idle";
        
        // CRITICAL: Auto-resume listening after speaking (only if call is active)
        if (isCallActive) {
          console.log("🔄 Auto-resuming listening in 1.5 seconds...");
          setTimeout(() => {
            if (voiceStateRef.current === "idle" && isCallActive) {
              startListening();
            }
          }, 1500);
        }
        
        resolve();
      };

      utterance.onerror = (error) => {
        console.error("❌ Speech synthesis error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        setVoiceState("idle");
        voiceStateRef.current = "idle";
        
        // Still try to resume listening
        if (isCallActive) {
          setTimeout(() => startListening(), 1000);
        }
        
        resolve();
      };

      // Add boundary event to detect progress
      utterance.onboundary = (event) => {
        console.log("🔊 Speaking progress:", event.charIndex, "/", text.length);
      };

      synthRef.current = utterance;
      
      // CRITICAL: Actually speak
      try {
        window.speechSynthesis.speak(utterance);
        console.log("✅ Speech queued successfully");
        
        // Add a watchdog to detect if speech is stuck
        const watchdog = setTimeout(() => {
          if (window.speechSynthesis.speaking) {
            console.log("⚠️ Speech still running after 30s");
          }
        }, 30000);
        
        utterance.onend = () => {
          clearTimeout(watchdog);
          console.log("✅ STATE: Speaking finished - COMPLETE");
          setVoiceState("idle");
          voiceStateRef.current = "idle";
          
          if (isCallActive) {
            console.log("🔄 Auto-resuming listening in 1.5 seconds...");
            setTimeout(() => {
              if (voiceStateRef.current === "idle" && isCallActive) {
                startListening();
              }
            }, 1500);
          }
          
          resolve();
        };
      } catch (error) {
        console.error("❌ Failed to queue speech:", error);
        setVoiceState("idle");
        voiceStateRef.current = "idle";
        resolve();
      }
    });
  };

  // Change language
  const toggleLanguage = () => {
    const languages = ["en-IN", "hi-IN"];
    const currentIndex = languages.indexOf(currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    setCurrentLanguage(languages[nextIndex]);
    toast.success(`Language changed to ${languages[nextIndex] === "en-IN" ? "English" : "Hindi"}`);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up voice chat");
      setIsCallActive(false);
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();
    };
  }, []);

  // Update ref when state changes
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  // Get status message
  const getStatusMessage = () => {
    switch (voiceState) {
      case "listening":
        return "Listening to you...";
      case "speaking":
        return "Saarthi is speaking...";
      case "processing":
        return "Processing...";
      default:
        return "Tap microphone to start";
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (voiceState) {
      case "listening":
        return "from-green-500 to-emerald-600";
      case "speaking":
        return "from-blue-500 to-cyan-600";
      case "processing":
        return "from-purple-500 to-pink-600";
      default:
        return "from-gray-400 to-gray-500";
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md"
      >
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-950 border-0 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center relative">
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>

            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center ring-4 ring-white/30 mb-2">
                <motion.div
                  animate={voiceState === "speaking" ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Volume2 className="w-10 h-10 text-white" />
                </motion.div>
              </div>
              <h2 className="text-2xl font-bold text-white">AI Saarthi</h2>
              <p className="text-white/90 text-sm">Your Calm Wellness Guide</p>
              <Badge className="bg-white/20 text-white border-white/30 mt-2">
                {currentLanguage === "en-IN" ? "🇮🇳 English" : "🇮🇳 हिंदी"}
              </Badge>
            </div>
          </div>

          {/* Voice State Display */}
          <div className="p-8">
            {/* Status Badge */}
            <div className="text-center mb-6">
              <motion.div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getStatusColor()} text-white text-sm font-medium shadow-lg`}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {voiceState === "listening" && <Mic className="w-4 h-4 animate-pulse" />}
                {voiceState === "speaking" && <Volume2 className="w-4 h-4 animate-pulse" />}
                {getStatusMessage()}
              </motion.div>
            </div>

            {/* Visual Feedback */}
            <div className="relative h-32 flex items-center justify-center mb-6">
              <AnimatePresence>
                {voiceState === "listening" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute"
                  >
                    <motion.div
                      className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 opacity-30"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 opacity-50"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    />
                  </motion.div>
                )}

                {voiceState === "speaking" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="flex gap-2"
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 bg-gradient-to-t from-blue-500 to-cyan-500 rounded-full"
                        animate={{
                          height: [20, 60, 20],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </motion.div>
                )}

                {voiceState === "processing" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, rotate: 360 }}
                    exit={{ opacity: 0 }}
                    transition={{ rotate: { duration: 2, repeat: Infinity, ease: "linear" } }}
                    className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
                  />
                )}

                {voiceState === "idle" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center"
                  >
                    <Phone className="w-12 h-12 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Transcript Display */}
            <AnimatePresence>
              {(transcript || lastResponse) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 space-y-3"
                >
                  {transcript && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">You said:</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{transcript}</p>
                    </div>
                  )}
                  {lastResponse && (
                    <div className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-xl p-4 shadow-md">
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">Saarthi:</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{lastResponse}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <div className="flex gap-4 justify-center items-center">
              {/* Main Mic Button */}
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={voiceState === "listening" ? stopListening : startListening}
                  disabled={voiceState === "speaking" || voiceState === "processing" || !isSupported}
                  size="lg"
                  className={`w-20 h-20 rounded-full shadow-2xl ${
                    voiceState === "listening"
                      ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                      : "bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  }`}
                >
                  {voiceState === "listening" ? (
                    <MicOff className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className="w-8 h-8 text-white" />
                  )}
                </Button>
              </motion.div>

              {/* Language Toggle */}
              <Button
                onClick={toggleLanguage}
                variant="outline"
                className="rounded-full px-4 py-2 text-sm"
                disabled={voiceState !== "idle"}
              >
                {currentLanguage === "en-IN" ? "Switch to Hindi" : "Switch to English"}
              </Button>
            </div>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {voiceState === "idle" && "Tap the microphone to start talking with Saarthi"}
                {voiceState === "listening" && "Speak naturally... Saarthi is listening"}
                {voiceState === "speaking" && "Listen to Saarthi's response..."}
                {voiceState === "processing" && "Saarthi is thinking..."}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-gray-800 dark:to-indigo-900 px-6 py-4 text-center border-t border-indigo-200 dark:border-indigo-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              🎙️ Browser-based voice chat • 100% Free • Web Speech API
            </p>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
