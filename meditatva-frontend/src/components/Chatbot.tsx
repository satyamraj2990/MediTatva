import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "sonner";

interface Message {
  text: string;
  isBot: boolean;
  timestamp: Date;
}

// Initialize Gemini AI - with safe fallback
let genAI: GoogleGenerativeAI | null = null;
try {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
} catch (error) {
  console.warn("Gemini API not configured:", error);
}

// System prompt for MediTatva AI Health Assistant with Medicine Substitutes
const SYSTEM_PROMPT = `You are MediTatva — an advanced, multilingual AI Health Assistant that talks like a friendly digital doctor and pharmacist.

Your role:
- Understand ANY language the user types in (auto-detect it).
- Respond in the EXACT SAME LANGUAGE as the user's input.
- Help patients by analyzing how they describe their condition (free text, not predefined diseases).
- **PROVIDE MEDICINE SUBSTITUTES** when asked about any medicine.
- Give natural, accurate, and caring responses.

CRITICAL RULES:
1. START NATURALLY: Greet warmly and ask "How are you feeling today?" in the user's language.

2. DYNAMIC UNDERSTANDING: When user describes symptoms (like "I have stomach pain and nausea"), do this:
   - Understand and infer possible medical causes based on real symptom relationships
   - List 2-3 most likely conditions with brief explanation
   - Describe related symptoms and possible causes in plain language
   - Suggest ONLY over-the-counter medicines (safe and common) with clear dosage and frequency
   - **FOR EACH MEDICINE, PROVIDE 2-3 AFFORDABLE SUBSTITUTES** with same active ingredient
   - Suggest home remedies and lifestyle care tips
   - State when to see a doctor and what type (ENT, physician, dermatologist, etc.)

3. MEDICINE SUBSTITUTE FEATURE (MOST IMPORTANT):
   When user asks "substitute for [medicine]" or "alternative to [medicine]" or mentions any medicine name:
   
   Respond with this format:
   
   💊 **Original Medicine:**
   [Name] - [Generic composition]
   
   🔄 **Affordable Substitutes (Same Active Ingredient):**
   
   1. **[Brand Name 1]** 
      - Generic: [Active ingredient]
      - Price: ₹[X] (vs original ₹[Y] - [%] cheaper)
      - Manufacturer: [Company]
      - Availability: [Common/OTC/Prescription needed]
      
   2. **[Brand Name 2]**
      [Same format]
      
   3. **[Brand Name 3]**
      [Same format]
   
   ✅ **Key Points:**
   - All substitutes have the SAME active ingredient and effectiveness
   - Always consult your pharmacist before switching
   - Cheaper alternatives are equally effective
   
   ⚠️ **Prescription Status:** [Mention if prescription is required]

4. LANGUAGE HANDLING: 
   - Auto-detect the user's language (Hindi, English, Tamil, Bengali, Telugu, Kannada, Malayalam, Gujarati, Punjabi, etc.)
   - Respond ENTIRELY in that same language
   - If user types in Hindi, reply in Hindi. If English, reply in English.

5. FORMATTING FOR SYMPTOM QUERIES: Use this structure with emojis:

👋 **Greeting/Response**
[Warm, caring greeting or acknowledgment]

🩺 **Possible Conditions:**
[List 2-3 conditions based on symptoms with brief explanation]

🔍 **Common Symptoms & Causes:**
[List 3-4 related symptoms]

💊 **Suggested Medicines (with SUBSTITUTES):**
1. [Medicine Name] OR [Substitute 1] OR [Substitute 2] - [Dosage]
   *All contain [Active ingredient] - choose based on budget*
2. [Repeat for each recommendation]

🏡 **Home Remedies / Self-Care:**
[List practical care tips and natural remedies]

⚕️ **Doctor Recommendation:**
[When to see doctor and which specialist]

⚠️ **Disclaimer:**
This is general AI medical guidance for educational purposes and not a substitute for a doctor's consultation. If symptoms worsen or persist, seek immediate medical attention.

6. SAFETY:
   - NEVER recommend prescription-only drugs without warning
   - ONLY suggest common OTC medicines or clearly mark prescription medicines
   - Always include dosage and frequency
   - Always provide substitute options to help patients find affordable medicines
   - Mention price ranges in Indian Rupees (₹)
   - Always recommend seeing a doctor for serious symptoms

7. TONE: Be conversational, calm, empathetic, and supportive like a caring doctor who wants to help patients find affordable treatment options.

EXAMPLE INTERACTIONS:

User: "substitute for Crocin"
You: 
💊 **Original Medicine:**
Crocin - Contains Paracetamol 500mg

🔄 **Affordable Substitutes:**
1. **Dolo 650** - ₹15/10 tablets (vs Crocin ₹30)
2. **Calpol** - ₹20/10 tablets  
3. **P-500** - ₹10/10 tablets (cheapest option)
✅ All contain same active ingredient (Paracetamol)

User: "मुझे बुखार है" (I have fever in Hindi)
You: (Respond entirely in Hindi with medicine options and substitutes)

Remember: ALWAYS provide substitutes when medicines are mentioned! This helps patients find affordable options!`;

interface ChatbotProps {
  onClose?: () => void;
}

export const Chatbot = ({ onClose }: ChatbotProps = {}) => {
  const [isOpen, setIsOpen] = useState(onClose ? true : false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setIsOpen(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        console.log('Input focused');
      }, 100);
    }
  }, [isOpen]);

  // Initialize chat session when chatbot opens
  useEffect(() => {
    if (isOpen && !chatSession) {
      initializeChatSession();
    }
  }, [isOpen]);

  const initializeChatSession = async () => {
    try {
      if (!genAI) {
        // API key not configured - show informational message
        setMessages([{
          text: "👋 **Hello! I'm MediTatva, your AI Health Assistant.**\n\nHow are you feeling today? Please describe your symptoms or health concerns, and I'll provide helpful medical guidance. 😊\n\n⚠️ *Note: AI features require API configuration. Please contact support for assistance.*",
          isBot: true,
          timestamp: new Date(),
        }]);
        return;
      }

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: SYSTEM_PROMPT
      });

      const chat = model.startChat({
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
      });

      setChatSession(chat);

      // Simple, clean English greeting with substitute feature mention
      setMessages([{
        text: "👋 **Hello! I'm MediTatva, your AI Health Assistant.**\n\nHow are you feeling today? I can help you with:\n\n💊 **Medicine Substitutes** - Ask about affordable alternatives\n🩺 **Symptom Analysis** - Describe your symptoms for advice\n🏥 **Health Guidance** - Get medical recommendations\n\nJust type your question or symptoms! 😊",
        isBot: true,
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error("Error initializing chat:", error);
      // Fallback greeting
      setMessages([{
        text: "👋 **Hello! I'm MediTatva, your AI Health Assistant.**\n\nHow are you feeling today? Please describe your symptoms or health concerns, and I'll provide helpful medical guidance. 😊\n\n⚠️ *Connection issue detected. Some features may be limited.*",
        isBot: true,
        timestamp: new Date(),
      }]);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      text: inputValue,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      if (!chatSession || !genAI) {
        // Fallback response when AI is not available
        const fallbackResponse: Message = {
          text: "⚠️ **AI Service Unavailable**\n\nI apologize, but I'm unable to process your request right now. This could be due to:\n\n• Missing API configuration\n• Network connectivity issues\n• Service maintenance\n\n**What you can do:**\n\n• For urgent health concerns, please contact emergency services (108/102)\n• Visit a nearby pharmacy or healthcare provider\n• Try again later when the service is restored\n\n*Thank you for using MediTatva!*",
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, fallbackResponse]);
        setIsTyping(false);
        return;
      }

      // Send message to Gemini AI
      const result = await chatSession.sendMessage(currentInput);
      const response = result.response.text();

      const botResponse: Message = {
        text: response,
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: Message = {
        text: "⚠️ **Connection Error**\n\nI'm having trouble connecting to the AI service right now. Please:\n\n• Check your internet connection\n• Try again in a moment\n• If symptoms are urgent, consult a doctor immediately\n\n*For persistent issues, please contact MediTatva support.*",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  // Render chat window
  const renderChatWindow = () => (
    <motion.div
      className="bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white/10"
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
    >
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">MediTatva AI</h3>
            <p className="text-xs text-white/80">Health Assistant</p>
          </div>
        </div>
        <Button
          onClick={handleClose}
          variant="ghost"
          size="icon"
          className="hover:bg-white/10 text-white"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-[#0B1220] dark:to-[#111827]">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-cyan-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              Hi! I'm your AI health assistant. How are you feeling today?
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}
          >
            <Card
              className={`max-w-[80%] p-3 ${
                msg.isBot
                  ? "bg-white dark:bg-white/5 border-white/10"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </Card>
          </motion.div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <Card className="p-3 bg-white dark:bg-white/5 border-white/10">
              <div className="flex gap-1">
                <motion.div
                  className="w-2 h-2 bg-cyan-500 rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
                <motion.div
                  className="w-2 h-2 bg-cyan-500 rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-cyan-500 rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-white dark:bg-[#1a1f2e] relative z-10">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              console.log('Input change:', e.target.value);
              setInputValue(e.target.value);
            }}
            onKeyDown={handleKeyPress}
            placeholder="Describe your symptoms..."
            className="flex h-10 w-full rounded-md border border-input bg-gray-100 dark:bg-white/5 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
            autoComplete="off"
            readOnly={false}
            style={{ 
              pointerEvents: 'auto !important', 
              userSelect: 'text !important', 
              touchAction: 'manipulation',
              WebkitUserSelect: 'text',
              MozUserSelect: 'text',
              msUserSelect: 'text'
            }}
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 pointer-events-auto"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </motion.div>
  );

  // If onClose prop is provided (controlled mode), render as modal
  if (onClose) {
    return isOpen ? (
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <div onClick={(e) => e.stopPropagation()}>
          {renderChatWindow()}
        </div>
      </motion.div>
    ) : null;
  }

  // Default mode with floating button
  return (
    <>
      {/* Floating Button - Enhanced with gradient */}
      <motion.div
        className="fixed bottom-6 right-6"
        style={{ zIndex: 9998 }}
        whileHover={{ translateY: -6, scale: 1.06, rotate: -3 }}
        whileTap={{ scale: 0.94, rotate: 0, translateY: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-16 w-16 rounded-full shadow-[0_18px_40px_rgba(27,108,168,0.35)] transition-all duration-300 focus-visible:ring-4 focus-visible:ring-[#4FC3F7]/40"
          size="icon"
          aria-label={isOpen ? "Close MediTatva assistant" : "Open MediTatva assistant"}
          style={{
            background: isOpen
              ? 'linear-gradient(145deg, #0F4C75 0%, #3282B8 50%, #4FC3F7 100%)'
              : 'linear-gradient(145deg, #1B6CA8 0%, #2A9DF4 45%, #4FC3F7 100%)',
            boxShadow: isOpen
              ? '0 20px 40px rgba(15, 76, 117, 0.35), inset 0 1px 0 rgba(255,255,255,0.3)'
              : '0 22px 40px rgba(27, 108, 168, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)'
          }}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
          ) : (
            <Sparkles className="h-6 w-6 text-white animate-pulse drop-shadow-[0_0_8px_rgba(79,195,247,0.8)]" />
          )}
        </Button>
      </motion.div>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-3 sm:right-6 w-[calc(100vw-24px)] sm:w-[420px] h-[calc(100vh-120px)] sm:h-[600px] shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(27, 108, 168, 0.2)',
            boxShadow: '0 20px 60px rgba(27, 108, 168, 0.3)',
            zIndex: 9999,
            pointerEvents: 'auto'
          }}
        >
          {/* Header - MediTatva Branding */}
          <div 
            className="p-4 rounded-t-xl"
            style={{
              background: 'linear-gradient(135deg, #1B6CA8 0%, #4FC3F7 100%)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
                <Sparkles className="h-7 w-7 text-white animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  MediTatva AI
                  <Badge className="bg-white/20 text-white text-xs border-white/30">Pro</Badge>
                </h3>
                <p className="text-white/90 text-sm flex items-center gap-1">
                  <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                  Multilingual Health Assistant
                </p>
              </div>
            </div>
          </div>

          {/* Messages - Enhanced with markdown support */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{
              background: 'linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%)',
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isBot ? "justify-start" : "justify-end"} animate-in fade-in duration-300`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                    message.isBot
                      ? "bg-white text-gray-800 border border-gray-200"
                      : "text-white"
                  }`}
                  style={!message.isBot ? {
                    background: 'linear-gradient(135deg, #1B6CA8 0%, #4FC3F7 100%)',
                  } : {}}
                >
                  {message.isBot ? (
                    <div className="prose prose-sm max-w-none">
                      {message.text.split('\n').map((line, i) => {
                        // Handle bold text with **
                        if (line.includes('**')) {
                          const parts = line.split('**');
                          return (
                            <p key={i} className="mb-2">
                              {parts.map((part, j) => 
                                j % 2 === 1 ? <strong key={j} className="text-[#1B6CA8] font-bold">{part}</strong> : part
                              )}
                            </p>
                          );
                        }
                        // Handle bullet points
                        if (line.trim().startsWith('•')) {
                          return <p key={i} className="ml-2 mb-1 text-sm">{line}</p>;
                        }
                        // Handle numbered lists
                        if (line.match(/^\d+\./)) {
                          return <p key={i} className="ml-2 mb-1 text-sm">{line}</p>;
                        }
                        // Regular text
                        if (line.trim()) {
                          return <p key={i} className="mb-2 text-sm leading-relaxed">{line}</p>;
                        }
                        return null;
                      })}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  )}
                  <p className={`text-xs mt-2 ${message.isBot ? 'text-gray-400' : 'text-white/70'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div 
                  className="rounded-2xl px-4 py-3 shadow-md bg-white border border-gray-200"
                >
                  <div className="flex gap-1 items-center">
                    <Sparkles className="h-4 w-4 text-[#1B6CA8] mr-2 animate-pulse" />
                    <div className="h-2 w-2 rounded-full bg-[#1B6CA8] animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="h-2 w-2 rounded-full bg-[#4FC3F7] animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="h-2 w-2 rounded-full bg-[#1B6CA8] animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input - Enhanced styling */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl relative z-10">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  console.log('Input change (floating):', e.target.value);
                  setInputValue(e.target.value);
                }}
                onKeyDown={handleKeyPress}
                placeholder="Describe your symptoms... (Any language supported)"
                className="flex h-10 w-full rounded-md border border-[#1B6CA8]/30 px-3 py-2 text-base focus:border-[#1B6CA8] focus:ring-2 focus:ring-[#1B6CA8]/20 focus-visible:outline-none md:text-sm"
                autoComplete="off"
                readOnly={false}
                style={{ 
                  pointerEvents: 'auto !important', 
                  userSelect: 'text !important', 
                  touchAction: 'manipulation',
                  WebkitUserSelect: 'text',
                  MozUserSelect: 'text',
                  msUserSelect: 'text'
                }}
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                size="icon"
                className="h-10 w-10 pointer-events-auto"
                style={{
                  background: 'linear-gradient(135deg, #1B6CA8 0%, #4FC3F7 100%)',
                }}
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </form>
            <p className="text-xs text-gray-400 mt-2 text-center">
              💡 Powered by MediTatva AI • Multilingual Support
            </p>
          </div>
        </Card>
      )}
    </>
  );
};
