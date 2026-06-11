import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import apiFetch from "../../services/apiFetch";
import { Skeleton, SkeletonKPICard, SkeletonChart } from "../../components/ui/skeleton";

interface DashboardStats {
  totalUsers: number;
  totalHosts: number;
  totalListings: number;
  totalBookings: number;
  totalRevenue: number;
  monthlyRevenue: { _id: string; revenue: number; count: number }[];
  categoryDistribution: { _id: string; count: number }[];
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch.get("/admin/dashboard");
        setStats(res.data.stats);
      } catch {
        toast.error("Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="mb-8 h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonKPICard key={i} />)}
        </div>
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <Skeleton className="mb-4 h-6 w-32" />
            <SkeletonChart />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <Skeleton className="mb-4 h-6 w-40" />
            <SkeletonChart />
          </div>
        </div>
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <Skeleton className="mb-4 h-6 w-36" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Total Hosts",
      value: stats?.totalHosts || 0,
      icon: TrendingUp,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Total Listings",
      value: stats?.totalListings || 0,
      icon: Building2,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Total Bookings",
      value: stats?.totalBookings || 0,
      icon: CalendarCheck,
      color: "bg-amber-100 text-amber-600",
    },
    {
      label: "Total Revenue",
      value: `₹${(stats?.totalRevenue || 0).toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: "bg-rose-100 text-rose-600",
    },
  ];

  const revenueData = stats?.monthlyRevenue || [];
  const maxRevenue = Math.max(...revenueData.map((m) => m.revenue), 1);
  const maxBookings = Math.max(...revenueData.map((m) => m.count), 1);

  const chartW = 700;
  const chartH = 220;
  const padL = 50;
  const padR = 20;
  const padT = 10;
  const padB = 30;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const revenuePath = revenueData.length > 1
    ? revenueData
        .map((d, i) => {
          const x = padL + (i / (revenueData.length - 1)) * innerW;
          const y = padT + innerH - (d.revenue / maxRevenue) * innerH;
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ")
    : "";

  const areaPath = revenueData.length > 1
    ? revenuePath +
      ` L${padL + innerW},${padT + innerH} L${padL},${padT + innerH} Z`
    : "";

  const bookingPath = revenueData.length > 1
    ? revenueData
        .map((d, i) => {
          const x = padL + (i / (revenueData.length - 1)) * innerW;
          const y = padT + innerH - (d.count / maxBookings) * innerH;
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ")
    : "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${card.color}`}
              >
                <card.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {card.label}
                </p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {card.value}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Revenue Area Chart */}
        {revenueData.length > 0 && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-gray-900">Revenue Trend</h2>
            <p className="mb-4 text-xs text-gray-400">Monthly revenue in INR</p>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                const y = padT + innerH - frac * innerH;
                const val = Math.round(maxRevenue * frac);
                return (
                  <g key={frac}>
                    <line
                      x1={padL} y1={y} x2={chartW - padR} y2={y}
                      stroke="#e5e7eb" strokeWidth="1"
                    />
                    <text x={padL - 8} y={y + 4} textAnchor="end" className="text-[10px]" fill="#9ca3af">
                      ₹{(val / 1000).toFixed(0)}k
                    </text>
                  </g>
                );
              })}
              {/* Area fill */}
              {areaPath && (
                <path d={areaPath} fill="url(#revGrad)" opacity="0.3" />
              )}
              {/* Line */}
              {revenuePath && (
                <path d={revenuePath} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinejoin="round" />
              )}
              {/* Dots */}
              {revenueData.map((d, i) => {
                const x = padL + (i / (revenueData.length - 1)) * innerW;
                const y = padT + innerH - (d.revenue / maxRevenue) * innerH;
                return (
                  <circle key={d._id} cx={x} cy={y} r="4" fill="#f43f5e" stroke="#fff" strokeWidth="2">
                    <title>₹{d.revenue.toLocaleString("en-IN")} — {d._id}</title>
                  </circle>
                );
              })}
              {/* X-axis labels */}
              {revenueData.map((d, i) => {
                const x = padL + (i / (revenueData.length - 1)) * innerW;
                const show = revenueData.length <= 12 || i % 2 === 0;
                return show ? (
                  <text key={d._id} x={x} y={chartH - 6} textAnchor="middle" className="text-[10px]" fill="#9ca3af">
                    {d._id.slice(5)}/{d._id.slice(2, 4)}
                  </text>
                ) : null;
              })}
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />
              Revenue
            </div>
          </div>
        )}

        {/* Bookings Bar Chart */}
        {revenueData.length > 0 && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-gray-900">Monthly Bookings</h2>
            <p className="mb-4 text-xs text-gray-400">Confirmed bookings per month</p>
            <div className="flex h-[220px] items-end gap-1.5">
              {revenueData.map((d) => {
                const h = (d.count / maxBookings) * 200;
                return (
                  <div key={d._id} className="group relative flex flex-1 flex-col items-center justify-end h-full">
                    <span className="mb-1 text-[10px] font-medium text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.count}
                    </span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-rose-500 to-rose-400 transition-all hover:from-rose-600 hover:to-rose-500"
                      style={{ height: `${Math.max(h, 4)}px` }}
                    />
                    <span className="mt-1 text-[9px] text-gray-400">
                      {d._id.slice(5)}/{d._id.slice(2, 4)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Category Distribution */}
      {stats?.categoryDistribution && stats.categoryDistribution.length > 0 && (
        <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-bold text-gray-900">Category Distribution</h2>
          <p className="mb-4 text-xs text-gray-400">Listings grouped by category</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.categoryDistribution.map((cat) => {
              const total = stats.categoryDistribution.reduce((s, c) => s + c.count, 0);
              const pct = ((cat.count / total) * 100).toFixed(0);
              return (
                <div key={cat._id} className="rounded-xl border bg-gray-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">{cat._id}</span>
                    <span className="text-xs font-medium text-gray-500">{cat.count} ({pct}%)</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-200">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Manage Users", to: "/admin/users", icon: Users },
          { label: "Manage Listings", to: "/admin/listings", icon: Building2 },
          { label: "Manage Bookings", to: "/admin/bookings", icon: CalendarCheck },
          { label: "Pending Hosts", to: "/admin/hosts", icon: TrendingUp },
        ].map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="flex items-center gap-3 rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600">
              <link.icon className="h-5 w-5" />
            </div>
            <span className="font-semibold text-gray-900">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
