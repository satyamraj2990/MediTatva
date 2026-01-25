import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Mail, 
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  Zap,
  ChevronDown,
  User,
  Building2,
  Activity
} from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "patient";
  
  const [role, setRole] = useState<"patient" | "pharmacy">(initialRole as "patient" | "pharmacy");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mouse position for 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 100, damping: 30 });
  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [3, -3]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-3, 3]);

  // Page load animation
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  // Mouse move handler for 3D tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const validCredentials = {
    patient: { email: "patient@meditatva.com", password: "patient123" },
    pharmacy: { email: "pharmacy@meditatva.com", password: "pharmacy123" },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      email === validCredentials[role].email &&
      password === validCredentials[role].password
    ) {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", role);
      navigate(role === "patient" ? "/patient/premium" : "/pharmacy/dashboard/order-requests");
      toast.success(`🎉 Welcome back!`);
    } else {
      toast.error("Invalid credentials. Please try demo access!");
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950">
      {/* Animated Background with Gradient Waves */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 50% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />

      {/* ECG Heartbeat Line Animation */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <svg className="w-full h-32" viewBox="0 0 1000 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="ecgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0)" />
              <stop offset="50%" stopColor="rgba(6, 182, 212, 0.8)" />
              <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
            </linearGradient>
          </defs>
          <motion.path
            d="M0,50 L350,50 L370,20 L390,80 L410,50 L650,50"
            fill="none"
            stroke="url(#ecgGradient)"
            strokeWidth="3"
            initial={{ pathLength: 0, x: -1000 }}
            animate={{ 
              pathLength: 1,
              x: [0, 2000],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{ 
              pathLength: { duration: 2 },
              x: { duration: 8, repeat: Infinity, ease: "linear" },
              opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          />
        </svg>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/20 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
            }}
            animate={{
              y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 15,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Pulse Rings in Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/10"
            initial={{ width: 0, height: 0, opacity: 0.6 }}
            animate={{
              width: [0, 1200],
              height: [0, 1200],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: i * 2,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Centered Login Container */}
      <div className="relative h-full flex items-center justify-center p-6">
        {/* Radial Glow Behind Container */}
        <motion.div
          className="absolute w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Glassmorphic Toolbox Container with 3D Tilt */}
        <motion.div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{
            opacity: isLoaded ? 1 : 0,
            scale: isLoaded ? 1 : 0.8,
            y: isLoaded ? 0 : 50,
          }}
          transition={{ delay: 0, duration: 0.5, type: "spring", stiffness: 100 }}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
            perspective: 1000,
          }}
          className="relative w-full max-w-md"
        >
          {/* Container Glow */}
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 rounded-3xl blur-xl opacity-20"
            animate={{
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Floating Animation */}
          <motion.div
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Glass Container */}
            <div className="relative bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              
              {/* Brand Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.4 }}
                className="text-center mb-6"
              >
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 mb-4"
                  animate={{
                    boxShadow: ['0 0 20px rgba(6, 182, 212, 0.3)', '0 0 40px rgba(6, 182, 212, 0.6)', '0 0 20px rgba(6, 182, 212, 0.3)'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
                    MediTatva Healthcare
                  </span>
                </motion.div>
              </motion.div>

              {/* Welcome Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.4 }}
                className="text-center mb-6"
              >
                <h2 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent mb-2">
                  Welcome Back
                </h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="text-slate-400 text-base"
                >
                  Enter the future of healthcare
                </motion.p>
              </motion.div>

              {/* Role Selector */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.4 }}
                className="mb-6"
              >
                <div className="relative bg-slate-800/50 p-1 rounded-2xl backdrop-blur-sm">
                  <motion.div
                    className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl shadow-lg"
                    animate={{
                      x: role === "patient" ? 4 : "calc(100% + 4px)",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                  <div className="relative grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("patient")}
                      className={`relative z-10 py-3 px-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                        role === "patient" ? "text-white" : "text-slate-400"
                      }`}
                    >
                      <User className="w-5 h-5" />
                      Patient
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("pharmacy")}
                      className={`relative z-10 py-3 px-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                        role === "pharmacy" ? "text-white" : "text-slate-400"
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                      Pharmacy
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14, duration: 0.4 }}
                >
                  <Label
                    htmlFor="email"
                    className={`text-xs uppercase tracking-wider font-bold mb-2 block transition-colors ${
                      focusedField === "email" ? "text-cyan-400" : "text-slate-400"
                    }`}
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <Mail
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                        focusedField === "email" ? "text-cyan-400 scale-110" : "text-slate-500"
                      }`}
                    />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      className={`pl-12 h-12 text-base rounded-xl bg-slate-800/50 border-2 text-white placeholder:text-slate-600 transition-all duration-300 ${
                        focusedField === "email"
                          ? "border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                          : "border-slate-700 hover:border-slate-600"
                      }`}
                      required
                    />
                  </div>
                </motion.div>

                {/* Password Input */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16, duration: 0.4 }}
                >
                  <Label
                    htmlFor="password"
                    className={`text-xs uppercase tracking-wider font-bold mb-2 block transition-colors ${
                      focusedField === "password" ? "text-cyan-400" : "text-slate-400"
                    }`}
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                        focusedField === "password" ? "text-cyan-400 scale-110" : "text-slate-500"
                      }`}
                    />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      className={`pl-12 pr-12 h-12 text-base rounded-xl bg-slate-800/50 border-2 text-white placeholder:text-slate-600 transition-all duration-300 ${
                        focusedField === "password"
                          ? "border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                          : "border-slate-700 hover:border-slate-600"
                      }`}
                      required
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      <motion.div
                        initial={false}
                        animate={{ rotate: showPassword ? 0 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </motion.div>
                    </motion.button>
                  </div>
                </motion.div>

                {/* Collapsible Demo Access */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.4 }}
                >
                  <button
                    type="button"
                    onClick={() => setShowDemo(!showDemo)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Shield className="w-4 h-4 text-cyan-400" />
                      </motion.div>
                      <span className="text-xs font-bold text-cyan-400 uppercase">Demo Access</span>
                    </div>
                    <motion.div
                      animate={{ rotate: showDemo ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </motion.div>
                  </button>
                  <motion.div
                    initial={false}
                    animate={{
                      height: showDemo ? "auto" : 0,
                      opacity: showDemo ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 mt-2 rounded-xl bg-slate-800/20 border border-slate-700/30 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setEmail(validCredentials[role].email);
                          setPassword(validCredentials[role].password);
                          toast.success("Demo credentials filled!");
                        }}
                        className="text-left w-full hover:text-cyan-400 transition-colors"
                      >
                        <p className="text-slate-500 mb-1">
                          Email: <span className="text-cyan-400 font-mono text-xs">{validCredentials[role].email}</span>
                        </p>
                        <p className="text-slate-500">
                          Password: <span className="text-cyan-400 font-mono text-xs">{validCredentials[role].password}</span>
                        </p>
                      </button>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Login Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-14 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-semibold tracking-normal transition-colors duration-150 shadow-md border border-cyan-500/20 cursor-pointer"
                  >
                    <span className="flex items-center justify-center gap-2.5 text-base">
                      <Activity className="w-5 h-5" />
                      Sign In
                    </span>
                  </Button>
                </motion.div>
              </form>

              {/* Back to Home */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.22, duration: 0.4 }}
                className="text-center mt-6"
              >
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-sm text-slate-500 hover:text-cyan-400 transition-colors font-medium"
                >
                  ← Back to Home
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
