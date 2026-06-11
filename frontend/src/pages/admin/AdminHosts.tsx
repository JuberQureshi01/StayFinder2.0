import { useEffect, useState } from "react";
import { Check, X, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import apiFetch from "../../services/apiFetch";
import { SkeletonTable } from "../../components/ui/skeleton";

interface Application {
  _id: string;
  user: { _id: string; profile: { name: string }; email: string };
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  reason: string;
  idProofUrl?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const AdminHosts = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await apiFetch.get(`/host-application/all?status=${filter}`);
      setApplications(res.data.applications || []);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const handleApprove = async (id: string) => {
    try {
      await apiFetch.patch(`/host-application/${id}/approve`);
      toast.success("Host approved!");
      fetchApplications();
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async (id: string) => {
    const note = prompt("Reason for rejection (optional):");
    try {
      await apiFetch.patch(`/host-application/${id}/reject`, { adminNote: note || undefined });
      toast.success("Application rejected");
      fetchApplications();
    } catch {
      toast.error("Failed to reject");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Host Applications</h1>

      <div className="mb-6 flex gap-2">
        {["pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
              filter === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-2xl border bg-white p-8 shadow-sm">
          <SkeletonTable rows={4} cols={6} />
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed bg-gray-50 py-20 text-center">
          <p className="text-lg font-medium text-gray-900">No {filter} applications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app._id} className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">{app.fullName}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      app.status === "approved" ? "bg-green-100 text-green-700"
                      : app.status === "rejected" ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <div className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-3">
                    <p><strong>Email:</strong> {app.email}</p>
                    <p><strong>Phone:</strong> {app.phone}</p>
                    <p><strong>Property:</strong> {app.propertyType}</p>
                    <p><strong>City:</strong> {app.city}</p>
                    <p><strong>State:</strong> {app.state}</p>
                    <p><strong>Address:</strong> {app.address}</p>
                  </div>

                  <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                    <strong>Reason:</strong> {app.reason}
                  </div>

                  {app.idProofUrl && (
                    <a href={app.idProofUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm text-rose-600 hover:underline">
                      <ExternalLink className="h-3 w-3" /> View ID Proof
                    </a>
                  )}
                </div>

                {app.status === "pending" && (
                  <div className="ml-4 flex gap-2">
                    <button onClick={() => handleApprove(app._id)}
                      aria-label="Approve host"
                      className="rounded-lg bg-green-50 p-2 text-green-600 hover:bg-green-100">
                      <Check className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleReject(app._id)}
                      aria-label="Reject host"
                      className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminHosts;
