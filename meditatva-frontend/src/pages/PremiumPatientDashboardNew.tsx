import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { useAppLanguage } from "@/contexts/LanguageContext";
import { 
  Home, MapPin, Search, ShoppingCart,
  LogOut, Camera, Phone, Pill, Calendar, Brain,
  Bell, Heart, ChevronRight, FileBarChart, Activity, TrendingDown
} from "lucide-react";
import { toast } from "sonner";

// Modular Components
import { PatientHeader } from "@/components/patient/PatientHeader";
import { PatientProfile } from "@/components/patient/PatientProfile";
import { PatientSidebarMenu } from "@/components/patient/PatientSidebarMenu";

// Page Components
import { NearbyMedicalStoresPage } from "@/pages/NearbyMedicalStoresPage";
import { FindMedicineEnhanced } from "@/pages/FindMedicineEnhanced";
import { MedicineOrders } from "@/components/MedicineOrders";
import { PrescriptionScanner } from "@/components/PrescriptionScanner";
import { MoodAnalyzerPanel } from "@/components/patient/MoodAnalyzerPanel";
import { MediCallSarthi } from "@/components/MediCallSarthi";
import { Chatbot } from "@/components/Chatbot";
import { MyMedicineCabinetPage } from "@/pages/MyMedicineCabinetPage";
import { AppointmentsSection } from "@/components/AppointmentsSection";
import { MedicineAnalyser } from "@/components/MedicineAnalyser";
import { VoiceChatSaarthi } from "@/components/VoiceChatSaarthi";
import SimpleVoiceAssistant from "@/components/SimpleVoiceAssistant";

type Section = "home" | "saarthi" | "nearby" | "find-medicine" | "orders" | "cabinet" | "appointments" | "mood-analyzer" | "chat";

const PremiumPatientDashboardInner = () => {
  const navigate = useNavigate();
  const { t } = useAppLanguage();
  const [activeSection, setActiveSection] = useState<Section>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });
  const [showScanner, setShowScanner] = useState(false);
  const [showMoodAnalyzer, setShowMoodAnalyzer] = useState(false);
  const [showMediCallSarthi, setShowMediCallSarthi] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [showSimpleVoice, setShowSimpleVoice] = useState(false);
  const [medicineToolTab, setMedicineToolTab] = useState<'find' | 'analyze'>('find');

  const menuLabels = {
    home: t("dashboard.title", "Dashboard"),
    homeDesc: t("dashboard.overview", "Wellness overview"),
    nearby: t("menu.nearby", "Nearby Stores"),
    nearbyDesc: t("menu.nearbyDesc", "Find pharmacies"),
    findMedicine: t("menu.findMedicine", "Find Medicine"),
    findMedicineDesc: t("menu.findMedicineDesc", "Search meds"),
    orders: t("menu.orders", "My Orders"),
    ordersDesc: t("menu.ordersDesc", "Track orders"),
    cabinet: t("menu.cabinet", "Cabinet"),
    cabinetDesc: t("menu.cabinetDesc", "Prescriptions"),
    appointments: t("menu.appointments", "Appointments"),
    appointmentsDesc: t("menu.appointmentsDesc", "Book & manage"),
    moodAnalyzer: t("menu.dashboard", "Mood Analyzer"),
    moodAnalyzerDesc: t("menu.dashboardDesc", "Expression and voice mood insights"),
    saarthi: t("dashboard.aiAssistant", "Saarthi - AI Voice"),
    saarthiDesc: t("dashboard.aiAssistantDesc", "Get health advice"),
  };

  // Ensure auth - redirect to login if not authenticated  
  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    const role = localStorage.getItem("userRole");
    if (!isAuth || role !== "patient") {
      navigate("/login?role=patient", { replace: true });
    }
    // Reset active section to home on mount
    setActiveSection("home");
  }, [navigate]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarCollapsed(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { id: "home" as Section, icon: Home, label: menuLabels.home, description: menuLabels.homeDesc },
    { id: "nearby" as Section, icon: MapPin, label: menuLabels.nearby, description: menuLabels.nearbyDesc },
    { id: "find-medicine" as Section, icon: Search, label: menuLabels.findMedicine, description: menuLabels.findMedicineDesc },
    { id: "orders" as Section, icon: ShoppingCart, label: menuLabels.orders, description: menuLabels.ordersDesc },
    { id: "cabinet" as Section, icon: Pill, label: menuLabels.cabinet, description: menuLabels.cabinetDesc },
    { id: "appointments" as Section, icon: Calendar, label: menuLabels.appointments, description: menuLabels.appointmentsDesc },
    { id: "mood-analyzer" as Section, icon: Camera, label: menuLabels.moodAnalyzer, description: menuLabels.moodAnalyzerDesc },
    { id: "chat" as Section, icon: Phone, label: menuLabels.saarthi, description: menuLabels.saarthiDesc },
  ];
  
  // Filter to remove any duplicate IDs (keep first occurrence)
  const displayMenuItems = Array.from(
    new Map(menuItems.map(item => [item.id, item] as const)).values()
  );

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    toast.success(t("actions.logout", "Logout") + " successful");
    navigate("/login");
  };

  const quickStats = [
    { label: t("dashboard.upcoming", "Upcoming"), value: "3", icon: Calendar, gradient: "from-blue-500 to-cyan-400", change: "+2" },
    { label: t("dashboard.activeOrders", "Active Orders"), value: "5", icon: ShoppingCart, gradient: "from-green-500 to-emerald-400", change: "+1" },
    { label: t("dashboard.reminders", "Reminders"), value: "12", icon: Bell, gradient: "from-orange-500 to-amber-400", change: "0" },
    { label: t("patient.healthScore", "Health Score"), value: "91%", icon: Heart, gradient: "from-emerald-500 to-teal-400", change: "+5%" },
  ];

  const renderContent = () => {
    if (showScanner) {
      return (
        <div className="max-w-4xl mx-auto">
          <PrescriptionScanner isOpen={showScanner} onClose={() => setShowScanner(false)} />
        </div>
      );
    }

    const moodAnalyzerCard = (
      <div className="grid grid-cols-1 gap-6">
        <Card
          onClick={() => setShowMoodAnalyzer(true)}
          className="p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20 border-2 border-emerald-200 dark:border-emerald-700/20 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.01]"
        >
          <div className="text-center space-y-3">
            <div className="mx-auto w-fit p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-md">
              <Camera className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-300">Dashboard</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Real-time facial expression and voice emotion analysis with confidence tracking</p>
          </div>
        </Card>
      </div>
    );

    switch (activeSection) {
      case "nearby":
        return <NearbyMedicalStoresPage />;
      case "find-medicine":
        return (
          <div className="space-y-6">
            {/* Horizontal Navigation Tabs */}
            <div className="rounded-2xl p-2 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/90 dark:to-slate-950/95 backdrop-blur-xl border-2 border-white/20 dark:border-slate-700/30 shadow-xl flex gap-3">
              <button
                onClick={() => setMedicineToolTab('find')}
                className={`flex-1 px-6 py-3 rounded-lg flex items-center justify-center gap-3 transition-all duration-200 font-medium ${
                  medicineToolTab === 'find'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Search className="h-5 w-5" />
                <span>Find Medicine</span>
              </button>

              <button
                onClick={() => setMedicineToolTab('analyze')}
                className={`flex-1 px-6 py-3 rounded-lg flex items-center justify-center gap-3 transition-all duration-200 font-medium ${
                  medicineToolTab === 'analyze'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <TrendingDown className="h-5 w-5" />
                <span>Analyser</span>
              </button>
            </div>

            {/* Main Content Area */}
            <div className="rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/90 dark:to-slate-950/95 backdrop-blur-xl border-2 border-white/20 dark:border-slate-700/30 shadow-xl overflow-hidden">
              <div className="p-8">
                {medicineToolTab === 'find' ? (
                  <FindMedicineEnhanced />
                ) : (
                  <MedicineAnalyser />
                )}
              </div>
            </div>
          </div>
        );
      case "orders":
        return <MedicineOrders />;
      case "cabinet":
        return <MyMedicineCabinetPage />;
      case "appointments":
        return <AppointmentsSection />;
      case "mood-analyzer":
        return (
          <div className="space-y-6">
            <Card className="border-cyan-200 dark:border-cyan-900/40 bg-gradient-to-r from-cyan-50 via-white to-indigo-50 dark:from-cyan-950/20 dark:via-slate-900 dark:to-indigo-950/20">
              <CardHeader>
                <CardTitle className="text-2xl">{t("menu.moodAnalyzer", "Mood Analyzer")}</CardTitle>
                <CardDescription>
                  {t("menu.moodAnalyzerDesc", "Real-time facial expression and voice emotion analysis with confidence tracking")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {moodAnalyzerCard}
              </CardContent>
            </Card>
          </div>
        );
      case "chat":
        return (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Saarthi Assistant</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Chat with your AI Saarthi in 10+ languages • Voice & Text Support
                </p>
              </div>

              {/* AI Saarthi Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Medi Call Sarthi - Phone Call Assistant */}
                <Card 
                  onClick={() => setShowMediCallSarthi(true)}
                  className="p-8 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm border-2 border-cyan-200 dark:border-cyan-700/20 shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-4 rounded-2xl shadow-lg">
                        <Phone className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                        📞 Medi Call Sarthi
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                        AI Voice Assistant for Phone Calls<br/>
                        10+ Indian Languages • Symptom Analysis
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Voice Chat with AI Saarthi */}
                <Card 
                  onClick={() => setShowVoiceChat(true)}
                  className="p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-rose-900/20 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-700/20 shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-2xl shadow-lg">
                        <Phone className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        🎙️ Voice Chat Saarthi
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                        Talk with your calm wellness guide<br/>
                        Voice-based chat • Meditation-friendly
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Simple Voice Assistant - NEW EFFICIENT VERSION */}
                <Card 
                  onClick={() => setShowSimpleVoice(true)}
                  className="p-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 backdrop-blur-sm border-2 border-green-200 dark:border-green-700/20 shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg">
                        <Phone className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        🎙️ Voice Health Assistant
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                        Simple • Fast • Free<br/>
                        No Phone Calls • Browser-Based
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        );
      case "home":
      default:
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div>
              <motion.h2
                className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {t("dashboard.welcomeBack", "Welcome back! 👋")}
              </motion.h2>
              <motion.p
                className="text-slate-600 dark:text-slate-400 mt-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {t("dashboard.healthOverview", "Here's your comprehensive health overview")}
              </motion.p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <Card className="p-6 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/90 dark:to-slate-950/95 backdrop-blur-xl border-2 border-white/20 dark:border-slate-700/30 dark:hover:border-cyan-500/40 shadow-xl hover:shadow-2xl dark:shadow-cyan-500/10 transition-all duration-300 relative overflow-hidden group">
                      {/* Glow Effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-300`} />
                      
                      <div className="relative z-10">
                        <div className="flex items-start justify-between">
                          <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg dark:shadow-xl`}>
                            <Icon className="h-7 w-7 text-white" />
                          </div>
                          <Badge className="bg-white/50 dark:bg-slate-700/50 text-xs font-bold">
                            {stat.change}
                          </Badge>
                        </div>
                        <div className="mt-4">
                          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{stat.label}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Quick Actions - All Sidebar Shortcuts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl p-8 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/90 dark:to-slate-950/95 backdrop-blur-xl border-2 border-white/20 dark:border-slate-700/30 shadow-xl"
            >
              <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-white">{t("dashboard.quickActions", "Quick Actions")}</h3>
              
              {/* Main Action Cards - First 5 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {/* Scan Prescription */}
                <motion.button
                  onClick={() => setShowScanner(true)}
                  className="relative overflow-hidden rounded-2xl p-6 text-white transition-all hover:scale-105 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 shadow-lg hover:shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="relative z-10">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                      <Camera className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold text-base mb-1">{t("dashboard.scanPrescription", "Scan Prescription")}</h4>
                    <p className="text-xs text-white/80">{t("dashboard.scanPrescriptionDesc", "Upload & analyze")}</p>
                  </div>
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute -left-4 -bottom-4 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
                </motion.button>

                {/* Find Medicine */}
                <motion.button
                  onClick={() => setActiveSection("find-medicine")}
                  className="relative overflow-hidden rounded-2xl p-6 text-white transition-all hover:scale-105 bg-gradient-to-br from-cyan-500 via-teal-500 to-cyan-600 shadow-lg hover:shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="relative z-10">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                      <Search className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold text-base mb-1">{t("dashboard.findMedicine", "Find Medicine")}</h4>
                    <p className="text-xs text-white/80">{t("dashboard.findMedicineDesc", "Search nearby")}</p>
                  </div>
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute -left-4 -bottom-4 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
                </motion.button>

                {/* Book Appointment */}
                <motion.button
                  onClick={() => setActiveSection("appointments")}
                  className="relative overflow-hidden rounded-2xl p-6 text-white transition-all hover:scale-105 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 shadow-lg hover:shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="relative z-10">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold text-base mb-1">{t("dashboard.appointments", "Appointments")}</h4>
                    <p className="text-xs text-white/80">{t("dashboard.appointmentsDesc", "See doctors")}</p>
                  </div>
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute -left-4 -bottom-4 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
                </motion.button>

                {/* AI Assistant */}
                <motion.button
                  onClick={() => setActiveSection("chat")}
                  className="relative overflow-hidden rounded-2xl p-6 text-white transition-all hover:scale-105 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 shadow-lg hover:shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="relative z-10">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                      <Brain className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold text-base mb-1">{t("dashboard.aiAssistant", "Saarthi - AI Voice")}</h4>
                    <p className="text-xs text-white/80">{t("dashboard.aiAssistantDesc", "Get health advice")}</p>
                  </div>
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute -left-4 -bottom-4 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
                </motion.button>

                {/* Medical Reports */}
                <motion.button
                  onClick={() => setActiveSection("nearby")}
                  className="relative overflow-hidden rounded-2xl p-6 text-white transition-all hover:scale-105 bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 shadow-lg hover:shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="relative z-10">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                      <FileBarChart className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold text-base mb-1">{t("dashboard.reports", "Medical Reports")}</h4>
                    <p className="text-xs text-white/80">{t("dashboard.reportsDesc", "Upload & analyze")}</p>
                  </div>
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute -left-4 -bottom-4 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
                </motion.button>
              </div>

              {/* Voice Actions */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.button
                  onClick={() => setShowVoiceChat(true)}
                  className="relative overflow-hidden rounded-xl p-5 text-white bg-gradient-to-br from-purple-500 via-violet-500 to-purple-600 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-white/20">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-sm">{t("dashboard.voiceChat", "Voice Chat")}</h4>
                      <p className="text-xs text-white/80">{t("dashboard.voiceChatDesc", "Talk to AI Saarthi")}</p>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setShowMediCallSarthi(true)}
                  className="relative overflow-hidden rounded-xl p-5 text-white bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-white/20">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-sm">{t("dashboard.callSaarthi", "Call Saarthi")}</h4>
                      <p className="text-xs text-white/80">{t("dashboard.callSaarthiDesc", "Voice call support")}</p>
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>

            {/* Recent Activity & Today's Reminders Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="p-6 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/90 dark:to-slate-950/95 backdrop-blur-xl border-2 border-white/20 dark:border-blue-500/20 shadow-xl dark:shadow-blue-500/10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                      {t("dashboard.recentActivity", "Recent Activity")}
                    </h3>
                    <Button variant="ghost" size="sm" className="text-xs">{t("dashboard.viewAll", "View All")}</Button>
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: ShoppingCart, titleKey: "recent.paracetamol", timeKey: "recent.time2h", color: "bg-green-500/20" },
                      { icon: Calendar, titleKey: "recent.appointment", timeKey: "recent.timeYesterday", color: "bg-violet-500/20" },
                      { icon: Camera, titleKey: "recent.uploadedPrescription", timeKey: "recent.time2d", color: "bg-pink-500/20" },
                      { icon: Bell, titleKey: "recent.reminderSet", timeKey: "recent.time3d", color: "bg-amber-500/20" }
                    ].map((activity, i) => {
                      const Icon = activity.icon;
                      return (
                        <motion.div
                          key={i}
                          className={`flex items-center gap-3 p-4 rounded-xl ${activity.color} hover:opacity-80 transition-all cursor-pointer group`}
                          whileHover={{ scale: 1.02, x: 4 }}
                        >
                          <div className="h-10 w-10 rounded-lg bg-slate-200/50 dark:bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate text-sm">{t(activity.titleKey, activity.titleKey)}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{t(activity.timeKey, activity.timeKey)}</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                        </motion.div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>

              {/* Today's Reminders */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="p-6 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/90 dark:to-slate-950/95 backdrop-blur-xl border-2 border-white/20 dark:border-orange-500/20 shadow-xl dark:shadow-orange-500/10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Bell className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                      {t("dashboard.todaysReminders", "Today's Reminders")}
                    </h3>
                    <Button variant="ghost" size="sm" className="text-xs">{t("dashboard.viewAll", "View All")}</Button>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="flex items-center gap-3 p-4 rounded-xl bg-white/50 dark:bg-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all cursor-pointer group"
                        whileHover={{ scale: 1.02, x: 4 }}
                      >
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                          <Pill className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{t("dashboard.bloodPressureMedicine", "Blood Pressure Medicine")}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">9:00 AM • {t("dashboard.daily", "Daily")}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-orange-500 transition-colors" />
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        );
    }
  };

  const isScreeningSection = false;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Header */}
      <PatientHeader 
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="w-72 border-r border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto"
            >
              <PatientProfile />
              
              <div className="py-4">
                <PatientSidebarMenu
                  menuItems={displayMenuItems}
                  activeSection={activeSection}
                  setActiveSection={setActiveSection}
                  collapsed={false}
                />
              </div>

              {/* Logout Button */}
              <div className="p-4 border-t border-slate-200 dark:border-gray-800">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("actions.logout", "Logout")}
                </Button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className={isScreeningSection ? "h-full p-0" : "container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"}>
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Modals */}
      {showMoodAnalyzer && <MoodAnalyzerPanel open={showMoodAnalyzer} onClose={() => setShowMoodAnalyzer(false)} />}
      {showMediCallSarthi && <MediCallSarthi onClose={() => setShowMediCallSarthi(false)} />}
      {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}
      {showVoiceChat && <VoiceChatSaarthi onClose={() => setShowVoiceChat(false)} />}
      {showSimpleVoice && <SimpleVoiceAssistant onClose={() => setShowSimpleVoice(false)} />}
    </div>
  );
};

const PremiumPatientDashboard = () => (
  <ThemeProvider>
    <OrderProvider>
      <PremiumPatientDashboardInner />
    </OrderProvider>
  </ThemeProvider>
);

export default PremiumPatientDashboard;
