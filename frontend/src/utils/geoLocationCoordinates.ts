export const getLocationFromCoordinates = async (
    longitude: number,
    latitude: number,
) => {
    try {
        const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}`,
        );

        const data = await response.json();

        if (data.features && data.features.length > 0) {
            return data.features[0].place_name;
        }

        return "Unknown location";
    } catch (error) {
        console.error("Location fetch failed:", error);
        return "Location unavailable";
    }
};