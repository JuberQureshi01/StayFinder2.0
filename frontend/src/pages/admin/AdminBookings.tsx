import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiFetch from "../../services/apiFetch";
import { SkeletonTable } from "../../components/ui/skeleton";

interface Booking {
  _id: string;
  user: { profile: { name: string }; email: string };
  host: { profile: { name: string }; email: string };
  listing: { title: string; price: number };
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

const AdminBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params: any = { pageSize: "50" };
      if (statusFilter) params.status = statusFilter;
      const res = await apiFetch.get("/admin/bookings", { params });
      setBookings(res.data.bookings || []);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">
        Booking Monitoring
      </h1>

      <div className="mb-6 flex gap-2">
        {["", "pending", "confirmed", "completed", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
              statusFilter === s
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-2xl border bg-white p-8 shadow-sm">
          <SkeletonTable rows={6} cols={6} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Guest</th>
                <th className="px-6 py-4 font-semibold">Host</th>
                <th className="px-6 py-4 font-semibold">Property</th>
                <th className="px-6 py-4 font-semibold">Dates</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b) => (
                <tr key={b._id} className="transition hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">
                    {b.user?.profile?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {b.host?.profile?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {b.listing?.title || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs">
                    {new Date(b.checkIn).toLocaleDateString()} –{" "}
                    {new Date(b.checkOut).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    ₹{b.totalPrice.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        b.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : b.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : b.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
