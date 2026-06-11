import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiFetch from "../services/apiFetch";
import ListingCard from "../components/ListingCard";
import { Skeleton, SkeletonCard } from "../components/ui/skeleton";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await apiFetch.get("/users/wishlist");
        setWishlist(response.data.wishlist);
      } catch (error) {
        toast.error("Failed to load your wishlist.");
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <Skeleton className="mb-8 h-9 w-40" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (<SkeletonCard key={i} />))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">
        Wishlists
      </h1>

      {wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-20 px-4 text-center">
          <Heart className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900">
            Create your first wishlist
          </h3>
          <p className="text-gray-500 max-w-md mt-2 leading-relaxed">
            As you search, tap the heart icon to save your favorite places and
            Experiences to a wishlist.
          </p>
          <Link
            to="/"
            className="mt-8 rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white hover:bg-gray-800 transition"
          >
            Start exploring
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {wishlist.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
