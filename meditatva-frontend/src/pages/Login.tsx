import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  ArrowLeft,
  Sun,
  Moon,
} from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "pharmacy";

  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const [role, setRole] = useState<"patient" | "pharmacy">(initialRole as "patient" | "pharmacy");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
      toast.success("Welcome back!");
      navigate(role === "patient" ? "/patient/premium" : "/pharmacy/dashboard/order-requests", { replace: true });
    } else {
      toast.error("Invalid credentials. Please try demo access!");
    }
  };

  const useDemoCredentials = () => {
    setEmail(validCredentials[role].email);
    setPassword(validCredentials[role].password);
    toast.success("Demo credentials filled!");
  };

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <div
      className={`relative w-full min-h-screen flex items-center justify-center p-4 ${
        isDark ? "bg-slate-900" : "bg-slate-50"
      }`}
    >
      <div
        className={`absolute inset-0 ${
          isDark
            ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-900 to-slate-900 opacity-60"
            : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100 via-white to-slate-100 opacity-90"
        }`}
      />

      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-6">
        <button
          onClick={() => navigate("/")}
          className={`group flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md ${
            isDark
              ? "text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50"
              : "text-slate-700 hover:text-slate-900 bg-white/80 hover:bg-white border border-slate-200 hover:border-emerald-500/40"
          }`}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Home</span>
        </button>

        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-lg transition-colors ${
            isDark
              ? "bg-white/10 hover:bg-white/20 text-yellow-400"
              : "bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
          }`}
          title={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="relative w-full max-w-md">
        <div
          className={`backdrop-blur-xl border rounded-2xl p-8 shadow-2xl ${
            isDark
              ? "bg-slate-800/95 border-slate-700"
              : "bg-white/95 border-slate-200"
          }`}
        >
          <div className="text-center mb-8">
            <div className="inline-block px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
              <span className="text-sm font-semibold text-emerald-500 uppercase tracking-widest">
                MediTatva Healthcare
              </span>
            </div>

            <h2 className={`text-4xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              Welcome Back
            </h2>
            <p className={isDark ? "text-slate-400" : "text-slate-600"}>
              Sign in to continue to your dashboard
            </p>
          </div>

          <div className="mb-6">
            <div className={`grid grid-cols-2 gap-2 p-1 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-100"}`}>
              <button
                type="button"
                onClick={() => setRole("patient")}
                className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  role === "patient"
                    ? "bg-emerald-600 text-white shadow-md"
                    : isDark
                      ? "text-slate-400 hover:text-white hover:bg-slate-700/30"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                <User className="w-4 h-4" />
                Patient
              </button>
              <button
                type="button"
                onClick={() => setRole("pharmacy")}
                className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  role === "pharmacy"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
                    : isDark
                      ? "text-slate-400 hover:text-white hover:bg-slate-700/30"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                <Building2 className="w-4 h-4" />
                Pharmacy
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                <Input
                  type="email"
                  placeholder="patient@meditatva.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-11 h-12 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${
                    isDark
                      ? "bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                  }`}
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-11 pr-11 h-12 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${
                    isDark
                      ? "bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/25 transition-all duration-200"
            >
              Sign in
            </Button>

            <button
              type="button"
              onClick={useDemoCredentials}
              className="w-full text-sm text-emerald-500 hover:text-emerald-600 font-medium transition-colors"
            >
              Use Demo Credentials
            </button>

            <div className={`p-4 border rounded-lg ${isDark ? "bg-slate-700/30 border-slate-600" : "bg-slate-50 border-slate-200"}`}>
              <p className={`text-xs mb-1 font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>Demo Access:</p>
              <p className={`text-sm font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
                {validCredentials[role].email} / {validCredentials[role].password}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
