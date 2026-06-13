import { useState, useEffect } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

export interface Listing {
  _id: string;
  title: string;
  location: { coordinates: number[]; address?: string };
  locationName: string;
  price: number;
  images?: string[];
  rating: number;
  reviewCount?: number;
  host?: {
    name: string;
    isSuperhost?: boolean;
  };
  category?: string;
}

interface MapContainerProps {
  listings: Listing[];
  searchCenter?: { lng: number; lat: number } | null; // <-- 1. Add this new prop
}

const MapContainer = ({ listings, searchCenter }: MapContainerProps) => {
  const navigate = useNavigate();

  // Initial state fallback
  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewState, setViewState] = useState({
    latitude: (listings[0] as any)?.location?.coordinates?.[1] || 22.5726,
    longitude: (listings[0] as any)?.location?.coordinates?.[0] || 88.3639,
    zoom: 11,
  });

  // Auto-center the map dynamically
  useEffect(() => {
    // PRIORITY 1: If the user searched a specific city, fly directly to it!
    if (searchCenter) {
      setViewState({
        longitude: searchCenter.lng,
        latitude: searchCenter.lat,
        zoom: 12, // Standard city zoom level
      });
    }
    // PRIORITY 2: If no specific search, but we have listings, center on the listings
    else if (listings.length > 0) {
      const validListings = listings.filter((l) => l?.location?.coordinates?.length >= 2);
      if (validListings.length === 0) return;
      const avgLng =
        validListings.reduce((sum, l) => sum + l.location.coordinates[0], 0) /
        validListings.length;
      const avgLat =
        validListings.reduce((sum, l) => sum + l.location.coordinates[1], 0) /
        validListings.length;

      setViewState({
        longitude: avgLng,
        latitude: avgLat,
        zoom: listings.length === 1 ? 14 : 11,
      });
    }
  }, [listings, searchCenter]); // Re-run whenever listings OR the search location changes

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  if (!mapboxToken) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-500">
        Missing Mapbox Token
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {!mapLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onLoad={() => setMapLoaded(true)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="bottom-right" />

        {listings.map((listing) => {
          const [longitude = 0, latitude = 0] = listing.location?.coordinates || [];
          return (
            <Marker
              key={listing._id}
              longitude={longitude}
              latitude={latitude}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                navigate(`/listing/${listing._id}`);
              }}
            >
              <div className="cursor-pointer rounded-full bg-white px-3 py-1.5 text-sm font-bold text-gray-900 shadow-[0_0_12px_rgba(0,0,0,0.15)] outline outline-1 outline-gray-200 transition-transform duration-200 hover:scale-110 hover:bg-black hover:text-white hover:outline-black">
                ₹{listing.price.toLocaleString("en-IN")}
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
};

export default MapContainer;
