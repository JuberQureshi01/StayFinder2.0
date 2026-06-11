import { RootState } from "@/app/store";
import apiFetch from "@/services/apiFetch";
import {
  Heart,
  Star,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Award,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { setCredentials } from "@/features/auth/authSlice";

interface ListingCardProps {
  listing: {
  _id: string;
  title: string;
  location: { coordinates: number[]; address?: string };
  price: number;
  images?: string[];
  rating: number;
  locationName?: string; 
  reviewCount?: number;
  host?: {
    name: string;
    isSuperhost?: boolean;
  };
  category?: string;
  };
}


const ListingCard = ({ listing }: { listing: ListingCardProps["listing"] }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Image navigation
  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (listing.images && listing.images.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === listing.images!.length - 1 ? 0 : prev + 1,
      );
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (listing.images && listing.images.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? listing.images!.length - 1 : prev - 1,
      );
    }
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // minimum distance for swipe

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swiped left - next image
        if (listing.images && listing.images.length > 1) {
          setCurrentImageIndex((prev) =>
            prev === listing.images!.length - 1 ? 0 : prev + 1,
          );
        }
      } else {
        // Swiped right - previous image
        if (listing.images && listing.images.length > 1) {
          setCurrentImageIndex((prev) =>
            prev === 0 ? listing.images!.length - 1 : prev - 1,
          );
        }
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };
  // Auto-slide on mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const autoAdvance = useCallback(() => {
    if (listing.images && listing.images.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === listing.images!.length - 1 ? 0 : prev + 1,
      );
    }
  }, [listing.images]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile || !listing.images || listing.images.length < 2) return;
    const interval = setInterval(autoAdvance, 3500);
    return () => clearInterval(interval);
  }, [isMobile, autoAdvance, listing.images]);

  // Format price in Indian format
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get location display
  const getLocationDisplay = () => {
    if (listing.location?.address) {
      const parts = listing.location.address.split(",");
      return parts[parts.length - 2]?.trim() || listing.location.address;
    }
    return "Location not specified";
  };

  const dispatch = useDispatch();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [isToggling, setIsToggling] = useState(false);

  // 1. DYNAMIC RENDER CHECK: Is this exact listing ID inside the user's wishlist array?
  const isWishlisted = (user as any)?.wishlist?.includes(listing._id);

  // 2. TOGGLE FUNCTION
  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevents the <Link> from redirecting to the details page
    e.stopPropagation();

    if (!user) {
      return toast.error("Please log in to save this to your wishlist.");
    }

    if (isToggling) return; // Prevent spam clicking

    setIsToggling(true);
    try {
      const response = await apiFetch.post(`/users/wishlist/${listing._id}`);

      // Update Redux so the heart instantly changes color across the whole app
      dispatch(
        setCredentials({
          user: response.data.user,
          token: token,
        }),
      );
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update wishlist");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="group flex cursor-pointer flex-col gap-2 p-3 rounded-lg hover:bg-gray-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentImageIndex(0);
      }}
    >
      <Link to={`/listing/${listing._id}`} className="flex flex-col gap-2">
        {/* Image Container */}
        <div
          className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Image with loading state */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: imageLoaded ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full"
            >
              {!imageError ? (
                <img
                  src={
                    listing.images?.[currentImageIndex] ||
                    "https://placehold.co/600x600?text=No+Image"
                  }
                  alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                  className="h-full w-full object-cover transition-transform duration-500 "
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <Sparkles className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Image not available
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Image Loading Skeleton */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 animate-pulse bg-gray-200" />
          )}

          {/* Image Navigation Arrows - Show on hover for desktop */}
          {listing.images && listing.images.length > 1 && isHovered && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl"
              >
                <ChevronLeft className="h-4 w-4 text-gray-800" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl"
              >
                <ChevronRight className="h-4 w-4 text-gray-800" />
              </button>
            </>
          )}

          {/* Image Dots Indicator */}
          {listing.images && listing.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {listing.images.map((_: any, index: any) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentImageIndex
                      ? "w-4 bg-white"
                      : "w-1.5 bg-white/70 hover:bg-white"
                  }`}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Superhost Badge */}
          {listing.host?.isSuperhost && (
            <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-sm">
              <Award className="h-3.5 w-3.5 text-rose-500" />
              <span className="text-gray-900">Superhost</span>
            </div>
          )}

          {/* Category Tag */}
          {listing.category && (
            <div className="absolute left-3 top-3 z-10 rounded-full bg-white/60 px-3 py-1 text-xs font-medium capitalize shadow-sm backdrop-blur-sm">
              {listing.category}
            </div>
          )}

          {/* Dynamic Heart Button */}
          <button
            onClick={handleWishlistClick}
            disabled={isToggling}
            className="absolute right-3 top-3 z-10 transition hover:scale-110 active:scale-95 disabled:opacity-50"
          >
            <Heart
              className={`h-5 w-5 transition-colors duration-200 drop-shadow-md ${
                isWishlisted
                  ? "fill-rose-500 text-rose-500" // Filled red if in wishlist
                  : "fill-black/40 text-white" // Semi-transparent black with white outline if not
              }`}
            />
          </button>
        </div>
      </Link>

      {/* Property Details */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold text-gray-900">
              {listing.title}
            </h3>
            <div className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{listing.locationName || getLocationDisplay()}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="h-4 w-4 fill-current text-gray-900" />
            <span className="text-sm font-light text-gray-900">
              {listing.rating > 0 ? listing.rating.toFixed(1) : "New"}
            </span>
            {listing.reviewCount && listing.reviewCount > 0 && (
              <span className="text-sm font-light text-gray-500">
                ({listing.reviewCount})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-1 pt-0.5">
          <span className="text-base font-semibold text-gray-900">
            {formatPrice(listing.price)}
          </span>
          <span className="text-sm text-gray-500">night</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ListingCard;
