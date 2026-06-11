import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UploadCloud, Loader2, Home, X, Plus, MapPin } from "lucide-react";
import { Skeleton, SkeletonLineGroup } from "../components/ui/skeleton";
import AvailabilityCalendar from "../components/AvailabilityCalendar";
import { toast } from "sonner";
import apiFetch from "../services/apiFetch";

const DEFAULT_AMENITIES = [
  "WiFi",
  "Pool",
  "AC",
  "Kitchen",
  "Free Parking",
  "Hot Tub",
  "Gym",
  "Workspace",
];
const CATEGORIES = [
  "Trending",
  "Heritage",
  "Amazing Pools",
  "Camping",
  "Tropical",
  "Mountains",
  "Bed & Breakfast",
  "Arctic",
];

const EditListing = () => {
  const { id } = useParams<{ id: string }>(); // Grab the ID from the URL
  const navigate = useNavigate();

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Core Data State
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Trending");
  const [locationName, setLocationName] = useState("");

  // Check-in/out & Guest State
  const [checkInTime, setCheckInTime] = useState("3:00 PM");
  const [checkOutTime, setCheckOutTime] = useState("11:00 AM");
  const [maxGuests, setMaxGuests] = useState("4");

  // Amenities State
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState("");

  // Image State
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  // 1. Fetch Existing Listing Data
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await apiFetch.get(`/listings/${id}`); // Assumes you have a GET /listings/:id endpoint
        const data = response.data.listing;

        setTitle(data.title);
        setPrice(data.price.toString());
        setDescription(data.description);
        setCategory(data.category || "Trending");
        setLocationName(data.locationName || "");
        setCheckInTime(data.checkInTime || "3:00 PM");
        setCheckOutTime(data.checkOutTime || "11:00 AM");
        setMaxGuests(data.maxGuests?.toString() || "4");
        setSelectedAmenities(data.amenities || []);
        setExistingImages(data.images || []);
      } catch (error) {
        toast.error("Failed to load listing details.");
        navigate("/host/dashboard");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchListing();
  }, [id, navigate]);

  // Toggle/Add Amenities
  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity],
    );
  };

  const handleAddCustomAmenity = (
    e: React.KeyboardEvent | React.MouseEvent,
  ) => {
    if (("key" in e && e.key === "Enter") || e.type === "click") {
      e.preventDefault();
      if (
        customAmenity.trim() &&
        !selectedAmenities.includes(customAmenity.trim())
      ) {
        setSelectedAmenities((prev) => [...prev, customAmenity.trim()]);
        setCustomAmenity("");
      }
    }
  };

  // Handle New Image Selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Make sure they don't exceed the 5 image limit (existing + new)
    if (existingImages.length + newImages.length + files.length > 5) {
      return toast.error("Maximum 5 images allowed in total.");
    }

    setNewImages((prev) => [...prev, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setNewImagePreviews((prev) => [...prev, ...previews]);
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Updated Data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) return toast.error("Title must be at least 3 characters.");
    if (!description.trim() || description.trim().length < 20) return toast.error("Description must be at least 20 characters.");
    if (!category) return toast.error("Please select a category.");
    if (!price || Number(price) <= 0) return toast.error("Please enter a valid price greater than 0.");
    if (!locationName.trim()) return toast.error("Please provide a location.");
    setIsSubmitting(true);
    const toastId = toast.loading("Updating property...");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("locationName", locationName);
      formData.append("checkInTime", checkInTime);
      formData.append("checkOutTime", checkOutTime);
      formData.append("maxGuests", maxGuests);
      formData.append("amenities", selectedAmenities.join(","));
      // Only re-geocode if you want to update the GPS coordinates, otherwise skip it.
      // We append new images if they added any
      newImages.forEach((file) => formData.append("images", file));

      await apiFetch.put(`/listings/${id}`, formData);

      toast.success("Property updated successfully!", { id: toastId });
      navigate("/host/dashboard");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update listing.",
        { id: toastId },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Skeleton className="mb-8 h-8 w-48" />
        <div className="space-y-8 rounded-2xl border bg-white p-8 shadow-sm">
          <SkeletonLineGroup lines={2} />
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-6">
            <SkeletonLineGroup lines={2} />
            <SkeletonLineGroup lines={2} />
          </div>
          <Skeleton className="h-10 w-full" />
          <SkeletonLineGroup lines={3} />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="mt-4 h-12 w-32 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
          <Home className="h-6 w-6 text-gray-700" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Edit Property
          </h1>
          <p className="text-gray-500">Update the details for your listing.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basics */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-4 mb-6">
            1. The Basics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Property Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3.5 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3.5 outline-none focus:border-gray-900 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Nightly Price (₹)
              </label>
              <input
                type="number"
                required
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3.5 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Location Name
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-3.5 pl-12 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Amenities */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-4 mb-6">
            2. Amenities
          </h2>
          <div className="flex flex-wrap gap-3 mb-6">
            {DEFAULT_AMENITIES.map((amenity) => (
              <button
                type="button"
                key={amenity}
                onClick={() => toggleAmenity(amenity)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${selectedAmenities.includes(amenity) ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-gray-900"}`}
              >
                {amenity}
              </button>
            ))}
            {selectedAmenities
              .filter((a) => !DEFAULT_AMENITIES.includes(a))
              .map((amenity) => (
                <button
                  type="button"
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className="rounded-full border border-gray-900 bg-gray-900 text-white px-4 py-2 text-sm font-medium transition"
                >
                  {amenity} <X className="inline h-3 w-3 ml-1" />
                </button>
              ))}
          </div>
          <div className="flex gap-2 max-w-sm">
            <input
              type="text"
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              onKeyDown={handleAddCustomAmenity}
              placeholder="Add custom amenity..."
              className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/20"
            />
            <button
              type="button"
              onClick={handleAddCustomAmenity}
              className="rounded-xl bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Section 3: Check-in Details */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-4 mb-6">
            3. Check-in Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Check-in Time</label>
              <select value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className="w-full rounded-xl border border-gray-300 p-3.5 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/20 bg-white">
                {["12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Check-out Time</label>
              <select value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} className="w-full rounded-xl border border-gray-300 p-3.5 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/20 bg-white">
                {["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Max Guests</label>
              <input type="number" min="1" max="50" value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} className="w-full rounded-xl border border-gray-300 p-3.5 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/20" />
            </div>
          </div>
        </div>

        {/* Section 4: Description */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-4 mb-6">
            4. Description
          </h2>
          <textarea
            required
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/20"
          />
        </div>

        {/* Section 4: Photos */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-4 mb-6">
            4. Photos
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            You have {existingImages.length} existing images. You can add{" "}
            {5 - existingImages.length - newImages.length} more.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Show Existing Images (Read Only for now) */}
            {existingImages.map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 opacity-70"
              >
                <img
                  src={url}
                  alt={`Existing ${idx}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-0 w-full bg-black/60 text-white text-[10px] text-center py-1">
                  Saved
                </div>
              </div>
            ))}

            {/* Show New Image Previews */}
            {newImagePreviews.map((url, idx) => (
              <div
                key={url}
                className="relative aspect-square rounded-xl overflow-hidden border border-rose-500"
              >
                <img
                  src={url}
                  alt={`New ${idx}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(idx)}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-red-500 transition"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-0 w-full bg-rose-500 text-white text-[10px] text-center py-1">
                  New
                </div>
              </div>
            ))}

            {/* Upload Button */}
            {existingImages.length + newImages.length < 5 && (
              <label className="relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition">
                <UploadCloud className="mb-2 h-8 w-8 text-gray-400" />
                <span className="text-xs font-medium text-gray-500">
                  Add Photo
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Availability Calendar */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          <AvailabilityCalendar listingId={id || ""} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-gray-900 py-4 text-lg font-bold text-white shadow-md transition hover:bg-black disabled:opacity-50"
        >
          {isSubmitting ? "Saving Changes..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default EditListing;
