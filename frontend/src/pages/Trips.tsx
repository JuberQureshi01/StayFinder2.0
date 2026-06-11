import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { MapPin, Calendar, Loader2, Plane, Sparkles, Wand2, MessageCircle } from "lucide-react";
import apiFetch from "../services/apiFetch";
import ItineraryGenModal from "../components/ItineraryGenModal";
import ItineraryViewModal from "../components/ItineraryViewModal";
import CancelBookingModal from "../components/CancelBookingModal";
import { Skeleton, SkeletonCard } from "../components/ui/skeleton";

const Trips = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  const [itinerary, setItinerary] = useState("");
  const [itineraryBookingId, setItineraryBookingId] = useState<string | null>(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const [showGenForm, setShowGenForm] = useState(false);
  const [genBooking, setGenBooking] = useState<any>(null);
  const [genPeople, setGenPeople] = useState(2);
  const [genGroup, setGenGroup] = useState("couple");
  const [genStyle, setGenStyle] = useState("relaxed");
  const [genBudget, setGenBudget] = useState("moderate");
  const [genDays, setGenDays] = useState(1);
  const [genRemaining, setGenRemaining] = useState(3);

  const [cancelBooking, setCancelBooking] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState<any>(null);

  const formatDate = (d: string | Date) =>
    new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" });

  const formatDateFull = (d: string | Date) =>
    new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

  const getNights = (checkIn: string, checkOut: string) =>
    Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Payment successful! Pack your bags!", { duration: 5000 });
    }

    const fetchMyTrips = async () => {
      try {
        const response = await apiFetch.get("/bookings");
        const validTrips = response.data.bookings.filter(
          (b: any) => b.status === "confirmed" || b.status === "completed",
        );

        const tripsWithItinerary = await Promise.all(
          validTrips.map(async (booking: any) => {
            try {
              const res = await apiFetch.get(`/itineraries/${booking._id}`);
              return { ...booking, hasItinerary: true, itineraryData: res.data.itinerary };
            } catch {
              return { ...booking, hasItinerary: false, itineraryData: null };
            }
          }),
        );

        setBookings(tripsWithItinerary);
      } catch {
        toast.error("Failed to load your trips.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyTrips();
  }, [searchParams.toString()]);

  const openGenForm = (booking: any) => {
    const nights = getNights(booking.checkIn, booking.checkOut);
    const remaining = booking.itineraryData
      ? 3 - booking.itineraryData.version
      : 3;
    setGenBooking(booking);
    setGenPeople(booking.itineraryData?.preferences?.people || 2);
    setGenGroup(booking.itineraryData?.preferences?.groupType || "couple");
    setGenStyle(booking.itineraryData?.preferences?.style || "relaxed");
    setGenBudget(booking.itineraryData?.preferences?.budget || "moderate");
    setGenDays(nights || 1);
    setGenRemaining(remaining);
    setShowGenForm(true);
  };

  const handleGenerateItinerary = async () => {
    if (!genBooking) return;
    setGeneratingId(genBooking._id);
    setShowGenForm(false);
    const toastId = toast.loading("AI is creating your travel plan...");

    try {
      const res = await apiFetch.post(`/itineraries/${genBooking._id}/generate`, {
        people: genPeople,
        groupType: genGroup,
        style: genStyle,
        budget: genBudget,
        days: genDays,
      });

      const data = res.data.itinerary;
      setItinerary(data.content);
      setItineraryBookingId(genBooking._id);
      setGenBooking((prev: any) => ({ ...prev, itineraryData: data, hasItinerary: true }));
      setGenRemaining(3 - data.version);
      setShowItineraryModal(true);

      setBookings((prev) =>
        prev.map((b) =>
          b._id === genBooking._id ? { ...b, hasItinerary: true, itineraryData: data } : b,
        ),
      );

      toast.success("AI itinerary ready!", { id: toastId });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to generate itinerary.";
      toast.error(msg, { id: toastId });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleViewItinerary = (booking: any) => {
    if (booking.itineraryData) {
      setItinerary(booking.itineraryData.content);
      setItineraryBookingId(booking._id);
      setGenBooking(booking);
      setGenRemaining(3 - booking.itineraryData.version);
      setShowItineraryModal(true);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelBooking) return;
    setCancelling(true);
    try {
      const res = await apiFetch.patch(`/bookings/${cancelBooking._id}/cancel`, {
        reason: "User requested cancellation",
      });
      setCancelResult(res.data);
      setBookings((prev) =>
        prev.filter((b) => b._id !== cancelBooking._id),
      );
      toast.success(res.data.message, { duration: 6000 });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Cancellation failed. Try again.");
    } finally {
      setCancelling(false);
    }
  };

  const closeCancelModal = () => {
    setCancelBooking(null);
    setCancelResult(null);
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <Skeleton className="mb-2 h-10 w-40" />
        <Skeleton className="mb-10 h-5 w-56" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ItineraryGenModal
        open={showGenForm && !!genBooking}
        onClose={() => setShowGenForm(false)}
        isGenerating={generatingId === genBooking?._id}
        people={genPeople}
        groupType={genGroup}
        style={genStyle}
        budget={genBudget}
        days={genDays}
        onPeopleChange={(v) => setGenPeople(v)}
        onGroupChange={(v) => setGenGroup(v)}
        onStyleChange={(v) => setGenStyle(v)}
        onBudgetChange={(v) => setGenBudget(v)}
        onDaysChange={(v) => setGenDays(v)}
        onSubmit={handleGenerateItinerary}
        badgeText={genBooking?.itineraryData ? `Regenerations left: ${genRemaining}/3` : "Free for booked guests · 3 generations"}
        submitLabel={genBooking?.itineraryData ? "Regenerate Itinerary" : "Generate AI Itinerary"}
      />

      <ItineraryViewModal
        open={showItineraryModal}
        onClose={() => setShowItineraryModal(false)}
        content={itinerary}
        preferences={genBooking?.itineraryData?.preferences}
        totalDays={genBooking?.itineraryData?.totalDays}
        headerBadge={genBooking ? `${genRemaining}/3 remaining` : undefined}
        footerAction={genBooking && genRemaining > 0 ? {
          label: `Regenerate (${genRemaining}/3 left)`,
          onClick: () => { setShowItineraryModal(false); openGenForm(genBooking); },
        } : undefined}
      />

      <CancelBookingModal
        booking={cancelBooking}
        cancelResult={cancelResult}
        cancelling={cancelling}
        onConfirm={handleCancelBooking}
        onClose={closeCancelModal}
      />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            My Trips
          </h1>
          <p className="mt-2 text-gray-500">
            {bookings.length > 0
              ? `${bookings.length} trip${bookings.length > 1 ? "s" : ""} across your adventures`
              : "Your travel memories start here"}
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-pink-100 shadow-inner">
              <Plane className="h-14 w-14 text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              No trips booked... yet!
            </h2>
            <p className="mt-2 max-w-sm text-center text-gray-500">
              Time to dust off your bags and start planning your next adventure.
            </p>
            <Link
              to="/"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/20 transition hover:bg-black hover:shadow-xl hover:shadow-gray-900/30"
            >
              Explore stays
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {bookings.map((booking) => {
              const nights = getNights(booking.checkIn, booking.checkOut);
              const isUpcoming = booking.status === "confirmed";
              return (
                <div
                  key={booking._id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
                    <img
                      src={booking.listing?.images?.[0] || "https://placehold.co/600x400"}
                      alt=""
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                    {/* Status badge */}
                    <div className="absolute right-3 top-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-lg backdrop-blur-sm ${
                          isUpcoming
                            ? "bg-emerald-500/90 text-white"
                            : "bg-blue-500/90 text-white"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isUpcoming ? "bg-white" : "bg-white/70"
                          }`}
                        />
                        {isUpcoming ? "Upcoming" : "Completed"}
                      </span>
                    </div>

                    {/* Date overlay on image */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-1.5 text-white backdrop-blur-md">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">
                          {formatDate(booking.checkIn)} — {formatDateFull(booking.checkOut)}
                        </span>
                        <span className="ml-1 text-xs text-white/70">
                          · {nights} {nights === 1 ? "night" : "nights"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-bold text-gray-900">
                          {booking.listing?.title || "Property Unavailable"}
                        </h3>
                        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {booking.listing?.locationName || "Location not set"}
                          </span>
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-gray-400">Total paid</p>
                        <p className="text-lg font-bold text-gray-900">
                          ₹{(booking.totalPrice || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto border-t border-gray-100 pt-4">
                      <div className="flex gap-2">
                        <Link
                          to={`/chat/${booking._id}`}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:border-gray-300"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Message</span>
                        </Link>

                        {isUpcoming && (
                          <button
                            onClick={() => setCancelBooking(booking)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 hover:border-red-300"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Cancel</span>
                          </button>
                        )}

                        {booking.hasItinerary ? (
                          <button
                            onClick={() => handleViewItinerary(booking)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 hover:border-indigo-300"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">View</span> Itinerary
                          </button>
                        ) : (
                          <button
                            onClick={() => openGenForm(booking)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
                          >
                            <Wand2 className="h-3.5 w-3.5" />
                            AI Itinerary
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Trips;
