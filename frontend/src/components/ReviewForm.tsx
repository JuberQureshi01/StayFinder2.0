import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/services/apiMethods";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";

interface ReviewFormProps {
  listingId: string;
  onReviewSuccess: () => void; // Callback to refresh the reviews list after submission
}

const ReviewForm = ({ listingId, onReviewSuccess }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to leave a review.");
      return;
    }
    if (rating === 0) {
      toast.warning("Please select a star rating.");
      return;
    }
    if (comment.trim().length < 10) {
      toast.warning("Review comment must be at least 10 characters long.");
      return;
    }

    setLoading(true);
    try {
      // Assuming you added this path: `/reviews/${id}`
      await apiPost(`/reviews/${listingId}`, { rating, comment });

      toast.success("Review submitted successfully!");
      setRating(0);
      setComment("");
      onReviewSuccess(); // Trigger parent to refetch reviews
    } catch (error: any) {
      // This will catch the 403 "You can only review properties you have booked" error
      toast.error(error || "Failed to submit review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-gray-50 p-6">
      <h3 className="mb-4 text-lg font-semibold">Rate Your Stay</h3>

      {/* Star Interactive UI */}
      <div className="mb-4 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              className={`h-8 w-8 ${
                star <= (hoveredStar || rating)
                  ? "fill-yellow-400 text-yellow-400" // Filled Star
                  : "fill-transparent text-gray-300" // Empty Star
              }`}
            />
          </button>
        ))}
      </div>

      <textarea
        placeholder="Share details of your own experience at this place..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="mb-4 min-h-[120px] w-full rounded-xl border border-gray-200 bg-white p-4 outline-none focus:border-black focus:ring-1 focus:ring-black"
        disabled={loading}
      />

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full sm:w-auto"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </Button>
    </div>
  );
};

export default ReviewForm;
