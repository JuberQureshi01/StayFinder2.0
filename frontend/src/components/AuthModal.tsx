import { useState, useMemo } from "react";
import { X, Eye, EyeOff, Check, X as XIcon, Loader2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";
import apiFetch from "../services/apiFetch";
import { setCredentials } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Password strength checker utility
const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return {
    score: Math.min(score, 4),
    label:
      score <= 1
        ? "Weak"
        : score === 2
          ? "Fair"
          : score === 3
            ? "Good"
            : "Strong",
    color:
      score <= 1
        ? "bg-red-500"
        : score === 2
          ? "bg-orange-500"
          : score === 3
            ? "bg-yellow-500"
            : "bg-green-500",
    textColor:
      score <= 1
        ? "text-red-500"
        : score === 2
          ? "text-orange-500"
          : score === 3
            ? "text-yellow-500"
            : "text-green-500",
  };
};

// Password requirement checks
const passwordChecks = (password: string) => [
  { label: "At least 8 characters", passed: password.length >= 8 },
  { label: "One uppercase letter", passed: /[A-Z]/.test(password) },
  { label: "One number", passed: /[0-9]/.test(password) },
  {
    label: "One special character",
    passed: /[^A-Za-z0-9]/.test(password),
  },
];

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [view, setView] = useState<"login" | "register">("login");

  // Standard Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password],
  );
  const checks = useMemo(() => passwordChecks(password), [password]);

  // Reset form when modal closes
  const handleClose = () => {
    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setLoading(false);
    onClose();
  };

  // Handle keyboard events for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  // 1. Handle Standard Email/Password Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = view === "login" ? "/auth/login" : "/auth/register";
      const payload =
        view === "login" ? { email, password } : { name, email, password };

      const response = await apiFetch.post(endpoint, payload);
      dispatch(
        setCredentials({
          user: response.data.data,
          token: response.data.token,
        }),
      );

      toast.success(response.data.message || "Welcome to StayFinder!");
      handleClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Google OAuth Success Integration
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleLoading(true);
    const toastId = toast.loading("Verifying Google credentials...");
    try {
      const response = await apiFetch.post("/auth/google", {
        idToken: credentialResponse.credential,
        role: "user",
      });

      dispatch(
        setCredentials({
          user: response.data.data,
          token: response.data.token,
        }),
      );

      toast.success("Logged in with Google successfully!", { id: toastId });
      handleClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Google authentication failed.",
        { id: toastId },
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
            onKeyDown={handleKeyDown}
            aria-hidden="true"
          />

          {/* Modal container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.3,
              }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-modal-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClose}
                  className="rounded-full p-2 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5 text-gray-700" />
                </motion.button>
                <h2
                  id="auth-modal-title"
                  className="text-base font-bold text-gray-900"
                >
                  {view === "login" ? "Log in" : "Sign up"}
                </h2>
                <div className="w-9" aria-hidden="true" />
              </div>

              {/* Body */}
              <div className="p-6 md:p-2">
                <motion.h3
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6 text-2xl font-semibold text-center text-gray-900"
                >
                  Welcome to <span className="text-rose-500">StayFinder</span>
                </motion.h3>

                <motion.form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {/* Name field with animation for register */}
                  <AnimatePresence mode="wait">
                    {view === "register" && (
                      <motion.div
                        key="name-field"
                        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                          marginBottom: 16,
                        }}
                        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <input
                          type="text"
                          placeholder="Full Name"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 p-4 text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20"
                          aria-label="Full Name"
                          autoComplete="name"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email field */}
                  <div>
                    <input
                      type="email"
                      placeholder="Email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 p-4 text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20"
                      aria-label="Email address"
                      autoComplete="email"
                    />
                  </div>

                  {/* Password field with toggle */}
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 p-4 pr-12 text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20"
                      aria-label="Password"
                      autoComplete={
                        view === "login" ? "current-password" : "new-password"
                      }
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-[30%] -translate-y-1/2 rounded-lg p-1 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {showPassword ? (
                          <motion.div
                            key="eye-off"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <EyeOff className="h-5 w-5" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="eye"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Eye className="h-5 w-5" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>

                  {/* Password strength indicator (only in register mode) */}
                  <AnimatePresence>
                    {view === "register" && password.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                          {/* Strength bar */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-600">
                                Password strength
                              </span>
                              <motion.span
                                key={passwordStrength.label}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-xs font-semibold ${passwordStrength.textColor}`}
                              >
                                {passwordStrength.label}
                              </motion.span>
                            </div>
                            <div className="flex gap-1">
                              {[...Array(4)].map((_, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ scaleX: 0 }}
                                  animate={{
                                    scaleX: 1,
                                    backgroundColor:
                                      index < passwordStrength.score
                                        ? passwordStrength.color.replace(
                                            "bg-",
                                            "",
                                          )
                                        : "rgb(229, 231, 235)",
                                  }}
                                  transition={{
                                    duration: 0.3,
                                    delay: index * 0.05,
                                  }}
                                  className="h-1.5 flex-1 rounded-full origin-left"
                                  style={{
                                    backgroundColor:
                                      index < passwordStrength.score
                                        ? passwordStrength.color
                                            .replace("bg-", "")
                                            .replace("red-500", "#ef4444")
                                            .replace("orange-500", "#f97316")
                                            .replace("yellow-500", "#eab308")
                                            .replace("green-500", "#22c55e")
                                        : "#e5e7eb",
                                  }}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Password requirements checklist */}
                          <div className="space-y-1.5">
                            {checks.map((check, index) => (
                              <motion.div
                                key={check.label}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-2"
                              >
                                {check.passed ? (
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <XIcon className="h-3.5 w-3.5 text-gray-300" />
                                )}
                                <span
                                  className={`text-xs ${check.passed ? "text-green-600" : "text-gray-400"}`}
                                >
                                  {check.label}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Forgot password link */}
                  <div className="flex justify-end">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        handleClose();
                        navigate("/forgot-password");
                      }}
                      className="text-xs font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 transition-colors hover:text-rose-500 hover:decoration-rose-500"
                    >
                      Forgot password?
                    </motion.button>
                  </div>

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="relative w-full overflow-hidden rounded-xl bg-gray-900 py-4 font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {loading ? (
                        <motion.span
                          key="loading"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing...
                        </motion.span>
                      ) : (
                        <motion.span
                          key="continue"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          Continue
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.form>

                {/* Divider */}
                <div className="my-6 md:my-4 flex items-center gap-4">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    or
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                {/* Google Login */}
                <motion.div
                  className="flex justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {googleLoading ? (
                    <div className="flex h-[48px] w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                      Connecting to Google...
                    </div>
                  ) : (
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() =>
                        toast.error("Google Login popup was closed or failed.")
                      }
                      useOneTap={false}
                      shape="pill"
                      size="large"
                      width="100%"
                      logo_alignment="center"
                      text={view === "login" ? "signin_with" : "signup_with"}
                    />
                  )}
                </motion.div>

                {/* Footer Toggle */}
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600">
                  <p>
                    {view === "login"
                      ? "Don't have an account?"
                      : "Already have an account?"}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setView(view === "login" ? "register" : "login");
                      setShowPassword(false);
                    }}
                    className="font-semibold text-black underline decoration-gray-300 underline-offset-2 transition-colors hover:text-rose-500 hover:decoration-rose-500"
                  >
                    {view === "login" ? "Sign up" : "Log in"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
