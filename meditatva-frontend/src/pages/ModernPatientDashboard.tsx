import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EnhancedThemeToggle } from "@/components/EnhancedThemeToggle";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MedicalCabinet } from "@/components/MedicalCabinet";
import { AppointmentsSection } from "@/components/AppointmentsSection";
import { MedicineOrders } from "@/components/MedicineOrders";
import { HealthReminders } from "@/components/HealthReminders";
import { NearbyMedicalStoresPage } from "@/pages/NearbyMedicalStoresPage";
import { FindMedicineEnhanced } from "@/pages/FindMedicineEnhanced";
import { MedicineAvailabilitySudoku } from "@/components/MedicineAvailabilitySudoku";
import {
  Home, Calendar, ShoppingCart, Bell, FolderOpen,
  MapPin, MessageCircle, User, LogOut, Menu, X,
  Pill, Camera, Search, Activity, Heart, ChevronRight,
  Scan, Zap, TrendingUp, AlertCircle, CheckCircle2, Settings
} from "lucide-react";
import { toast } from "sonner";

const ModernPatientDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<"home"|"nearby"|"find-medicine"|"orders"|"cabinet"|"appointments"|"chat"|"settings">("home");
  // Initialize sidebar as collapsed on mobile, open on desktop
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [showNearbyFinder, setShowNearbyFinder] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Ensure demo auth for patient (enable real auth in production)
  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    const role = localStorage.getItem("userRole");
    if (!isAuth || role !== "patient") {
      // auto-set for demo
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", "patient");
    }
  }, []);

  // Handle window resize to auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { id: "home", icon: Home, label: "Dashboard", gradient: "from-blue-500 to-cyan-400" },
    { id: "nearby", icon: MapPin, label: "Nearby Stores", gradient: "from-blue-500 to-cyan-400" },
    { id: "find-medicine", icon: Search, label: "Find Medicine", gradient: "from-purple-500 to-pink-400" },
    { id: "orders", icon: ShoppingCart, label: "Medicine Orders", gradient: "from-green-500 to-emerald-400" },
    { id: "cabinet", icon: FolderOpen, label: "Medical Cabinet", gradient: "from-orange-500 to-amber-400" },
    { id: "appointments", icon: Calendar, label: "Appointments", gradient: "from-indigo-500 to-violet-400" },
    { id: "chat", icon: MessageCircle, label: "AI Consultation", gradient: "from-rose-500 to-pink-400" },
    { id: "settings", icon: Settings, label: "Settings", gradient: "from-slate-500 to-gray-400" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    // Clear patient-specific location data
    try { 
      sessionStorage.removeItem("patientLocationData");
      sessionStorage.removeItem("patientLocation"); // Clear old key too
    } catch (e) { }
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 relative overflow-hidden">
      {/* Background glows - Hidden on mobile */}
      <div className="fixed inset-0 pointer-events-none hidden md:block">
        <div className="absolute top-0 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/10 rounded-full blur-3xl" />
      </div>

      {/* Mobile Menu Overlay */}
      {!sidebarCollapsed && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <div className="flex relative z-10">
        {/* Sidebar - Responsive with Drawer on Mobile */}
        <motion.aside
          initial={false}
          animate={{
            opacity: 1
          }}
          className={`
            h-screen fixed left-0 top-0 z-50
            transition-transform duration-300 ease-in-out
            ${sidebarCollapsed 
              ? '-translate-x-full md:translate-x-0 md:w-20' 
              : 'translate-x-0 w-full max-w-[320px] md:max-w-[280px]'
            }
          `}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px) saturate(180%)'
            }}
            className={`
              flex flex-col h-full shadow-2xl
              ${sidebarCollapsed ? 'p-2 md:p-3' : 'p-4 sm:p-6'}
            `}
          >
            {/* Logo - Fixed at top */}
            <div className={`mb-4 sm:mb-6 flex-shrink-0 ${sidebarCollapsed ? 'md:mb-4' : ''}`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,#3B82F6 0%,#60A5FA 100%)'}}>
                  <Pill className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent truncate">MediTatva</h1>
                    <p className="text-xs text-slate-500 font-medium truncate">Patient Portal</p>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable Navigation - Mobile Optimized */}
            <nav className={`
              flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent hover:scrollbar-thumb-blue-400
              ${sidebarCollapsed ? 'space-y-2' : 'space-y-1.5 sm:space-y-2 pr-1 sm:pr-2'}
            `}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#93C5FD transparent'
              }}
            >
              {menuItems.map((item) => {
                const Icon = item.icon as any;
                const isActive = activeSection === item.id;
                return (
                  <div key={item.id} className="relative group">
                    <motion.button
                      onClick={() => {
                        setActiveSection(item.id as any);
                        // Close sidebar on mobile after selection
                        if (window.innerWidth < 768) {
                          setSidebarCollapsed(true);
                        }
                      }}
                      className={`
                        flex items-center w-full transition-all duration-300 relative overflow-hidden touch-manipulation
                        ${sidebarCollapsed 
                          ? 'justify-center p-3 rounded-xl min-h-[48px]' 
                          : 'gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl sm:rounded-2xl min-h-[48px]'
                        }
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-lg shadow-blue-500/30' 
                          : 'text-slate-700 hover:bg-white/60 hover:shadow-md'
                        }
                      `}
                      whileHover={{ scale: sidebarCollapsed ? 1.05 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Glowing accent line for active item */}
                      {isActive && !sidebarCollapsed && (
                        <motion.div
                          className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                          initial={{ height: 0 }}
                          animate={{ height: "100%" }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                      
                      <div className={`
                        rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0
                        ${sidebarCollapsed ? 'h-10 w-10' : 'h-9 w-9 sm:h-10 sm:w-10'}
                        ${isActive ? 'bg-white/20' : 'bg-gradient-to-br ' + item.gradient}
                      `}> 
                        <Icon className={`text-white ${sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4 sm:h-5 sm:w-5'}`} />
                      </div>
                      
                      {!sidebarCollapsed && (
                        <div className="flex-1 text-left min-w-0">
                          <p className={`text-xs sm:text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-700'}`}>
                            {item.label}
                          </p>
                        </div>
                      )}
                      
                      {!sidebarCollapsed && isActive && (
                        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-white flex-shrink-0" />
                      )}
                    </motion.button>
                    
                    {/* Tooltip for collapsed mode - Desktop only */}
                    {sidebarCollapsed && (
                      <div className="hidden md:block absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-xl">
                        {item.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Logout Button - Fixed at bottom - Mobile Optimized */}
            <div className={`mt-auto flex-shrink-0 border-t border-slate-200/50 ${sidebarCollapsed ? 'pt-3' : 'pt-4 sm:pt-6'}`}>
              <Button 
                className={`
                  w-full bg-white/60 text-rose-600 border-2 border-rose-200 hover:bg-rose-50 min-h-[48px] touch-manipulation
                  ${sidebarCollapsed ? 'px-2' : ''}
                `}
                onClick={handleLogout}
              >
                <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-center gap-2'}`}>
                  <LogOut className="h-4 w-4" />
                  {!sidebarCollapsed && <span className="text-sm sm:text-base">Logout</span>}
                </div>
              </Button>
            </div>
          </div>
        </motion.aside>

        {/* Main content - Responsive Margins */}
        <div className={`
          flex-1 w-full transition-all duration-300
          ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-[280px]'}
        `}>
          <motion.header 
            className="sticky top-2 sm:top-4 mx-3 sm:mx-6 mb-4 sm:mb-6 z-30 rounded-xl sm:rounded-2xl bg-white/60 backdrop-blur-lg shadow-lg" 
            style={{border:'1px solid rgba(255,255,255,0.5)'}}
          >
            <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hover:bg-blue-500/10 flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 p-0">
                  {sidebarCollapsed ? <Menu className="h-4 w-4 sm:h-5 sm:w-5" /> : <X className="h-4 w-4 sm:h-5 sm:w-5" />}
                </Button>
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Pill className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 hidden sm:block">
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 truncate">{menuItems.find(m=>m.id===activeSection)?.label}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 truncate">MediTatva Patient Portal</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  <span className="text-xs sm:text-sm font-semibold text-blue-700">Active</span>
                </div>
                <Button variant="ghost" size="sm" className="relative h-9 w-9 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl hover:bg-blue-500/10 p-0 flex-shrink-0">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <EnhancedThemeToggle />
                <div className="hidden sm:flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-100 to-blue-50">
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=patient" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white font-bold text-sm">JD</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </motion.header>

          <motion.main className="px-3 sm:px-6 pb-6 sm:pb-8">{/* content switch */}
            {/* content switch */}
            <AnimatePresence mode="wait">
              {activeSection === 'home' && (
                <motion.div key="home" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-800">Welcome back, John!</h2>
                      <p className="text-slate-500 mt-1">Here's your health overview</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="p-5 bg-white">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-blue-100">
                            <Calendar className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-800">3</p>
                            <p className="text-sm text-slate-500">Upcoming</p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-5 bg-white">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-green-100">
                            <ShoppingCart className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-800">5</p>
                            <p className="text-sm text-slate-500">Orders</p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-5 bg-white">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-orange-100">
                            <Bell className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-800">12</p>
                            <p className="text-sm text-slate-500">Reminders</p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-5 bg-white">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-indigo-100">
                            <Activity className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-800">87%</p>
                            <p className="text-sm text-slate-500">Health Score</p>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Medicine Availability Sudoku */}
                    <MedicineAvailabilitySudoku />
                  </div>
                </motion.div>
              )}

              {activeSection === 'appointments' && (
                <motion.div key="appointments" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
                  <AppointmentsSection />
                </motion.div>
              )}

              {activeSection === 'orders' && (
                <motion.div key="orders" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
                  <MedicineOrders />
                </motion.div>
              )}

              {activeSection === 'cabinet' && (
                <motion.div key="cabinet" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
                  <MedicalCabinet />
                </motion.div>
              )}

              {activeSection === 'nearby' && (
                <motion.div key="nearby" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
                  <NearbyMedicalStoresPage />
                </motion.div>
              )}

              {activeSection === 'find-medicine' && (
                <motion.div key="find-medicine" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
                  {/* 
                    IMPORTANT: Pass onNavigateToOrders prop to prevent navigation issues
                    This callback switches to 'orders' section within THIS dashboard
                    Without it, the component would use navigate() and change the entire route
                  */}
                  <FindMedicineEnhanced 
                    onNavigateToOrders={() => {
                      setActiveSection('orders'); // Stay in same dashboard, switch section
                      toast.success('Navigating to your orders...');
                    }}
                  />
                </motion.div>
              )}

              {activeSection === 'chat' && (
                <motion.div key="chat" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-800">AI Health Assistant</h2>
                      <p className="text-slate-500 mt-1">Get instant health advice and consultation</p>
                    </div>
                    <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                      <div className="text-center">
                        <MessageCircle className="h-20 w-20 text-purple-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">AI Health Assistant Coming Soon</h3>
                        <p className="text-slate-600">
                          Our AI-powered health assistant will provide personalized health advice, answer your medical questions, and help you manage your wellness journey.
                        </p>
                      </div>
                    </Card>
                  </div>
                </motion.div>
              )}

              {activeSection === 'settings' && (
                <motion.div key="settings" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-800">Settings</h2>
                      <p className="text-slate-500 mt-1">Manage your account and preferences</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="p-6 bg-white">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-slate-800 mb-1">Profile Settings</h3>
                            <p className="text-sm text-slate-500 mb-4">Update your personal information and contact details</p>
                            <Button size="sm" variant="outline">Edit Profile</Button>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-6 bg-white">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
                            <Bell className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-slate-800 mb-1">Notifications</h3>
                            <p className="text-sm text-slate-500 mb-4">Manage notification preferences and alerts</p>
                            <Button size="sm" variant="outline">Configure</Button>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-6 bg-white">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-400 flex items-center justify-center">
                            <Settings className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-slate-800 mb-1">Appearance</h3>
                            <p className="text-sm text-slate-500 mb-4">Customize theme and display preferences</p>
                            <div className="mt-3">
                              <EnhancedThemeToggle />
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-6 bg-white">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-400 flex items-center justify-center">
                            <AlertCircle className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-slate-800 mb-1">Privacy & Security</h3>
                            <p className="text-sm text-slate-500 mb-4">Manage your privacy settings and security options</p>
                            <Button size="sm" variant="outline">Manage</Button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.main>
        </div>
      </div>

      {showScanner && (
        <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowScanner(false)}>
          <motion.div className="bg-white rounded-xl p-6 max-w-md w-full" initial={{scale:0.95}} animate={{scale:1}} onClick={(e)=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Scan Prescription</h3>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center my-4">Camera placeholder</div>
            <div className="flex gap-3">
              <Button className="flex-1">Capture</Button>
              <Button variant="outline" className="flex-1" onClick={()=>setShowScanner(false)}>Cancel</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ModernPatientDashboard;
