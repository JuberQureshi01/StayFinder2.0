import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Check, X as XIcon, Loader2, Globe, ArrowLeft } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import apiFetch from "../services/apiFetch";
import { setCredentials } from "../features/auth/authSlice";

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return {
    score: Math.min(score, 4),
    label: score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong",
    color: score <= 1 ? "bg-red-500" : score === 2 ? "bg-orange-500" : score === 3 ? "bg-yellow-500" : "bg-green-500",
    textColor: score <= 1 ? "text-red-500" : score === 2 ? "text-orange-500" : score === 3 ? "text-yellow-500" : "text-green-500",
  };
};

const passwordChecks = (password: string) => [
  { label: "At least 8 characters", passed: password.length >= 8 },
  { label: "One uppercase letter", passed: /[A-Z]/.test(password) },
  { label: "One number", passed: /[0-9]/.test(password) },
  { label: "One special character", passed: /[^A-Za-z0-9]/.test(password) },
];

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [view, setView] = useState<"login" | "register">("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const checks = useMemo(() => passwordChecks(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = view === "login" ? "/auth/login" : "/auth/register";
      const payload = view === "login" ? { email, password } : { name, email, password };
      const response = await apiFetch.post(endpoint, payload);
      dispatch(setCredentials({ user: response.data.data, token: response.data.token }));
      toast.success(response.data.message || "Welcome to StayFinder!");
      navigate("/");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleLoading(true);
    const toastId = toast.loading("Verifying Google credentials...");
    try {
      const response = await apiFetch.post("/auth/google", {
        idToken: credentialResponse.credential,
        role: "user",
      });
      dispatch(setCredentials({ user: response.data.data, token: response.data.token }));
      toast.success("Logged in with Google successfully!", { id: toastId });
      navigate("/");
    } catch {
      toast.error("Google authentication failed.", { id: toastId });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left - Hero */}
      <div className="relative hidden w-1/2 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

        <div className="relative flex h-full flex-col items-center justify-center px-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Link to="/" className="mb-8 inline-flex items-center gap-2 text-2xl font-bold text-white/90 hover:text-white">
              <Globe className="h-8 w-8" />
              StayFinder
            </Link>
            <h2 className="mt-8 text-4xl font-bold leading-tight">
              {view === "login" ? "Welcome Back" : "Join StayFinder"}
            </h2>
            <p className="mt-4 text-lg text-white/70">
              {view === "login"
                ? "Sign in to continue your journey"
                : "Create an account and start exploring"}
            </p>

            <div className="mt-12 space-y-6 text-left">
              {[
                { title: "Find Unique Stays", desc: "Browse thousands of properties worldwide" },
                { title: "Secure Booking", desc: "Pay with confidence through our secure platform" },
                { title: "24/7 Support", desc: "We're here to help, anytime, anywhere" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="text-sm text-white/60">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile back + logo */}
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link to="/" className="flex items-center gap-2 text-rose-500">
              <Globe className="h-6 w-6" />
              <span className="text-lg font-bold tracking-tight">
                <span className="text-rose-500">Stay</span>
                <span className="text-gray-900">Finder</span>
              </span>
            </Link>
            <button onClick={() => navigate(-1)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>

          <motion.div
            key={view}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {view === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="mt-2 text-gray-500">
              {view === "login"
                ? "Sign in to access your account"
                : "Sign up to start booking stays"}
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <AnimatePresence mode="wait">
              {view === "register" && (
                <motion.div
                  key="name"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-500/20"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Password strength (register only) */}
            <AnimatePresence>
              {view === "register" && password.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 rounded-xl bg-gray-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Strength</span>
                    <span className={`text-xs font-semibold ${passwordStrength.textColor}`}>{passwordStrength.label}</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full"
                        style={{ backgroundColor: i < passwordStrength.score ? passwordStrength.color.replace("bg-", "") === "red-500" ? "#ef4444" : passwordStrength.color.replace("bg-", "") === "orange-500" ? "#f97316" : passwordStrength.color.replace("bg-", "") === "yellow-500" ? "#eab308" : "#22c55e" : "#e5e7eb" }}
                      />
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {checks.map((check) => (
                      <div key={check.label} className="flex items-center gap-2">
                        {check.passed ? <Check className="h-3.5 w-3.5 text-green-500" /> : <XIcon className="h-3.5 w-3.5 text-gray-300" />}
                        <span className={`text-xs ${check.passed ? "text-green-600" : "text-gray-400"}`}>{check.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {view === "login" && (
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 transition hover:text-rose-500 hover:decoration-rose-500">
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden rounded-xl bg-gray-900 py-3.5 font-semibold text-white transition hover:bg-black disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {view === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                view === "login" ? "Sign in" : "Create account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">or continue with</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Google */}
          <div className="flex justify-center">
            {googleLoading ? (
              <div className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-gray-300 text-sm font-medium text-gray-700">
                <Loader2 className="h-5 w-5 animate-spin" />
                Connecting...
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error("Google login failed.")}
                shape="pill"
                size="large"
                width="100%"
                logo_alignment="center"
                text={view === "login" ? "signin_with" : "signup_with"}
              />
            )}
          </div>

          {/* Toggle view */}
          <p className="mt-8 text-center text-sm text-gray-600">
            {view === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => { setView(view === "login" ? "register" : "login"); setShowPassword(false); }}
              className="font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 transition hover:text-rose-500 hover:decoration-rose-500"
            >
              {view === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
