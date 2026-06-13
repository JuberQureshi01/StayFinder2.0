import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/services/apiFetch";
import { PATHS } from "@/services/paths";
import { toast } from "sonner";

const amenitiesOptions = ["Wifi", "Pool", "Kitchen", "AC", "Parking"];

const CreateListingForm = () => {
  const [title, setTitle] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [price, setPrice] = useState<number | "">("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [description, setDescription] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // NEW: Image states
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Toggle amenities
  const handleAmenityToggle = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((item) => item !== amenity)
        : [...prev, amenity],
    );
  };

  // NEW: Handle Image Selection & Previews
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);

      // Limit to 5 images max
      if (images.length + selectedFiles.length > 5) {
        toast.error("You can only upload up to 5 images.");
        return;
      }

      setImages((prev) => [...prev, ...selectedFiles]);

      // Generate local blob URLs for previewing the images
      const newPreviews = selectedFiles.map((file) =>
        URL.createObjectURL(file),
      );
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  // NEW: Remove selected image
  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  // AI Description Generator
  const handleAIDescriptionGeneration = async () => {
    try {
      if (!title || !location || amenities.length === 0) {
        toast.warning("Please fill title, location, and amenities first.");
        return;
      }
      setAiLoading(true);
      const res = await apiPost(PATHS.LISTING.AI_DESCRIPTION, {
        title,
        location,
        amenities,
      });
      setDescription(res?.description || "");
      toast.success("AI description generated successfully.");
    } catch (error: any) {
      toast.error(error || "Failed to generate AI description.");
    } finally {
      setAiLoading(false);
    }
  };

  // Submit listing using FormData
  const handleSubmit = async () => {
    try {
      if (
        !title ||
        !location ||
        !price ||
        !description ||
        images.length === 0
      ) {
        toast.warning("Please fill all fields and upload at least one image.");
        return;
      }

      setLoading(true);

      // We MUST use FormData when sending Files
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price.toString());

      // Send location as a stringified GeoJSON array (Assuming Mock Geocoding for now)
      // In a real app, you'd use the Mapbox Geocoding API here to turn "Jaipur" into [75.7873, 26.9124]
      formData.append("location", JSON.stringify([75.7873, 26.9124])); // Mocking Jaipur coords

      // Append array items properly
      amenities.forEach((amenity) => formData.append("amenities[]", amenity));

      // Append actual file objects
      images.forEach((image) => formData.append("images", image));

      // The interceptor strips Content-Type for FormData so the browser sets the correct boundary
      await apiPost(PATHS.LISTING.CREATE, formData);

      toast.success("Listing created successfully.");

      // Reset form
      setTitle("");
      setLocation("");
      setPrice("");
      setAmenities([]);
      setDescription("");
      setImages([]);
      setImagePreviews([]);
    } catch (error: any) {
      toast.error(error || "Failed to create listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl rounded-3xl border bg-white p-6 shadow-sm">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold">Create Property Listing</h1>
        <p className="text-gray-500">Add your property details and photos.</p>
      </div>

      <div className="space-y-6">
        {/* ... (Keep Title, Location, Price, Amenities, and Description exact same as before) ... */}

        {/* NEW: Image Upload Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Property Images (Max 5)</label>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            disabled={loading}
          />

          {/* Image Previews Grid */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-5 gap-4 mt-4">
              {imagePreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative h-24 w-full rounded-xl border overflow-hidden"
                >
                  <img
                    src={preview}
                    alt="Preview"
                    className="object-cover h-full w-full"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-black text-white rounded-full p-1 h-6 w-6 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-xl py-6 text-base"
        >
          {loading
            ? "Creating Listing & Uploading Images..."
            : "Create Listing"}
        </Button>
      </div>
    </div>
  );
};

export default CreateListingForm;
