import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Star, MapPin, Share, Heart, Home, Loader2, Sparkles, Wifi, Car, Coffee, Tv, Snowflake, Wind, Dumbbell, Waves, Utensils, Laptop, Shirt, Bath, TreePine, Shield, Bell } from "lucide-react";

import apiFetch from "../services/apiFetch";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../app/store";
import { setCredentials } from "../features/auth/authSlice";
import MapContainer from "../components/MapContainer";
import ReviewSummary from "../components/ReviewSummary";
import ListingCard from "../components/ListingCard";
import BookingDatePicker from "../components/BookingDatePicker";
import ItineraryGenModal from "../components/ItineraryGenModal";
import ItineraryViewModal from "../components/ItineraryViewModal";
import { Skeleton, SkeletonLineGroup } from "../components/ui/skeleton";

const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  parking: Car,
  kitchen: Utensils,
  "air conditioning": Snowflake,
  heating: Wind,
  tv: Tv,
  washer: Shirt,
  dryer: Shirt,
  gym: Dumbbell,
  pool: Waves,
  "hot tub": Waves,
  "breakfast": Coffee,
  "workspace": Laptop,
  "pet friendly": Home,
  "smoke alarm": Bell,
  "carbon monoxide": Shield,
  "first aid": Shield,
  "fire extinguisher": Shield,
  backyard: TreePine,
  garden: TreePine,
  beach: Waves,
  balcony: Home,
  patio: Home,
  elevator: Home,
  "wheelchair": Home,
  ev: Car,
  charger: Car,
};

const getAmenityIcon = (amenity: string) => {
  const key = amenity.toLowerCase().trim();
  for (const [pattern, Icon] of Object.entries(amenityIcons)) {
    if (key.includes(pattern)) return Icon;
  }
  return Home;
};

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user, token } = useSelector(
    (state: RootState) => state.auth,
  );

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [totalDays, setTotalDays] = useState(0);

  const [reviews, setReviews] = useState<any[]>([]);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReview, setEditingReview] = useState<string | null>(null);

  const [itinerary, setItinerary] = useState("");
  const [itineraryData, setItineraryData] = useState<any>(null);
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [showGenForm, setShowGenForm] = useState(false);

  const [similarStays, setSimilarStays] = useState<any[]>([]);
  const [collaborativeStays, setCollaborativeStays] = useState<any[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState("");

  const [itineraryDays, setItineraryDays] = useState(3);
  const [people, setPeople] = useState(2);
  const [groupType, setGroupType] = useState("couple");
  const [style, setStyle] = useState("adventurous");
  const [budget, setBudget] = useState("moderate");

  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const listingRes = await apiFetch.get(`/listings/${id}`);
        setListing(listingRes.data.listing);

        try {
          const reviewsRes = await apiFetch.get(`/reviews/listing/${id}`);
          setReviews(reviewsRes.data.reviews || []);
        } catch {}

        try {
          const recRes = await apiFetch.get(`/recommendations/listing/${id}`);
          setSimilarStays(recRes.data.similar || []);
          setCollaborativeStays(recRes.data.collaborative || []);
          setAiSuggestion(recRes.data.aiSuggestion || "");
        } catch {}
      } catch {
        toast.error("Property not found.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, navigate]);

  useEffect(() => {
    if (checkIn && checkOut) {
      const start = new Date(checkIn).getTime();
      const end = new Date(checkOut).getTime();
      const difference = (end - start) / (1000 * 60 * 60 * 24);
      setTotalDays(difference > 0 ? difference : 0);
    }
  }, [checkIn, checkOut]);

  useEffect(() => {
    if (!isAuthenticated || !listing) return;
    const loadSavedItinerary = async () => {
      try {
        const res = await apiFetch.get(`/itineraries/listing/${listing._id}`);
        setItinerary(res.data.itinerary.content);
        setItineraryData(res.data.itinerary);
        setLimitReached(true);
      } catch {}
    };
    loadSavedItinerary();
  }, [isAuthenticated, listing]);

  const isWishlisted = user?.wishlist?.includes(listing?._id);

  const handleWishlistClick = async () => {
    if (!isAuthenticated) return toast.error("Please log in to save this property.");
    if (isTogglingWishlist) return;
    setIsTogglingWishlist(true);
    try {
      const response = await apiFetch.post(`/users/wishlist/${listing._id}`);
      dispatch(setCredentials({ user: response.data.user, token }));
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update wishlist");
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  const handleGenerateItinerary = async () => {
    if (!isAuthenticated) return toast.error("Please log in to generate an itinerary.");
    if (limitReached && itineraryData) {
      setShowItineraryModal(true);
      return;
    }
    setShowGenForm(true);
  };

  const handleGenSubmit = async () => {
    setIsGeneratingItinerary(true);
    setShowGenForm(false);
    const toastId = toast.loading("AI is creating your perfect trip...");
    try {
      const response = await apiFetch.post(`/itineraries/listing/${listing._id}/generate`, {
        people,
        groupType,
        style,
        budget,
        days: itineraryDays,
      });
      const data = response.data;
      setItinerary(data.itinerary.content);
      setItineraryData(data.itinerary);
      if (data.limitReached) setLimitReached(true);
      setShowItineraryModal(true);
      toast.success("AI itinerary ready!", { id: toastId });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to generate itinerary.";
      toast.error(msg, { id: toastId });
    } finally {
      setIsGeneratingItinerary(false);
    }
  };

  const handleReplyToReview = async (reviewId: string) => {
    const text = replyTexts[reviewId];
    if (!text?.trim()) return toast.error("Please write a reply");
    setSubmittingReply(reviewId);
    try {
      await apiFetch.post(`/reviews/${reviewId}/reply`, { text });
      toast.success("Reply posted");
      setReplyTexts((prev) => ({ ...prev, [reviewId]: "" }));
      const res = await apiFetch.get(`/reviews/listing/${id}`);
      setReviews(res.data.reviews || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to post reply");
    } finally {
      setSubmittingReply(null);
    }
  };

  const myReview = reviews.find((r) => r.user?._id === user?._id);

  const handleSubmitReview = async () => {
    if (!isAuthenticated) return toast.error("Please log in.");
    if (reviewComment.trim().length < 10) return toast.error("Please write at least 10 characters.");
    setSubmittingReview(true);
    const toastId = toast.loading("Submitting review...");
    try {
      if (editingReview) {
        await apiFetch.put(`/reviews/${editingReview}`, { rating: reviewRating, comment: reviewComment });
        toast.success("Review updated!", { id: toastId });
      } else {
        await apiFetch.post(`/reviews/${id}`, { rating: reviewRating, comment: reviewComment });
        toast.success("Review posted!", { id: toastId });
      }
      setReviewRating(5);
      setReviewComment("");
      setEditingReview(null);
      const res = await apiFetch.get(`/reviews/listing/${id}`);
      setReviews(res.data.reviews || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit review.", { id: toastId });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = (review: any) => {
    setReviewRating(review.rating);
    setReviewComment(review.comment);
    setEditingReview(review._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setReviewRating(5);
    setReviewComment("");
    setEditingReview(null);
  };

  const handleReserve = async () => {
    if (!isAuthenticated) return toast.error("Please log in to reserve this property.");
    if (totalDays <= 0) return toast.error("Check-out date must be after check-in date.");

    const toastId = toast.loading("Initializing secure checkout...");
    try {
      const bookingResponse = await apiFetch.post("/bookings/create", {
        listingId: id,
        checkIn,
        checkOut,
      });
      const targetBookingId = bookingResponse.data.booking._id;
      const paymentResponse = await apiFetch.post("/payments/process", { bookingId: targetBookingId });
      const { orderId, amount, currency, keyId } = paymentResponse.data;

      let isPaymentSuccess = false;
      const options = {
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: "StayFinder",
        description: `Reservation for ${listing.title}`,
        image: listing.images?.[0],
        prefill: { name: user?.profile?.name || user?.name || "Customer", email: user?.email || "customer@example.com" },
        theme: { color: "#171717" },
        handler: async function (response: any) {
          try {
            isPaymentSuccess = true;
            await apiFetch.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: targetBookingId,
            });
            toast.dismiss(toastId);
            toast.success("Payment authorized! Your trip is confirmed.");
            navigate("/trips?success=true");
          } catch {
            toast.error("Payment verification failed.");
          }
        },
        modal: {
          ondismiss: async function () {
            if (isPaymentSuccess) return;
            toast.dismiss(toastId);
            toast.warning("Reservation released.");
            await apiFetch.post("/payments/cancel", { bookingId: targetBookingId });
          },
        },
      };

      if (typeof (window as any).Razorpay === "undefined") {
        toast.error("Payment gateway failed to load. Please refresh.");
        return;
      }
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", async function (response: any) {
        toast.error(`Payment failed: ${response.error.description}`);
        await apiFetch.post("/payments/cancel", { bookingId: targetBookingId });
      });
      rzp.open();
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.response?.data?.message || "Checkout failed to initialize.");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <Skeleton className="aspect-[2/1] w-full rounded-2xl" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <SkeletonLineGroup lines={5} />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <>
      <ItineraryGenModal
        open={showGenForm}
        onClose={() => setShowGenForm(false)}
        isGenerating={isGeneratingItinerary}
        people={people}
        groupType={groupType}
        style={style}
        budget={budget}
        days={itineraryDays}
        onPeopleChange={(v) => setPeople(v)}
        onGroupChange={(v) => setGroupType(v)}
        onStyleChange={(v) => setStyle(v)}
        onBudgetChange={(v) => setBudget(v)}
        onDaysChange={(v) => setItineraryDays(v)}
        onSubmit={handleGenSubmit}
        badgeText={!limitReached ? "Free — 1 per property" : undefined}
      />

      <ItineraryViewModal
        open={showItineraryModal}
        onClose={() => setShowItineraryModal(false)}
        content={itinerary}
        preferences={itineraryData?.preferences || { people, groupType, style, budget }}
        totalDays={itineraryData?.totalDays || itineraryDays}
      />

      <div className="mx-auto  max-w-7xl px-4 pb-24 pt-8 duration-500 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">{listing.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Star className="h-4 w-4 fill-gray-900 text-gray-900" />
                  {listing.rating > 0 ? `${listing.rating.toFixed(1)} (${reviews.length} reviews)` : "New"}
                </span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {listing.locationName || "Location not specified"}
                </span>
                <span className="text-gray-300">·</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
                  {listing.category || "Trending"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100">
                <Share className="h-4 w-4" /> Share
              </button>
              <button
                onClick={handleWishlistClick}
                disabled={isTogglingWishlist}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
                {isWishlisted ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid h-[50vh] min-h-[400px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl md:h-[60vh]">
          <div className="relative col-span-4 row-span-2 cursor-pointer md:col-span-2">
            <img src={listing.images?.[0]} alt="Main" className="h-full w-full object-cover transition duration-300 hover:brightness-90" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative hidden cursor-pointer md:block">
              <img src={listing.images?.[i] || listing.images?.[0]} alt={`Image ${i}`} className="h-full w-full object-cover transition duration-300 hover:brightness-90" />
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-10">
            <div className="flex items-center justify-between border-b pb-6">
              <div>
                <h2 className="text-xl font-semibold">Hosted by {listing.host?.profile?.name || "Professional Host"}</h2>
                <p className="mt-1 text-sm text-gray-500">Verified host · Member since {new Date(listing.host?.createdAt || Date.now()).getFullYear()}</p>
              </div>
              <div className="h-14 w-14 overflow-hidden rounded-full bg-gray-200">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${listing.host?._id}`} alt="Host" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Check-in", value: listing.checkInTime || "3:00 PM" },
                { label: "Check-out", value: listing.checkOutTime || "11:00 AM" },
                { label: "Max guests", value: listing.maxGuests ? `${listing.maxGuests} guests` : "4 guests" },
              ].map((item, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{item.label}</p>
                  <p className="mt-1 font-semibold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="border-b pb-6">
              <h3 className="mb-4 text-lg font-semibold">About this space</h3>
              <p className="leading-relaxed text-gray-600 whitespace-pre-wrap">{listing.description}</p>
            </div>

            <div className="border-b pb-6">
              <h3 className="mb-4 text-lg font-semibold">What this place offers</h3>
              <div className="grid grid-cols-2 gap-3">
                {(listing.amenities || []).map((amenity: string, idx: number) => {
                  const Icon = getAmenityIcon(amenity);
                  return (
                    <div key={idx} className="flex items-center gap-3 rounded-lg px-1 py-2 text-gray-700">
                      <Icon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <span className="text-sm">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-b pb-6">
              <h3 className="mb-4 text-lg font-semibold">Where you'll be</h3>
              <p className="mb-4 text-sm text-gray-500">{listing.locationName}</p>
              <div className="h-[350px] w-full overflow-hidden rounded-2xl border border-gray-200">
                <MapContainer listings={[listing]} />
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-bold text-indigo-900">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  AI Trip Planner
                </h3>
                {limitReached && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700">Free plan</span>
                )}
              </div>
              <p className="mb-5 text-sm text-indigo-700/60">
                {limitReached
                  ? "You've used your free generation. View your saved itinerary below."
                  : "Get a personalized AI itinerary — 1 free per property."}
              </p>

              <button
                onClick={handleGenerateItinerary}
                disabled={isGeneratingItinerary}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] disabled:opacity-50"
              >
                {isGeneratingItinerary ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                ) : limitReached ? (
                  <><Sparkles className="h-4 w-4" /> View Saved Itinerary</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate AI Itinerary</>
                )}
              </button>
            </div>

            <div>
              <ReviewSummary listingId={id || ""} />
            </div>

            <div className="border-t pt-6">
              {/* User's own review form / display */}
              {isAuthenticated && (
                <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  {editingReview || (!myReview && !editingReview) ? (
                    <>
                      <h3 className="mb-1 text-lg font-semibold text-gray-900">
                        {editingReview ? "Edit Your Review" : "Write a Review"}
                      </h3>
                      <p className="mb-4 text-sm text-gray-500">
                        {editingReview ? "Update your review below." : "Share your experience to help other travelers."}
                      </p>
                      <div className="mb-4 flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => setReviewRating(star)} className="transition-transform hover:scale-110">
                            <Star className={`h-8 w-8 ${star <= reviewRating ? "fill-gray-900 text-gray-900" : "fill-gray-200 text-gray-200"}`} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="What did you love? What could be improved?"
                        className="w-full rounded-xl border border-gray-200 p-4 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                      />
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={handleSubmitReview}
                          disabled={submittingReview}
                          className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
                        >
                          {submittingReview ? "Submitting..." : editingReview ? "Update Review" : "Submit Review"}
                        </button>
                        {editingReview && (
                          <button onClick={handleCancelEdit} className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
                            Cancel
                          </button>
                        )}
                      </div>
                    </>
                  ) : myReview ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                          <Star className="h-5 w-5 fill-gray-900 text-gray-900" />
                          Your Review
                        </h3>
                        <button onClick={() => handleEditReview(myReview)} className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50">
                          Edit
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-sm ${i < myReview.rating ? "text-gray-900" : "text-gray-200"}`}>★</span>
                        ))}
                        <span className="ml-2 text-xs text-gray-400">
                          {new Date(myReview.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-600">{myReview.comment}</p>
                      {myReview.reply?.text && (
                        <div className="mt-3 rounded-xl bg-gray-50 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Host reply</p>
                          <p className="mt-1 text-sm text-gray-700">{myReview.reply.text}</p>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              )}

              <h3 className="mb-6 text-lg font-semibold">All Reviews ({reviews.length})</h3>
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500">No reviews yet for this property.</p>
              ) : (
                <div className="space-y-8">
                  {reviews
                    .filter((r) => r._id !== myReview?._id)
                    .map((review) => (
                    <div key={review._id} className="border-b pb-8 last:border-0 last:pb-0">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                          {review.user?.profile?.name?.charAt(0) || "G"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{review.user?.profile?.name || "Guest"}</p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={`text-xs ${i < review.rating ? "text-gray-900" : "text-gray-200"}`}>★</span>
                            ))}
                          </div>
                        </div>
                        <span className="ml-auto text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-600">{review.comment}</p>
                      {review.reply?.text && (
                        <div className="ml-5 mt-4 rounded-xl bg-gray-50 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Host reply</p>
                          <p className="mt-1 text-sm text-gray-700">{review.reply.text}</p>
                        </div>
                      )}
                      {user?._id === listing.host?._id && !review.reply?.text && (
                        <div className="mt-4 flex gap-2">
                          <input
                            type="text"
                            value={replyTexts[review._id] || ""}
                            onChange={(e) => setReplyTexts((prev) => ({ ...prev, [review._id]: e.target.value }))}
                            placeholder="Write a reply..."
                            className="flex-1 rounded-xl border px-4 py-2 text-sm outline-none focus:border-gray-900"
                          />
                          <button
                            onClick={() => handleReplyToReview(review._id)}
                            disabled={submittingReply === review._id}
                            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
                          >
                            {submittingReply === review._id ? "Sending..." : "Reply"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:block">
            <div className="sticky top-28 space-y-4">
              <BookingDatePicker
                listingId={id || ""}
                checkIn={checkIn}
                checkOut={checkOut}
                onCheckInChange={setCheckIn}
                onCheckOutChange={setCheckOut}
              />

              <div className="hidden lg:block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-baseline gap-1">
                  <span className="text-2xl font-bold">₹{(listing.price || 0).toLocaleString("en-IN")}</span>
                  <span className="text-sm text-gray-500">/ night</span>
                </div>

                <button
                  onClick={handleReserve}
                  disabled={!checkIn || !checkOut}
                  className="w-full rounded-xl bg-gray-900 py-3.5 text-base font-semibold text-white transition hover:bg-black active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!checkIn ? "Select dates to reserve" : "Reserve"}
                </button>

                <p className="mt-2 text-center text-xs text-gray-500">You won't be charged yet</p>

                {totalDays > 0 && (
                  <div className="mt-6 space-y-3 border-t pt-4 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span className="underline">₹{(listing.price || 0).toLocaleString("en-IN")} × {totalDays} {totalDays === 1 ? "night" : "nights"}</span>
                      <span>₹{(listing.price * totalDays).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-t pt-3 text-base font-semibold text-gray-900">
                      <span>Total (all inclusive)</span>
                      <span>₹{(listing.price * totalDays).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {similarStays.length > 0 && (
          <section className="mt-16 border-t pt-12">
            <h2 className="mb-1 text-2xl font-bold text-gray-900">Similar Stays</h2>
            {aiSuggestion && <p className="mb-6 text-sm text-gray-500 italic">{aiSuggestion}</p>}
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {similarStays.map((s: any) => (
                <ListingCard key={s._id} listing={s} />
              ))}
            </div>
          </section>
        )}

        {collaborativeStays.length > 0 && (
          <section className="mt-12 border-t pt-12 pb-16">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">People Also Booked</h2>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {collaborativeStays.map((s: any) => (
                <ListingCard key={s._id} listing={s} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-4 py-3 shadow-lg lg:hidden pb-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-gray-900">₹{(listing.price || 0).toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-500">
              {totalDays > 0
                ? `${totalDays} night${totalDays > 1 ? "s" : ""} · ₹${(
                    listing.price * totalDays
                  ).toLocaleString("en-IN")} total`
                : "/ night"}
            </p>
          </div>
          <button
            onClick={handleReserve}
            disabled={!checkIn || !checkOut}
            className="rounded-xl bg-gray-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-black active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!checkIn ? "Reserve" : "Book now"}
          </button>
        </div>
      </div>
    </>
  );
};

export default ListingDetails;
