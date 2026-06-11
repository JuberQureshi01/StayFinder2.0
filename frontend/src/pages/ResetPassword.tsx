import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiFetch from "../services/apiFetch";

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters long.");
    }
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    setIsSubmitting(true);
    try {
      await apiFetch.put(`/auth/reset-password/${token}`, { password });
      toast.success("Password reset successful! You can now log in.");
      navigate("/"); // Redirect to home so they can open the login modal
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid or expired token.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Create New Password
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Your new password must be different from previous used passwords.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-3 w-full rounded-xl border px-4 py-3 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              required
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
