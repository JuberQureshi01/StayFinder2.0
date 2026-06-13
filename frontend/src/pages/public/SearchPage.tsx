import { useEffect, useState } from "react";

import SearchFilters from "@/components/listing/SearchFilters";
import MapContainer from "@/components/listing/MapContainer";
import ListingCard from "@/components/listing/ListingCard";
import { SkeletonCard } from "@/components/ui/skeleton";
import { apiGet } from "@/services/apiFetch";
import { PATHS } from "@/services/paths";
import { toast } from "sonner";
import { Map, List } from "lucide-react";

interface Listing {
  _id: string;
  title: string;
  location: { coordinates: number[]; address?: string };
  locationName: string;
  price: number;
  images?: string[];
  rating: number;
  reviewCount?: number;
  host?: { name: string; isSuperhost?: boolean };
  category?: string;
}

const SearchPage = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchCenter, setSearchCenter] = useState<{ lng: number; lat: number } | null>(null);
  const [showMap, setShowMap] = useState(false);

  const fetchData = async (filterPayload: any = {}) => {
    try {
      setLoading(true);
      if (filterPayload.lng && filterPayload.lat) {
        setSearchCenter({ lng: filterPayload.lng, lat: filterPayload.lat });
      } else if (Object.keys(filterPayload).length === 0) {
        setSearchCenter(null);
      }
      const response = await apiGet(PATHS.LISTING.GET_ALL, filterPayload);
      setListings(response?.listings || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="bg-white">
      <main className="flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
        <div className="z-30 border-b bg-white px-3 py-3 sm:px-6 sm:py-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Search Properties</h1>
          </div>
          <SearchFilters onSearch={fetchData} />
        </div>

        <div className="flex flex-1 overflow-hidden relative z-0">
          <div className={`w-full overflow-y-auto scroll-smooth ${showMap ? "hidden md:block md:w-[55%] xl:w-[60%]" : "w-full md:w-[55%] xl:w-[60%]"} pb-8`}>
            <div className="p-3 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {loading ? "Searching..." : `${listings.length} place${listings.length !== 1 ? "s" : ""} found`}
                </p>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (<SkeletonCard key={i} />))}
                </div>
              ) : listings.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-center mx-3 sm:mx-0">
                  <p className="text-lg font-semibold text-gray-900">No places found</p>
                  <p className="text-sm text-gray-500">Try adjusting your filters or moving the map.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2">
                  {listings.map((listing) => (
                    <ListingCard key={listing._id} listing={listing} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={`relative border-l bg-gray-100 ${showMap ? "w-full md:w-[45%] xl:w-[40%]" : "hidden md:block md:w-[45%] xl:w-[40%]"}`}>
            <div className="absolute inset-0">
              <MapContainer listings={listings} searchCenter={searchCenter} />
            </div>
          </div>
        </div>

        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 md:hidden">
          <button
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-black"
          >
            {showMap ? (
              <><List className="h-4 w-4" /> Show list</>
            ) : (
              <><Map className="h-4 w-4" /> Show map</>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};

export default SearchPage;
