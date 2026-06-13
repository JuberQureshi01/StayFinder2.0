import { useState } from "react";
import { X, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiFetch from "@/services/apiFetch";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  bookingId: string;
  listingTitle: string;
}

const ReviewModal = ({
  isOpen,
  onClose,
  listingId,
  bookingId,
  listingTitle,
}: ReviewModalProps) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.length < 10) {
      toast.error("Please write at least 10 characters for your review.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting your review...");

    try {
      await apiFetch.post(`/reviews/${listingId}`, {
        rating,
        comment,
        bookingId, // Sending this so the backend can verify they actually stayed here!
      });

      toast.success("Review published successfully!", { id: toastId });
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit review.", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-base font-bold">Review your stay</h2>
          <div className="w-9" />
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="mb-2 text-xl font-semibold text-gray-900">
            {listingTitle}
          </h3>
          <p className="mb-6 text-sm text-gray-500">
            How was your experience? Your feedback helps other travelers.
          </p>

          {/* Interactive Star Rating */}
          <div className="mb-6 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-10 w-10 ${
                    star <= (hoverRating || rating)
                      ? "fill-rose-500 text-rose-500"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              </button>
            ))}
          </div>

          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you love? What could be improved?"
            className="w-full rounded-xl border p-4 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-gray-900 py-4 font-semibold text-white transition hover:bg-black disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
