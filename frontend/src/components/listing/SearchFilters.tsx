import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  DollarSign,
  Wifi,
  Waves,
  Wind,
  CookingPot,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface SearchFiltersProps {
  onSearch: (filters: any) => void;
}

interface Filters {
  searchQuery: string;
  location: string;
  minPrice: number | "";
  maxPrice: number | "";
  amenities: string[];
}

const amenitiesList = [
  { id: "WiFi", label: "Wifi", icon: Wifi },
  { id: "Pool", label: "Pool", icon: Waves },
  { id: "AC", label: "AC", icon: Wind },
  { id: "Kitchen", label: "Kitchen", icon: CookingPot },
];

const SearchFilters = ({ onSearch }: SearchFiltersProps) => {
  const [filters, setFilters] = useState<Filters>({
    searchQuery: "",
    location: "",
    minPrice: "",
    maxPrice: "",
    amenities: [],
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const updateFilter = (key: keyof Filters, value: any) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      setHasActiveFilters(
        newFilters.searchQuery !== "" ||
          newFilters.location !== "" ||
          newFilters.minPrice !== "" ||
          newFilters.maxPrice !== "" ||
          newFilters.amenities.length > 0,
      );
      return newFilters;
    });
  };

  const handleAmenityToggle = (amenityId: string) => {
    updateFilter(
      "amenities",
      filters.amenities.includes(amenityId)
        ? filters.amenities.filter((item) => item !== amenityId)
        : [...filters.amenities, amenityId],
    );
  };

  const handleApplyFilters = async () => {
    let lng, lat;

    if (filters.location) {
      setIsGeocoding(true);
      try {
        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(filters.location)}.json?access_token=${token}`,
        );
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          [lng, lat] = data.features[0].center;
        } else {
          toast.error("Location not found. Try a different city.");
          setIsGeocoding(false);
          return;
        }
      } catch {
        toast.error("Failed to fetch location coordinates.");
        setIsGeocoding(false);
        return;
      }
      setIsGeocoding(false);
    }

    const searchFilters = {
      search: filters.searchQuery || undefined,
      lng,
      lat,
      radius: lng && lat ? 50000 : undefined,
      minPrice: filters.minPrice !== "" ? Number(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice !== "" ? Number(filters.maxPrice) : undefined,
      amenities:
        filters.amenities.length > 0 ? filters.amenities.join(",") : undefined,
    };

    onSearch(searchFilters);
    setIsExpanded(false);
  };

  const handleClearFilters = () => {
    setFilters({
      searchQuery: "",
      location: "",
      minPrice: "",
      maxPrice: "",
      amenities: [],
    });
    setHasActiveFilters(false);
    onSearch({});
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl sm:rounded-full border border-gray-300 bg-white p-2 sm:p-2 sm:pl-4 shadow-sm transition-all focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20 hover:shadow-md">
        <div className="flex items-center gap-2 flex-1 px-2 sm:px-0">
          <Search className="h-5 w-5 flex-shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Hotel or keyword..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter("searchQuery", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
            className="flex-1 bg-transparent py-2 sm:py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none min-w-0"
          />
        </div>

        <div className="hidden sm:block h-8 w-px bg-gray-300" />

        <div className="flex items-center gap-2 px-2 sm:px-0">
          <MapPin className="h-5 w-5 flex-shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Where? (e.g. Jaipur)"
            value={filters.location}
            onChange={(e) => updateFilter("location", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
            className="flex-1 sm:w-36 bg-transparent py-2 sm:py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none min-w-0"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 px-2 sm:px-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`rounded-full p-2 transition-colors ${
              isExpanded || hasActiveFilters
                ? "bg-rose-100 text-rose-600"
                : "hover:bg-gray-100 text-gray-500"
            }`}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
          <button
            onClick={handleApplyFilters}
            disabled={isGeocoding}
            className="rounded-full bg-gray-900 px-5 sm:px-6 py-2 sm:py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:opacity-50"
          >
            {isGeocoding ? "Locating..." : "Search"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-0 right-0 top-[110%] z-50 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-2xl"
          >
            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <label className="flex items-center gap-2 font-semibold text-gray-900">
                  <DollarSign className="h-4 w-4 text-rose-500" /> Price Range
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => updateFilter("minPrice", e.target.value)}
                      className="w-full rounded-xl border border-gray-300 py-2.5 pl-8 pr-4 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                  <span className="text-gray-400">—</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => updateFilter("maxPrice", e.target.value)}
                      className="w-full rounded-xl border border-gray-300 py-2.5 pl-8 pr-4 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 font-semibold text-gray-900">
                  <CookingPot className="h-4 w-4 text-rose-500" /> Amenities
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {amenitiesList.map((amenity) => {
                    const Icon = amenity.icon;
                    const isSelected = filters.amenities.includes(amenity.id);
                    return (
                      <button
                        key={amenity.id}
                        onClick={() => handleAmenityToggle(amenity.id)}
                        className={`flex items-center gap-2 rounded-xl border px-3 sm:px-4 py-2.5 text-sm font-medium transition-all ${
                          isSelected
                            ? "border-rose-500 bg-rose-50 text-rose-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isSelected ? "text-rose-500" : "text-gray-400"}`} />
                        {amenity.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t pt-5 sm:pt-6">
              <button
                onClick={handleClearFilters}
                className="flex items-center justify-center sm:justify-start gap-2 text-sm font-semibold text-gray-600 underline hover:text-gray-900"
              >
                <RotateCcw className="h-4 w-4" /> Clear all
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="flex-1 sm:flex-none rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 sm:flex-none rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-black"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchFilters;
