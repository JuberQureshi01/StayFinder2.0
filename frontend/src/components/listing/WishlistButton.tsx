import { useState } from "react";
import { Heart } from "lucide-react";
import { apiPost } from "@/services/apiFetch";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";

interface WishlistButtonProps {
  listingId: string;
  initialIsFavorited?: boolean;
}

const WishlistButton = ({
  listingId,
  initialIsFavorited = false,
}: WishlistButtonProps) => {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [loading, setLoading] = useState(false);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevents navigating if the button is wrapped inside a Link tag
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please log in to save properties.");
      return;
    }

    // Optimistic UI Update (Instant visual feedback)
    setIsFavorited(!isFavorited);
    setLoading(true);

    try {
      // Assuming you added this path: `/users/wishlist/${id}`
      const res = await apiPost(`/users/wishlist/${listingId}`);
      // 
 
      // Sync with backend truth
      if (res.message === "Removed from wishlist") setIsFavorited(false);
      if (res.message === "Added to wishlist") setIsFavorited(true);
    } catch (error: any) {
      // Revert if API fails
      setIsFavorited(!isFavorited);
      toast.error(error?.response?.data?.message || error?.message || "Failed to update wishlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className={`group flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-md transition-all hover:scale-105 active:scale-95 ${
        loading ? "opacity-50" : ""
      }`}
    >
      <Heart
        className={`h-5 w-5 transition-colors duration-300 ${
          isFavorited
            ? "fill-red-500 text-red-500"
            : "fill-transparent text-gray-600 group-hover:text-red-400"
        }`}
      />
    </button>
  );
};

export default WishlistButton;
