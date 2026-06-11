import { useEffect, useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiFetch from "../../services/apiFetch";
import { SkeletonTable } from "../../components/ui/skeleton";

interface Listing {
  _id: string;
  title: string;
  price: number;
  images: string[];
  host: { profile: { name: string }; email: string };
  status?: string;
  category: string;
  createdAt: string;
}

const AdminListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch.get("/admin/listings", {
        params: { pageSize: "50" },
      });
      setListings(res.data.listings || []);
    } catch {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await apiFetch.patch(`/admin/listings/${id}/approve`);
      toast.success("Listing approved");
      fetchListings();
    } catch {
      toast.error("Failed to approve listing");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiFetch.patch(`/admin/listings/${id}/reject`);
      toast.success("Listing rejected");
      fetchListings();
    } catch {
      toast.error("Failed to reject listing");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">
        Listing Moderation
      </h1>

      {loading ? (
        <div className="overflow-hidden rounded-2xl border bg-white p-8 shadow-sm">
          <SkeletonTable rows={6} cols={6} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Listing</th>
                <th className="px-6 py-4 font-semibold">Host</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map((listing) => (
                <tr key={listing._id} className="transition hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          listing.images?.[0] || "https://placehold.co/60x60"
                        }
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                      <span className="font-medium text-gray-900 truncate max-w-[200px]">
                        {listing.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {listing.host?.profile?.name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    ₹{listing.price.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      {listing.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        listing.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : listing.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : listing.status === "suspended"
                              ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {listing.status || "pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleApprove(listing._id)}
                        aria-label="Approve listing"
                        className="rounded-lg bg-green-50 p-2 text-green-600 transition hover:bg-green-100"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleReject(listing._id)}
                        aria-label="Reject listing"
                        className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
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

export default AdminListings;
