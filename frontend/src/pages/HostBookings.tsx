import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  User,
  X,
  MessageCircle,
  Loader2,
  ChevronLeft,
  AlertTriangle,
  Search,
} from "lucide-react";
import apiFetch from "../services/apiFetch";

const STATUS_TABS = ["all", "pending", "confirmed", "completed", "cancelled"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

type Booking = {
  _id: string;
  user: { _id: string; profile: { name: string; image?: string; email?: string } };
  listing: { _id: string; title: string; images: string[]; locationName: string; price: number };
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: string;
  createdAt: string;
};

const HostBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await apiFetch.get("/bookings/host", { params: { limit: 50 } });
        setBookings(res.data.bookings || []);
      } catch {
        toast.error("Failed to load reservations.");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  useEffect(() => {
    let result = bookings;
    if (activeTab !== "all") {
      result = result.filter((b) => b.status === activeTab);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (b) =>
          b.user?.profile?.name?.toLowerCase().includes(q) ||
          b.listing?.title?.toLowerCase().includes(q) ||
          b.listing?.locationName?.toLowerCase().includes(q),
      );
    }
    setFilteredBookings(result);
  }, [activeTab, searchTerm, bookings]);

  const formatDate = (d: string | Date) =>
    new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

  const getNights = (checkIn: string, checkOut: string) =>
    Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await apiFetch.patch(`/bookings/${cancelTarget._id}/host-cancel`, {
        reason: cancelReason || "Cancelled by host",
      });
      setBookings((prev) => prev.filter((b) => b._id !== cancelTarget._id));
      toast.success("Booking cancelled. Full refund initiated to guest.");
      setCancelTarget(null);
      setCancelReason("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setCancelling(false);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      confirmed: "bg-emerald-100 text-emerald-700",
      completed: "bg-blue-100 text-blue-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Cancel Reservation?</h3>
              <p className="mt-2 text-sm text-gray-600">
                This will cancel <strong>{cancelTarget.user?.profile?.name}</strong>'s stay at{" "}
                <strong>{cancelTarget.listing?.title}</strong>.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                This action cannot be undone.
              </p>

              {/* Payment breakdown */}
              <div className="mt-4 rounded-xl bg-gray-50 p-4 text-left">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Payment Breakdown
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Booking Amount</span>
                    <span className="font-medium text-gray-900">
                      ₹{cancelTarget.totalPrice?.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Refund to Guest</span>
                    <span className="font-semibold text-emerald-600">
                      ₹{cancelTarget.totalPrice?.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Your Deduction</span>
                    <span className="font-medium text-gray-900">₹0</span>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold">✓</span>
                    Full refund — 100% of the booking amount goes back to the guest
                  </div>
                </div>
              </div>

              <div className="mt-4 text-left">
                <label className="text-xs font-medium text-gray-500">Reason (optional)</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Property maintenance issue"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-gray-400 focus:ring-0"
                  rows={2}
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => { setCancelTarget(null); setCancelReason(""); }}
                  disabled={cancelling}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelling ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cancelling...
                    </span>
                  ) : (
                    "Yes, Cancel"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/host/dashboard"
            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 transition hover:text-gray-900"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reservations</h1>
          <p className="mt-1 text-gray-500">
            {bookings.length} booking{bookings.length !== 1 ? "s" : ""} across your properties
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search guest or property..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gray-400 focus:ring-0"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const count =
            tab === "all"
              ? bookings.length
              : bookings.filter((b) => b.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {tab}
              <span
                className={`ml-1.5 rounded-md px-1.5 py-0.5 text-xs ${
                  activeTab === tab ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-20">
          <Calendar className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900">No reservations found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? "Try adjusting your search or filters"
              : activeTab !== "all"
                ? `No ${activeTab} reservations yet`
                : "Guests haven't booked your properties yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const nights = getNights(booking.checkIn, booking.checkOut);
            return (
              <div
                key={booking._id}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Guest + Listing Info */}
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
                      {booking.user?.profile?.image ? (
                        <img src={booking.user.profile.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-gray-900">
                          {booking.user?.profile?.name || "Guest"}
                        </h3>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge(booking.status)}`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-gray-500">
                        {booking.listing?.title || "Property"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {booking.listing?.locationName || "Unknown"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}
                          <span className="text-gray-300">· {nights} {nights === 1 ? "night" : "nights"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price + Actions */}
                  <div className="flex items-center gap-3 pl-16 sm:pl-0">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ₹{booking.totalPrice?.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Link
                        to={`/chat/${booking._id}`}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                        title="Message guest"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Link>
                      {(booking.status === "confirmed" || booking.status === "pending") && (
                        <button
                          onClick={() => setCancelTarget(booking)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100 hover:text-red-700"
                          title="Cancel booking"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HostBookings;
