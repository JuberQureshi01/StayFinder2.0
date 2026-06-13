import { useEffect, useState } from "react";
import { Search, Ban, CheckCircle, Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { RootState } from "@/app/store";
import apiFetch from "@/services/apiFetch";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

interface User {
  _id: string;
  email: string;
  profile: { name: string; verified?: boolean };
  role: string;
  banned?: boolean;
  createdAt: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = { pageSize: "50" };
      if (roleFilter !== "all") params.role = roleFilter;
      if (search) params.search = search;
      const res = await apiFetch.get("/admin/users", { params });
      setUsers(res.data.users || []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleBan = async (id: string, banned: boolean) => {
    setTogglingId(id);
    try {
      await apiFetch.patch(`/admin/users/${id}/${banned ? "unban" : "ban"}`);
      toast.success(banned ? "User unbanned" : "User banned");
      fetchUsers();
    } catch {
      toast.error("Failed to update user");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">
        User Management
      </h1>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none focus:border-gray-900"
          />
        </form>
        <div className="flex gap-2">
          {["all", "user", "host", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
                roleFilter === r
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-2xl border bg-white p-8 shadow-sm">
          <SkeletonTable rows={6} cols={5} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Verified</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user._id} className="transition hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {user.profile?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.profile?.verified ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.banned ? (
                      <span className="text-sm font-medium text-red-600">Banned</span>
                    ) : (
                      <span className="text-sm font-medium text-green-600">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {user._id !== (currentUser as any)?.id ? (
                        <>
                          <button
                            onClick={() => handleBan(user._id, !!user.banned)}
                            disabled={togglingId === user._id}
                            aria-label={user.banned ? `Unban ${user.profile?.name || user.email}` : `Ban ${user.profile?.name || user.email}`}
                            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                              user.banned
                                ? "bg-green-50 text-green-700 hover:bg-green-100"
                                : "bg-red-50 text-red-700 hover:bg-red-100"
                            }`}
                          >
                            {togglingId === user._id ? (
                              <Spinner size="sm" />
                            ) : (
                              <Ban className="h-3 w-3" />
                            )}
                            {user.banned ? "Unban" : "Ban"}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">You</span>
                      )}
                    </div>
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

export default AdminUsers;
