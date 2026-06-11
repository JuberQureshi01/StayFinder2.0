import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Navigate } from "react-router-dom";
import { Home, Loader2, Upload, Clock, CheckCircle, XCircle } from "lucide-react";
import { Skeleton, SkeletonLineGroup } from "../components/ui/skeleton";
import { toast } from "sonner";
import { RootState } from "../app/store";
import apiFetch from "../services/apiFetch";

interface Application {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
}

const BecomeHost = () => {
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [reason, setReason] = useState("");
  const [idProof, setIdProof] = useState<File | null>(null);

  useEffect(() => {
    if (!user) { navigate("/", { replace: true }); return; }
    if (user.role === "host" && (user as any).profile?.verified) { navigate("/host/dashboard", { replace: true }); return; }

    const fetchStatus = async () => {
      try {
        const res = await apiFetch.get("/host-application/my-status");
        setApplication(res.data.application);
      } catch {
        // no application yet
      } finally {
        setCheckingStatus(false);
        setLoading(false);
      }
    };
    fetchStatus();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return toast.error("Full name is required.");
    if (!email.trim()) return toast.error("Email is required.");
    if (!phone.trim() || phone.length < 10) return toast.error("Valid phone number is required.");
    if (!address.trim()) return toast.error("Address is required.");
    if (!city.trim()) return toast.error("City is required.");
    if (!state.trim()) return toast.error("State is required.");
    if (!propertyType) return toast.error("Select a property type.");
    if (!reason.trim() || reason.length < 20) return toast.error("Please explain why you want to host (min 20 characters).");

    setSubmitting(true);
    const toastId = toast.loading("Submitting your application...");
    try {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("address", address);
      formData.append("city", city);
      formData.append("state", state);
      formData.append("propertyType", propertyType);
      formData.append("reason", reason);
      if (idProof) formData.append("idProof", idProof);

      const res = await apiFetch.post("/host-application/apply", formData);
      setApplication(res.data.application);
      toast.success("Application submitted! Admin will review it shortly.", { id: toastId });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit application.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Skeleton className="mb-8 h-8 w-48" />
        <div className="space-y-6 rounded-2xl border bg-white p-8 shadow-sm">
          <SkeletonLineGroup lines={3} />
          <Skeleton className="h-10 w-full" />
          <SkeletonLineGroup lines={2} />
          <Skeleton className="h-10 w-full" />
          <SkeletonLineGroup lines={2} />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="mx-auto mt-4 h-12 w-40 rounded-xl" />
        </div>
      </div>
    );
  }

  // Approved
  if (application?.status === "approved") {
    return <Navigate to="/host/dashboard" replace />;
  }

  // Pending
  if (application?.status === "pending") {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="rounded-2xl border bg-white p-12 shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="mb-3 text-2xl font-bold text-gray-900">Application Under Review</h1>
            <p className="mb-6 text-gray-500">
              Your host application is being reviewed by our admin team. You'll be able to start hosting once it's approved.
            </p>
            <div className="rounded-xl bg-gray-50 p-4 text-left text-sm text-gray-600">
              <p><strong>Name:</strong> {application.fullName}</p>
              <p><strong>Property Type:</strong> {application.propertyType}</p>
              <p><strong>Submitted:</strong> {new Date(application.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Rejected
  if (application?.status === "rejected") {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="rounded-2xl border bg-white p-12 shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="mb-3 text-2xl font-bold text-gray-900">Application Not Approved</h1>
            {application.adminNote && (
              <p className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{application.adminNote}</p>
            )}
            <button
              onClick={() => setApplication(null)}
              className="rounded-xl bg-gray-900 px-8 py-3 text-sm font-medium text-white hover:bg-black"
            >
              Submit New Application
            </button>
          </div>
        </main>
      </div>
    );
  }

  // No application yet — show form
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Become a Host</h1>
          <p className="mt-2 text-gray-500">Fill in your details for admin verification</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border bg-white p-8 shadow-sm">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-gray-900" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-gray-900" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone *</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-gray-900" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Property Type *</label>
              <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-gray-900">
                <option value="">Select...</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="villa">Villa</option>
                <option value="cabin">Cabin</option>
                <option value="room">Private Room</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Address *</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-gray-900" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">City *</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-gray-900" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">State *</label>
              <input value={state} onChange={(e) => setState(e.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-gray-900" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Why do you want to host? *</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-gray-900" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ID Proof (optional)</label>
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                <Upload className="h-4 w-4" />
                Upload File
                <input type="file" accept="image/*,.pdf" onChange={(e) => setIdProof(e.target.files?.[0] || null)} className="hidden" />
              </label>
              {idProof && <span className="text-sm text-gray-500">{idProof.name}</span>}
            </div>
          </div>

          <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-medium text-white hover:bg-black disabled:opacity-50">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : "Submit for Review"}
          </button>
        </form>
      </main>
    </div>
  );
};

export default BecomeHost;
