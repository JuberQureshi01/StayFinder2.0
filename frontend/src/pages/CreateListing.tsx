import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  UploadCloud,
  Loader2,
  Home,
  X,
  Plus,
  MapPin,
} from "lucide-react";
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

const CreateListing = () => {
  const navigate = useNavigate();

  // Core Data State
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Trending");
  const [locationName, setLocationName] = useState("");

  // Amenities State
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState("");

  // Check-in/out & Guest State
  const [checkInTime, setCheckInTime] = useState("3:00 PM");
  const [checkOutTime, setCheckOutTime] = useState("11:00 AM");
  const [maxGuests, setMaxGuests] = useState("4");

  // AI Hint State
  const [aiHint, setAiHint] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // File Upload State
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Image Handling
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      return toast.error("Maximum 10 images allowed.");
    }

    setImages((prev) => [...prev, ...files]);

    // Create preview URLs
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Trigger Gemini AI Auto-Writer
  const handleGenerateAI = async () => {
    if (!title || selectedAmenities.length === 0 || !locationName) {
      toast.error(
        "Please provide a title, location, and select amenities first.",
      );
      return;
    }

    setIsGeneratingAI(true);
    const toastId = toast.loading("Gemini AI is writing your description...");

    try {
      const response = await apiFetch.post("/listings/ai-description", {
        title,
        location: locationName,
        amenities: selectedAmenities,
        hints: aiHint, // Send the user's hints to your backend AI prompt
      });

      setDescription(response.data.description);
      toast.success("AI Description generated!", { id: toastId });
    } catch (error) {
      toast.error("Failed to generate AI description.", { id: toastId });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || title.trim().length < 3) return toast.error("Title must be at least 3 characters.");
    if (!description.trim() || description.trim().length < 20) return toast.error("Description must be at least 20 characters.");
    if (!category) return toast.error("Please select a category.");
    if (!price || Number(price) <= 0) return toast.error("Please enter a valid price greater than 0.");
    if (images.length === 0) return toast.error("Upload at least one image.");
    if (!locationName.trim()) return toast.error("Please provide a location.");

    setIsSubmitting(true);
    const toastId = toast.loading("Verifying location and publishing...");

    try {
      // 1. GEOCODE THE LOCATION
      let coordinates = [75.8189, 26.9124]; // Fallback to Jaipur
      const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

      if (mapboxToken) {
        const geoRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${mapboxToken}`,
        );
        const geoData = await geoRes.json();
        if (geoData.features && geoData.features.length > 0) {
          coordinates = geoData.features[0].center; // [lng, lat]
        } else {
          toast.error(
            "Could not find that exact location on the map, using approximation.",
            { id: toastId },
          );
        }
      }

      // 2. BUILD FORMDATA
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("locationName", locationName);
      formData.append("location", JSON.stringify(coordinates));
      formData.append("checkInTime", checkInTime);
      formData.append("checkOutTime", checkOutTime);
      formData.append("maxGuests", maxGuests);
      formData.append("amenities", selectedAmenities.join(","));

      images.forEach((file) => formData.append("images", file));

      // 3. SEND TO BACKEND
      toast.loading("Uploading high-res images...", { id: toastId });
      await apiFetch.post("/listings/create", formData);

      toast.success("Property published successfully!", { id: toastId });
      navigate("/host/dashboard");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to publish listing.",
        { id: toastId },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-rose-100 flex items-center justify-center">
          <Home className="h-6 w-6 text-rose-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Host a new property
          </h1>
          <p className="text-gray-500">
            Fill out the details below to list your home on StayFinder.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Details */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-4">
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
                placeholder="e.g. Luxury Heritage Villa with Pool"
                className="w-full rounded-xl border border-gray-300 p-3.5 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Property Category
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
                placeholder="5000"
                className="w-full rounded-xl border border-gray-300 p-3.5 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                City / Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Jaipur, Rajasthan"
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
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  selectedAmenities.includes(amenity)
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-900"
                }`}
              >
                {amenity}
              </button>
            ))}

            {/* Render dynamically added custom amenities */}
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

        {/* Section 4: Description & AI */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">4. Description</h2>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-6 mb-6">
            <label className="text-sm font-semibold text-indigo-900 mb-2 block">
              AI Assistant Hints (Optional)
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                value={aiHint}
                onChange={(e) => setAiHint(e.target.value)}
                placeholder="e.g. It has a vintage vibe, close to the beach..."
                className="flex-1 rounded-xl border border-indigo-200 p-3 outline-none focus:border-indigo-500 text-sm"
              />
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isGeneratingAI}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
              >
                {isGeneratingAI ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
                Write for me
              </button>
            </div>
          </div>

          <textarea
            required
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your place..."
            className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/20"
          />
        </div>

        {/* Section 5: Photos */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-4 mb-6">
            5. Photos (Max 10)
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {imagePreviews.map((url, idx) => (
              <div
                key={url}
                className="relative aspect-square rounded-xl overflow-hidden border"
              >
                <img
                  src={url}
                  alt={`Preview ${idx}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-red-500 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {imagePreviews.length < 11 && (
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-gray-900 py-4 text-lg font-bold text-white shadow-md transition hover:bg-black disabled:opacity-50"
        >
          {isSubmitting ? "Publishing Property..." : "Publish Listing"}
        </button>
      </form>
    </div>
  );
};

export default CreateListing;
