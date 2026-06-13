import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import {
  Building2,
  Wallet,
  CalendarCheck,
  Plus,
  Edit,
  Trash2,
  Loader2,
  TrendingUp,
  BarChart3,
  MessageCircle,
  User,
  ChevronRight,
} from "lucide-react";
import apiFetch from "@/services/apiFetch";
import { RootState } from "@/app/store";
import { Skeleton, SkeletonKPICard, SkeletonChart, SkeletonTable } from "@/components/ui/skeleton";

const HostDashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [listings, setListings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<any[]>([]);
  const [totalEarningsData, setTotalEarningsData] = useState(0);
  const [totalBookingsData, setTotalBookingsData] = useState(0);
  const [loading, setLoading] = useState(true);

  const formatDate = (d: string | Date) =>
    new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [listingsRes, earningsRes] = await Promise.all([
          apiFetch.get("/listings/host"),
          apiFetch.get("/listings/analytics/earnings").catch(() => ({ data: { monthlyEarnings: [], totalEarnings: 0, totalBookings: 0 } })),
        ]);
        setListings(listingsRes.data.listings || []);
        setMonthlyEarnings(earningsRes.data.monthlyEarnings || []);
        setTotalEarningsData(earningsRes.data.totalEarnings || 0);
        setTotalBookingsData(earningsRes.data.totalBookings || 0);

        try {
          const bookingsRes = await apiFetch.get("/bookings/host", { params: { limit: 10 } });
          setBookings(bookingsRes.data.bookings || []);
        } catch (err: any) {
          if (err?.response?.status !== 403) {
      
          }
          setBookings([]);
        }
      } catch {
        toast.error("Failed to load dashboard metrics.");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchDashboardData();
  }, [user]);

  const handleDelete = async (listingId: string) => {
    if (!window.confirm("Are you sure you want to delete this property? This action cannot be undone.")) return;

    const toastId = toast.loading("Deleting property...");
    try {
      await apiFetch.delete(`/listings/${listingId}`);
      setListings((prev) => prev.filter((l) => l._id !== listingId));
      toast.success("Property removed successfully.", { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete property.", { id: toastId });
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === "pending").length;
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "completed").length;
  const avgPerMonth = monthlyEarnings.length > 0
    ? Math.round(totalEarningsData / monthlyEarnings.length)
    : 0;
  const bestMonth = monthlyEarnings.length > 0
    ? monthlyEarnings.reduce((max, m) => (m.revenue > max.revenue ? m : max), monthlyEarnings[0])
    : null;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="mb-8 h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonKPICard key={i} />)}
        </div>
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <Skeleton className="mb-4 h-6 w-32" />
            <SkeletonChart />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <Skeleton className="mb-4 h-6 w-24" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
        <Skeleton className="mt-8 h-8 w-40" />
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <SkeletonTable rows={4} cols={4} />
        </div>
      </div>
    );
  }

  const earnings = monthlyEarnings;
  const maxEarn = Math.max(...earnings.map((m: any) => m.revenue), 1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Host Dashboard</h1>
          <p className="mt-1 text-gray-500">
            Welcome back, {user?.name}. Here is what's happening with your properties.
          </p>
        </div>
        <Link
          to="/host/create-listing"
          className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
        >
          <Plus className="h-4 w-4" /> Add New Property
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Earnings</p>
              <h3 className="text-2xl font-bold text-gray-900">₹{totalEarningsData.toLocaleString("en-IN")}</h3>
            </div>
          </div>
          {avgPerMonth > 0 && (
            <p className="mt-2 text-xs text-gray-400">Avg ₹{avgPerMonth.toLocaleString("en-IN")}/month</p>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Properties</p>
              <h3 className="text-2xl font-bold text-gray-900">{listings.length}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Bookings</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalBookingsData}</h3>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">{confirmedBookings} completed</p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <h3 className="text-2xl font-bold text-gray-900">{pendingBookings}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recent Bookings</h2>
          {bookings.length > 0 ? (
            <Link
              to="/host/bookings"
              className="flex items-center gap-1 text-sm font-medium text-rose-500 transition hover:text-rose-600"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CalendarCheck className="mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">No reservations yet</p>
            <p className="text-xs text-gray-400">Bookings from guests will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {bookings.slice(0, 5).map((booking) => (
              <div key={booking._id} className="flex items-center gap-4 py-3 transition hover:bg-gray-50/50">
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                  {booking.user?.profile?.image ? (
                    <img
                      src={booking.user.profile.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {booking.user?.profile?.name || "Guest"}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {booking.listing?.title || "Listing"} · {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    ₹{booking.totalPrice?.toLocaleString("en-IN")}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      booking.status === "confirmed"
                        ? "bg-green-100 text-green-700"
                        : booking.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : booking.status === "completed"
                            ? "bg-blue-100 text-blue-700"
                            : booking.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Earnings Chart + Best Month */}
      {earnings.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Revenue Area Chart */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="mb-1 text-lg font-bold text-gray-900">Earnings Overview</h2>
            <p className="mb-4 text-xs text-gray-400">Monthly revenue from bookings</p>
            <svg viewBox="0 0 700 220" className="w-full">
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                const y = 10 + 180 - frac * 180;
                const val = Math.round(maxEarn * frac);
                return (
                  <g key={frac}>
                    <line x1={50} y1={y} x2={680} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                    <text x={42} y={y + 4} textAnchor="end" className="text-[10px]" fill="#9ca3af">
                      ₹{(val / 1000).toFixed(0)}k
                    </text>
                  </g>
                );
              })}
              {(() => {
                const d = earnings;
                const p = d.map((m: any, i: number) => {
                  const x = 50 + (i / (d.length - 1 || 1)) * 630;
                  const y = 10 + 180 - (m.revenue / maxEarn) * 180;
                  return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
                }).join(" ");
                const area = p + ` L680,190 L50,190 Z`;
                return (
                  <>
                    <path d={area} fill="url(#earnGrad)" opacity="0.25" />
                    <path d={p} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinejoin="round" />
                  </>
                );
              })()}
              {earnings.map((m: any, i: number) => {
                const x = 50 + (i / (earnings.length - 1 || 1)) * 630;
                const y = 10 + 180 - (m.revenue / maxEarn) * 180;
                return (
                  <circle key={m._id} cx={x} cy={y} r="4" fill="#f43f5e" stroke="#fff" strokeWidth="2">
                    <title>₹{m.revenue.toLocaleString("en-IN")} — {m._id}</title>
                  </circle>
                );
              })}
              {earnings.map((m: any, i: number) => {
                const x = 50 + (i / (earnings.length - 1 || 1)) * 630;
                const show = earnings.length <= 12 || i % 2 === 0;
                return show ? (
                  <text key={m._id} x={x} y={214} textAnchor="middle" className="text-[10px]" fill="#9ca3af">
                    {m._id.slice(5)}/{m._id.slice(2, 4)}
                  </text>
                ) : null;
              })}
              <defs>
                <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" /> Earnings</span>
            </div>
          </div>

          {/* Summary Card */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Summary</h2>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium text-gray-400">THIS MONTH</p>
                {(() => {
                  const latest = earnings[earnings.length - 1];
                  if (!latest) return <p className="text-xl font-bold text-gray-900">₹0</p>;
                  return <p className="text-xl font-bold text-gray-900">₹{latest.revenue.toLocaleString("en-IN")}</p>;
                })()}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">BEST MONTH</p>
                {bestMonth ? (
                  <div>
                    <p className="text-xl font-bold text-green-600">₹{bestMonth.revenue.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-gray-400">{bestMonth._id}</p>
                  </div>
                ) : (
                  <p className="text-xl font-bold text-gray-900">—</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">AVERAGE / MONTH</p>
                <p className="text-xl font-bold text-gray-900">₹{avgPerMonth.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">BOOKINGS / MONTH</p>
                <p className="text-xl font-bold text-gray-900">
                  {earnings.length > 0 ? Math.round(totalBookingsData / earnings.length) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Breakdown Table */}
      {earnings.length > 0 && (
        <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Monthly Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="pb-3 font-semibold">Month</th>
                  <th className="pb-3 font-semibold">Revenue</th>
                  <th className="pb-3 font-semibold">Bookings</th>
                  <th className="pb-3 font-semibold">Avg / Booking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...earnings].reverse().map((m: any) => (
                  <tr key={m._id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{m._id}</td>
                    <td className="py-3 text-gray-700">₹{m.revenue.toLocaleString("en-IN")}</td>
                    <td className="py-3 text-gray-700">{m.bookings}</td>
                    <td className="py-3 text-gray-700">₹{m.bookings > 0 ? Math.round(m.revenue / m.bookings).toLocaleString("en-IN") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Property Management */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Your Properties</h2>
        {listings.length > 0 && (
          <span className="text-xs text-gray-400">{listings.length} total</span>
        )}
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 py-16">
          <Building2 className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">No properties listed</h3>
          <p className="mt-1 text-sm text-gray-500">You haven't added any properties to host yet.</p>
          <Link to="/host/create-listing" className="mt-4 rounded-xl bg-gray-900 px-6 py-2 text-sm font-medium text-white transition hover:bg-black">
            Create your first listing
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Listing Details</th>
                  <th className="px-6 py-4 font-semibold">Price / Night</th>
                  <th className="px-6 py-4 font-semibold">Location</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings.map((listing) => (
                  <tr key={listing._id} className="transition hover:bg-gray-50">
                    <td className="flex items-center gap-4 px-6 py-4">
                      <img src={listing.images?.[0] || "https://placehold.co/100x100"} alt="Thumbnail" className="h-12 w-12 rounded-lg object-cover shadow-sm" />
                      <div className="flex flex-col">
                        <span className="max-w-[200px] truncate font-semibold text-gray-900">{listing.title}</span>
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                          ⭐ {(listing.numReviews || 0) > 2 ? listing.rating?.toFixed(1) : "New"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">₹{listing.price.toLocaleString("en-IN")}</td>
                    <td className="max-w-[150px] truncate px-6 py-4">{listing.locationName || "Location not set"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        {listing.category || "Trending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/host/edit-listing/${listing._id}`} className="flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900">
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button onClick={() => handleDelete(listing._id)} className="rounded-lg border border-red-100 bg-red-50 p-2 text-red-600 transition hover:bg-red-100">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostDashboard;
