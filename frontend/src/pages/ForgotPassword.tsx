import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import apiFetch from "../services/apiFetch";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email address.");

    setIsSubmitting(true);
    try {
      await apiFetch.post("/auth/forgot-password", { email });
      setIsSent(true);
      toast.success("Reset link sent successfully!");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to send reset link.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <Link
          to="/"
          className="mb-6 flex items-center text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Link>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Reset Password
        </h1>

        {isSent ? (
          <div className="rounded-xl bg-green-50 p-4 text-green-800">
            <p className="text-sm font-medium">
              We've sent a password reset link to <strong>{email}</strong>.
              Please check your inbox and spam folder.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-gray-500">
              Enter the email address associated with your account and we'll
              send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3.5 font-semibold text-white transition hover:bg-black disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Reset Link
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
