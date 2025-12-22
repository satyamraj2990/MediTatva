import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { 
  User, 
  Building2, 
  Mail, 
  Lock, 
  Sparkles, 
  ChevronDown,
  Heart
} from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "patient";
  
  const [role, setRole] = useState<"patient" | "pharmacy">(initialRole as "patient" | "pharmacy");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validCredentials = {
      patient: { email: "patient@meditatva.com", password: "patient123" },
      pharmacy: { email: "pharmacy@meditatva.com", password: "pharmacy123" },
    };

    if (
      email === validCredentials[role].email &&
      password === validCredentials[role].password
    ) {
      toast.success(`Welcome back! Logging in as ${role}...`);
      localStorage.setItem("userRole", role);
      localStorage.setItem("isAuthenticated", "true");
      
      setTimeout(() => {
        navigate(role === "patient" ? "/patient/premium" : "/pharmacy/dashboard");
      }, 500);
    } else {
      toast.error("Invalid credentials. Use demo credentials below.");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen premium-login-gradient flex items-center justify-center p-2 sm:p-4 lg:p-6 overflow-hidden relative">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-64 h-64 sm:w-96 sm:h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, -50, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-56 h-56 sm:w-80 sm:h-80 bg-blue-500/20 rounded-full blur-3xl"
          animate={{ x: [-50, 50, -50], y: [-50, 50, -50], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Theme Toggle */}
      <motion.div 
        className="absolute top-3 right-3 sm:top-6 sm:right-6 z-20"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <ThemeToggle />
      </motion.div>

      {/* Main Login Card - Responsive Layout */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        transition={{ duration: 0.6, staggerChildren: 0.1 }}
        className="w-full max-w-6xl relative z-10 mx-auto"
      >
        <Card className="premium-glass-card backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden">
          <div className="grid lg:grid-cols-2 min-h-[500px] sm:min-h-[600px]">
            {/* Left Side - Branding & Info (Hidden on mobile, visible on desktop) */}
            <motion.div 
              className="hidden lg:flex p-8 xl:p-12 flex-col justify-center bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-cyan-600/20 backdrop-blur-sm"
              variants={itemVariants}
            >
              <div className="space-y-6">
                {/* Logo and Title */}
                <motion.div whileHover={{ scale: 1.02 }} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg"
                    >
                      <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-white fill-white" />
                    </motion.div>
                    <h1 className="text-3xl sm:text-4xl xl:text-5xl font-bold premium-gradient-text">
                      MediTatva
                    </h1>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {isSignup ? "Join Us Today" : "Welcome Back"}
                  </h2>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    Your trusted medicine companion. Connect with nearby pharmacies and find medicines instantly.
                  </p>
                </motion.div>

                {/* Features List */}
                <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-6">
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">AI-Powered Medicine Search</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Real-Time Pharmacy Network</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-pink-400" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Instant Medicine Availability</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Side - Login Form */}
            <div className="p-5 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-center">
              <motion.div variants={itemVariants} className="space-y-3 sm:space-y-4 lg:space-y-6">
                {/* Header */}
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                    {isSignup ? "Create Account" : "Sign In"}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {isSignup ? "Fill in your details to get started" : "Enter your credentials to continue"}
                  </p>
                </div>

                {/* Role Selector - Clear Segmented Control */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Select Your Role</Label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-lg border-2 border-border">
                    <button
                      type="button"
                      onClick={() => setRole("patient")}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-md font-semibold transition-all duration-200 ${
                        role === "patient" 
                          ? "bg-primary text-primary-foreground shadow-md" 
                          : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                      aria-pressed={role === "patient"}
                      aria-label="Login as Patient"
                    >
                      <User className="h-4 w-4 shrink-0" />
                      <span className="text-sm sm:text-base">Patient</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("pharmacy")}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-md font-semibold transition-all duration-200 ${
                        role === "pharmacy" 
                          ? "bg-primary text-primary-foreground shadow-md" 
                          : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                      aria-pressed={role === "pharmacy"}
                      aria-label="Login as Pharmacy"
                    >
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span className="text-sm sm:text-base">Pharmacy</span>
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/70 z-10 pointer-events-none" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        className={`pl-11 sm:pl-12 h-12 text-base bg-card border-2 transition-all ${
                          focusedField === "email" 
                            ? "border-primary ring-4 ring-primary/20 bg-background" 
                            : "border-input hover:border-primary/50"
                        }`}
                        required
                        aria-label="Email Address"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Demo: {role === "patient" ? "patient@meditatva.com" : "pharmacy@meditatva.com"}
                    </p>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/70 z-10 pointer-events-none" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        className={`pl-11 sm:pl-12 h-12 text-base bg-card border-2 transition-all ${
                          focusedField === "password" 
                            ? "border-primary ring-4 ring-primary/20 bg-background" 
                            : "border-input hover:border-primary/50"
                        }`}
                        required
                        aria-label="Password"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Demo: {role === "patient" ? "patient123" : "pharmacy123"}
                    </p>
                  </div>

                  {/* Login Button - Primary Action */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
                  >
                    {isSignup ? "Create Account" : "Login to Dashboard"}
                  </Button>
                </form>

                {/* Demo Credentials - Secondary Action */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowDemo(!showDemo)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 border-border hover:border-primary/50 bg-background/50 hover:bg-background/80 transition-all duration-200"
                    aria-expanded={showDemo}
                    aria-label="Toggle demo account credentials"
                  >
                    <span className="text-sm font-medium flex items-center gap-2 text-foreground">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Load Demo Account
                    </span>
                    <motion.div
                      animate={{ rotate: showDemo ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showDemo && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 sm:mt-3 p-3 sm:p-4 rounded-lg bg-muted/30 backdrop-blur-sm space-y-2 sm:space-y-3 border border-border/50">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                              <p className="font-semibold text-xs sm:text-sm text-foreground">Patient</p>
                            </div>
                            <div className="space-y-1 text-[10px] sm:text-xs text-muted-foreground pl-5 sm:pl-6">
                              <p className="font-mono bg-background/50 px-2 py-1 rounded break-all">
                                patient@meditatva.com
                              </p>
                              <p className="font-mono bg-background/50 px-2 py-1 rounded">
                                patient123
                              </p>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" />
                              <p className="font-semibold text-xs sm:text-sm text-foreground">Pharmacy</p>
                            </div>
                            <div className="space-y-1 text-[10px] sm:text-xs text-muted-foreground pl-5 sm:pl-6">
                              <p className="font-mono bg-background/50 px-2 py-1 rounded break-all">
                                pharmacy@meditatva.com
                              </p>
                              <p className="font-mono bg-background/50 px-2 py-1 rounded">
                                pharmacy123
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Signup Toggle & Back to Home - Tertiary Actions */}
                <div className="space-y-3 pt-2">
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setIsSignup(!isSignup)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isSignup ? "Already have an account? " : "Don't have an account? "}
                      <span className="text-primary font-semibold hover:underline">
                        {isSignup ? "Sign in" : "Sign up"}
                      </span>
                    </button>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => navigate("/")}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                      ← Back to Home
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="absolute bottom-3 sm:bottom-6 left-0 right-0 text-center z-10 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-[10px] sm:text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} MediTatva — Your Trusted Medicine Companion
        </p>
      </motion.footer>
    </div>
  );
};

export default Login;
